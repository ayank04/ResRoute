import httpx
import uuid
import asyncio
import logging
from ..core.config import settings
from ..core.circuit_breaker import osrm_breaker, ors_breaker, CircuitBreakerOpen
from ..models.route_models import Coordinates, RouteCandidate

logger = logging.getLogger(__name__)

class GeocodingException(Exception): pass
class RoutingException(Exception): pass

def get_routing_profile(vehicle_type: str, vehicle: dict = None) -> dict:
  vehicle = vehicle or {}
  profiles = {
    "emergency": {
      "engine": "osrm",
      "profile": "driving",
      "ignore_risk_below": 0.9,
      "optimize_for": "speed",
      "ors_profile": "driving-car"
    },
    "delivery": {
      "engine": "osrm",
      "profile": "driving",
      "ignore_risk_below": 0.0,
      "optimize_for": "balanced",
      "ors_profile": "driving-car"
    },
    "corporate": {
      "engine": "osrm",
      "profile": "driving",
      "ignore_risk_below": 0.0,
      "optimize_for": "comfort",
      "ors_profile": "driving-car",
      "max_acceptable_risk": 0.45
    },
    "logistics": {
      "engine": "ors",
      "profile": "driving-hgv",
      "ignore_risk_below": 0.0,
      "optimize_for": "balanced",
      "ors_profile": "driving-hgv",
      "ors_options": {
        "vehicle_type": "hgv",
        "weight": vehicle.get("weightKg", 3500) / 1000,
        "height": vehicle.get("heightM", 4.0)
      }
    }
  }
  return profiles.get(vehicle_type, profiles["delivery"])

def get_reroute_threshold(vehicle_type: str) -> float:
    thresholds = {
        "emergency": 0.90,
        "delivery": 0.65,
        "corporate": 0.45,
        "logistics": 0.65
    }
    return thresholds.get(vehicle_type, 0.65)

geocoding_lock = asyncio.Lock()
last_geocoding_request_time = 0.0

async def geocode(address: str) -> Coordinates:
    global last_geocoding_request_time
    
    headers = {"User-Agent": settings.NOMINATIM_USER_AGENT}
    params = {"q": address, "format": "json", "limit": 1}
    
    async with geocoding_lock:
        now = asyncio.get_event_loop().time()
        elapsed = now - last_geocoding_request_time
        if elapsed < 1.0:
            await asyncio.sleep(1.0 - elapsed)
        
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(f"{settings.NOMINATIM_BASE_URL}/search", params=params, headers=headers)
                last_geocoding_request_time = asyncio.get_event_loop().time()
                
                if response.status_code != 200: 
                    raise GeocodingException(f"Nominatim failed with status {response.status_code}")
                
                data = response.json()
                if not data: 
                    raise GeocodingException(f"No results for: {address}")
                
                return Coordinates(lat=float(data[0]["lat"]), lon=float(data[0]["lon"]))
        except Exception as e:
            logger.warning(f"Geocoding failed for {address}: {e}")
            raise GeocodingException(f"Cannot geocode: {address}")

async def fetch_routes_osrm(origin_coords: Coordinates, destination_coords: Coordinates, profile: str = "driving") -> list[RouteCandidate]:
    url = f"{settings.OSRM_BASE_URL}/route/v1/{profile}/{origin_coords.lon},{origin_coords.lat};{destination_coords.lon},{destination_coords.lat}"
    params = {"alternatives": "true", "steps": "true", "geometries": "polyline", "overview": "full"}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            if response.status_code != 200: raise RoutingException("OSRM failed")
            data = response.json()
    except Exception as e:
        logger.warning(f"OSRM failed: {e}")
        raise RoutingException("OSRM failed")
    candidates = []
    for route in data.get("routes", [])[:3]:
        candidates.append(RouteCandidate(
            route_id=str(uuid.uuid4()),
            duration_seconds=int(route["duration"]),
            distance_meters=int(route["distance"]),
            polyline=route["geometry"],
            steps=route.get("legs", [{}])[0].get("steps", [])
        ))
    return candidates

