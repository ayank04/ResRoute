import uuid
import asyncio
import logging
from datetime import datetime, timedelta
from fastapi import HTTPException
from ..models.route_models import RouteRequest, ActiveRoute
from ..models.route_models import Coordinates, RouteCandidate
from ..models.response_models import RouteCreateResponse, RouteStatusResponse
from .routing_service import fetch_routes_with_fallback, geocode
from . import firestore_service
from . import scoring_service
from .weather_service import get_weather
from .risk_engine import risk_engine

logger = logging.getLogger(__name__)

async def create_route(request: RouteRequest) -> RouteCreateResponse:
    try:
        candidates, stale = await fetch_routes_with_fallback(
            request.origin, request.destination, request.waypoints, firestore_service
        )
    except Exception as e:
        logger.warning("Route provider failed for %s -> %s: %s", request.origin, request.destination, e)
        stale = True
        candidates = [
            RouteCandidate(
                route_id=str(uuid.uuid4()),
                duration_seconds=1800,
                distance_meters=10000,
                polyline="",
                steps=[],
                stale=True,
            )
        ]

    try:
        origin_coords = await geocode(request.origin)
    except Exception as e:
        logger.warning("Origin geocode failed for %s: %s", request.origin, e)
        origin_coords = Coordinates(lat=0.0, lon=0.0)

    try:
        destination_coords = await geocode(request.destination)
    except Exception as e:
        logger.warning("Destination geocode failed for %s: %s", request.destination, e)
        destination_coords = Coordinates(lat=0.0, lon=0.0)

    try:
        weather = await get_weather(origin_coords.lat, origin_coords.lon)
    except Exception as e:
        logger.warning("Weather service failed, using empty weather payload: %s", e)
        weather = {}

    try:
        risk_scores = await asyncio.gather(
            *[risk_engine.compute_risk(c, weather) for c in candidates],
            return_exceptions=True,
        )
        risk_scores = [r if isinstance(r, float) else 0.3 for r in risk_scores]
    except Exception as e:
        logger.warning("Risk engine batch failed, using neutral risk defaults: %s", e)
        risk_scores = [0.3 for _ in candidates]

    try:
        scored = scoring_service.score_routes(candidates, risk_scores)
    except Exception as e:
        logger.warning("Scoring failed, using provider order as fallback: %s", e)
        scored = candidates
        for i, candidate in enumerate(scored):
            candidate.risk_score = risk_scores[i] if i < len(risk_scores) else 0.3
            candidate.score = float(i + 1)

    best = scored[0] if scored else None
    
    if best:
        best.risk_score = risk_scores[0] if risk_scores else 0.3
        
    route_id = str(uuid.uuid4())
    tracking_token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(hours=24)
    
    active_route = ActiveRoute(
        id=route_id,
        route_id=route_id,
        driver_id=request.driver_id,
        origin=request.origin,
        destination=request.destination,
        origin_coords=origin_coords,
        destination_coords=destination_coords,
        current_route=best,
        alternate_routes=scored[1:] if len(scored) > 1 else [],
        status="ACTIVE",
        current_risk_score=risk_scores[0] if risk_scores else 0.3,
        eta_minutes=round(best.duration_seconds / 60) if best else 0,
        distance_km=round(best.distance_meters / 1000, 1) if best else 0.0,
        tracking_token=tracking_token,
        token_expires_at=expires_at,
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow()
    )
    
    try:
        await firestore_service.save_route(active_route)
    except Exception as e:
        logger.warning("Failed to persist route %s to Firestore: %s", active_route.id, e)
    
    return RouteCreateResponse(
        route_id=active_route.id,
        driver_id=request.driver_id,
        best_route=best,
        ranked_routes=scored,
        stale=stale
    )

async def list_active_routes() -> list[ActiveRoute]:
    try:
        return await firestore_service.get_all_active_routes()
    except Exception as e:
        logger.warning("Failed to list active routes from Firestore: %s", e)
        return []

async def get_route_status(route_id: str) -> RouteStatusResponse:
    route = await firestore_service.get_route(route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
        
    return RouteStatusResponse(
        route_id=route.id,
        driver_id=route.driverId,
        status=route.status,
        risk_score=route.currentRoute.risk_score,
        eta_seconds=route.currentRoute.duration_seconds,
        reroute_count=route.rerouteCount,
        disruption_log=route.disruptionLog
    )
