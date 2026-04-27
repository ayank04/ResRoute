import uuid
from datetime import datetime, timedelta
from loguru import logger
from app.services import firestore_service, routing_service, scheduler_service
from app.models.route_models import ActiveRoute, Coordinates, RouteCandidate

async def seed_demo_vehicles():
    """Create 6 fully functional demo vehicles with active routes if none exist."""
    
    # 1. Check if we already have active routes
    active_routes = await firestore_service.get_all_active_routes()
    if len(active_routes) > 0:
        logger.info(f"Skipping seed: {len(active_routes)} active routes already exist.")
        return

    logger.info("Starting seed process for 6 demo vehicles...")

    # Data for 6 Bengaluru-based routes
    demo_data = [
        {
            "id": "VH-001",
            "name": "Koramangala Express",
            "driver": "Rajan K",
            "origin": "Koramangala",
            "destination": "MG Road",
            "origin_coords": Coordinates(lat=12.9352, lon=77.6245),
            "dest_coords": Coordinates(lat=12.9756, lon=77.6097),
            "type": "truck",
            "cargo": "Medical Supplies",
            # Pre-defined path fallback
            "fallback_path": [
                {"lat": 12.9352, "lon": 77.6245},
                {"lat": 12.9450, "lon": 77.6200},
                {"lat": 12.9600, "lon": 77.6150},
                {"lat": 12.9756, "lon": 77.6097}
            ]
        },
        {
            "id": "VH-002",
            "name": "Whitefield Runner",
            "driver": "Suresh M",
            "origin": "Whitefield",
            "destination": "Indiranagar",
            "origin_coords": Coordinates(lat=12.9698, lon=77.7500),
            "dest_coords": Coordinates(lat=12.9784, lon=77.6408),
            "type": "car",
            "cargo": "Electronics",
            "fallback_path": [
                {"lat": 12.9698, "lon": 77.7500},
                {"lat": 12.9720, "lon": 77.7000},
                {"lat": 12.9750, "lon": 77.6600},
                {"lat": 12.9784, "lon": 77.6408}
            ]
        },
        {
            "id": "VH-003",
            "name": "Airport Link",
            "driver": "Anita R",
            "origin": "Kempegowda Airport",
            "destination": "Hebbal",
            "origin_coords": Coordinates(lat=13.1986, lon=77.7066),
            "dest_coords": Coordinates(lat=13.0358, lon=77.5970),
            "type": "truck",
            "cargo": "Aviation Parts",
            "fallback_path": [
                {"lat": 13.1986, "lon": 77.7066},
                {"lat": 13.1500, "lon": 77.6500},
                {"lat": 13.1000, "lon": 77.6200},
                {"lat": 13.0358, "lon": 77.5970}
            ]
        },
        {
            "id": "VH-004",
            "name": "ECity Commuter",
            "driver": "Vijay S",
            "origin": "Electronic City",
            "destination": "Silk Board",
            "origin_coords": Coordinates(lat=12.8452, lon=77.6639),
            "dest_coords": Coordinates(lat=12.9176, lon=77.6233),
            "type": "bike",
            "cargo": "Hot Meals",
            "fallback_path": [
                {"lat": 12.8452, "lon": 77.6639},
                {"lat": 12.8700, "lon": 77.6500},
                {"lat": 12.8900, "lon": 77.6400},
                {"lat": 12.9176, "lon": 77.6233}
            ]
        },
        {
            "id": "VH-005",
            "name": "HSR Local",
            "driver": "Priya D",
            "origin": "HSR Layout",
            "destination": "Banashankari",
            "origin_coords": Coordinates(lat=12.9121, lon=77.6446),
            "dest_coords": Coordinates(lat=12.9250, lon=77.5738),
            "type": "car",
            "cargo": "Grocery Delivery",
            "fallback_path": [
                {"lat": 12.9121, "lon": 77.6446},
                {"lat": 12.9150, "lon": 77.6200},
                {"lat": 12.9200, "lon": 77.6000},
                {"lat": 12.9250, "lon": 77.5738}
            ]
        },
        {
            "id": "VH-006",
            "name": "Tech Corridor",
            "driver": "Karthik P",
            "origin": "Marathahalli",
            "destination": "Jayanagar",
            "origin_coords": Coordinates(lat=12.9591, lon=77.6974),
            "dest_coords": Coordinates(lat=12.9307, lon=77.5833),
            "type": "truck",
            "cargo": "Furniture",
            "fallback_path": [
                {"lat": 12.9591, "lon": 77.6974},
                {"lat": 12.9500, "lon": 77.6600},
                {"lat": 12.9400, "lon": 77.6200},
                {"lat": 12.9307, "lon": 77.5833}
            ]
        }
    ]

    for i, v_data in enumerate(demo_data):
        try:
            # 2. Fetch real route path from OSRM/ORS with short timeout
            best_route = None
            try:
                candidates, _ = await routing_service.fetch_routes_with_fallback(
                    v_data["origin"], v_data["destination"], [], firestore_service
                )
                if candidates:
                    best_route = candidates[0]
            except Exception as e:
                logger.warning(f"Routing service failed for {v_data['id']}, using local fallback: {e}")

            if not best_route:
                # Use local hardcoded coordinates as fallback to prevent blocking startup
                fallback_steps = [Coordinates(lat=p["lat"], lon=p["lon"]) for p in v_data["fallback_path"]]
                best_route = RouteCandidate(
                    route_id=str(uuid.uuid4()),
                    duration_seconds=1800,
                    distance_meters=10000,
                    polyline="",
                    steps=fallback_steps,
                    risk_score=0.1
                )

            # 3. Create Driver Record
            driver_doc = {
                "id": v_data["id"],
                "name": v_data["driver"],
                "status": "EN_ROUTE",
                "currentPosition": {"lat": v_data["origin_coords"].lat, "lng": v_data["origin_coords"].lon},
                "vehicleType": v_data["type"],
                "avatar": f"https://i.pravatar.cc/150?u={v_data['id']}",
                "ecoScore": 85 + i,
                "fatigueRisk": "LOW",
                "phone": "+91 98765 43210",
                "email": f"{v_data['driver'].lower().replace(' ', '.')}@resroute.ai",
                "totalDeliveries": 120 + (i * 10),
                "onTimeRate": 98.5
            }
            await firestore_service.save_driver(v_data["id"], driver_doc)

            # 4. Create Vehicle Document
            vehicle_doc = {
                "id": v_data["id"],
                "name": v_data["name"],
                "vehicleType": v_data["type"],
                "status": "EN_ROUTE",
                "currentPosition": {"lat": v_data["origin_coords"].lat, "lng": v_data["origin_coords"].lon},
                "driverName": v_data["driver"],
                "currentDriverId": v_data["id"],
                "currentRouteId": v_data["id"],
                "cargo": v_data["cargo"],
                "priority": "normal" if i > 0 else "critical",
                "riskScore": 15 + (i * 5),
                "model": "Tata Ultra T.7" if v_data["type"] == "truck" else "Mahindra Treo",
                "licensePlate": f"KA-01-RR-{1000 + i}"
            }
            await firestore_service.save_vehicle(v_data["id"], vehicle_doc)

            # 5. Create Active Route Document
            active_route = ActiveRoute(
                id=v_data["id"],
                routeId=v_data["id"],
                driverId=v_data["id"],
                origin=v_data["origin"],
                destination=v_data["destination"],
                originCoords=v_data["origin_coords"],
                destinationCoords=v_data["dest_coords"],
                currentRoute=best_route,
                status="ACTIVE",
                currentRiskScore=15.0 + (i * 5),
                etaMinutes=round(best_route.duration_seconds / 60),
                distanceKm=round(best_route.distance_meters / 1000, 1),
                trackingToken=f"tracking-{v_data['id']}",
                tokenExpiresAt=datetime.utcnow() + timedelta(hours=24),
                createdAt=datetime.utcnow(),
                updatedAt=datetime.utcnow()
            )
            await firestore_service.save_route(active_route)

            # 6. Inject a sample disruption for the first vehicle
            if i == 0:
                dis_id = "D-001"
                disruption = {
                    "id": dis_id,
                    "type": "TRAFFIC",
                    "severity": "HIGH",
                    "location": {"lat": 12.9500, "lng": 77.6100},
                    "radiusMeters": 500,
                    "estimatedDelayMinutes": 15,
                    "isActive": True,
                    "isPredicted": False,
                    "createdAt": datetime.utcnow().isoformat(),
                    "expiresAt": (datetime.utcnow() + timedelta(hours=2)).isoformat()
                }
                await firestore_service.save_disruption(dis_id, disruption)

        except Exception as e:
            logger.error(f"Failed to seed vehicle {v_data['id']}: {e}")

    logger.info("Demo seeding completed successfully.")