async def fetch_routes_ors(origin_coords: Coordinates, destination_coords: Coordinates, profile: str = "driving-car", options: dict = None) -> list[RouteCandidate]:
    if not settings.ORS_BASE_URL or not settings.ORS_API_KEY: raise RoutingException("ORS not configured")
    url = f"{settings.ORS_BASE_URL}/v2/directions/{profile}"
    headers = {"Authorization": settings.ORS_API_KEY, "Content-Type": "application/json"}
    body = {
        "coordinates": [[origin_coords.lon, origin_coords.lat], [destination_coords.lon, destination_coords.lat]],
        "alternative_routes": {"share_factor": 0.6, "target_count": 3},
        "instructions": True, "geometry": True
    }
    if options: body["options"] = {"vehicle_type": options.get("vehicle_type", "car")}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers=headers, json=body)
            if response.status_code != 200: raise RoutingException("ORS failed")
            data = response.json()
    except Exception as e:
        logger.warning(f"ORS failed: {e}")
        raise RoutingException("ORS failed")
    candidates = []
    for route in data.get("routes", []):
        candidates.append(RouteCandidate(
            route_id=str(uuid.uuid4()),
            duration_seconds=int(route["summary"]["duration"]),
            distance_meters=int(route["summary"]["distance"]),
            polyline=route["geometry"],
            steps=route.get("segments", [{}])[0].get("steps", [])
        ))
    return candidates

def generate_mock_route(origin_coords: Coordinates, destination_coords: Coordinates) -> list[RouteCandidate]:
    """Generates a straight-line interpolated route as an emergency fallback"""
    steps = []
    # Create 20 interpolated points for a smooth-ish simulation
    for i in range(21):
        ratio = i / 20.0
        lat = origin_coords.lat + (destination_coords.lat - origin_coords.lat) * ratio
        lon = origin_coords.lon + (destination_coords.lon - origin_coords.lon) * ratio
        steps.append(Coordinates(lat=lat, lon=lon))
    
    return [RouteCandidate(
        route_id=f"mock-{uuid.uuid4().hex[:8]}",
        duration_seconds=1800,
        distance_meters=10000,
        polyline="",
        steps=steps,
        risk_score=0.1,
        stale=True
    )]

async def fetch_routes_with_fallback(origin: str, destination: str, waypoints: list[str], firestore_service, vehicle_type: str = "delivery") -> tuple[list[RouteCandidate], bool]:
    profile_cfg = get_routing_profile(vehicle_type)
    
    # Try geocoding
    origin_coords = None
    destination_coords = None
    try:
        origin_coords = await geocode(origin)
        destination_coords = await geocode(destination)
    except Exception:
        # If geocoding fails, try to get from cache
        cached = await firestore_service.get_cached_routes(origin, destination)
        if cached: return (cached, True)
        
        # Absolute fallback: neutral coordinates (0,0) or last known
        origin_coords = Coordinates(lat=12.9716, lon=77.5946) # Bangalore center
        destination_coords = Coordinates(lat=12.9352, lon=77.6245) # Koramangala
    
    # 1. ORS Primary (if configured)
    if profile_cfg["engine"] == "ors":
        try:
            return (await ors_breaker.call(fetch_routes_ors, origin_coords, destination_coords, profile_cfg["ors_profile"], profile_cfg.get("ors_options")), False)
        except Exception: pass

    # 2. OSRM Fallback
    try:
        return (await osrm_breaker.call(fetch_routes_osrm, origin_coords, destination_coords, profile_cfg["profile"]), False)
    except Exception: pass

    # 3. ORS secondary fallback
    try:
        return (await ors_breaker.call(fetch_routes_ors, origin_coords, destination_coords, profile_cfg["ors_profile"]), False)
    except Exception: pass

    # 4. Cache Fallback
    cached = await firestore_service.get_cached_routes(origin, destination)
    if cached: return (cached, True)
    
    # 5. Deterministic Mock Fallback (Crucial for simulation to never stop)
    logger.warning(f"All routing providers failed for {origin} -> {destination}. Generating mock path.")
    return (generate_mock_route(origin_coords, destination_coords), True)
