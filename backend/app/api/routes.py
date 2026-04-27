from fastapi import APIRouter, HTTPException, Request
from app.services.firestore_service import firestore_service
from app.services import route_service, self_heal_service
from app.models.route_models import RouteRequest, ActiveRoute, RerouteRequest, RerouteAllRequest
from loguru import logger
import asyncio

router = APIRouter(tags=["Routes"])

async def safe_call(coro, fallback):
    try:
        return await asyncio.wait_for(coro, timeout=5.0)
    except asyncio.TimeoutError:
        logger.warning("Firestore call timed out — using fallback")
        return fallback
    except Exception as e:
        logger.error(f"Firestore call failed: {e}")
        return fallback

@router.get("/")
async def list_routes(status: str = None, vehicleId: str = None):
    """All routes (filterable: ?status=active&vehicleId=)"""
    return await safe_call(
        firestore_service.list_routes(status=status, vehicle_id=vehicleId),
        []
    )

@router.get("/active")
async def list_active_routes():
    """Active routes only with full detail"""
    return await safe_call(route_service.list_active_routes(), [])

@router.get("/{route_id}")
async def get_route(route_id: str):
    """Single route full detail + segments"""
    route = await safe_call(firestore_service.get_route(route_id), None)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route

@router.post("/")
async def create_route(request: RouteRequest):
    """Create and start a new route"""
    try:
        return await asyncio.wait_for(route_service.create_route(request), timeout=8.0)
    except Exception as e:
        logger.error(f"Route creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reroute")
async def manual_reroute(body: RerouteRequest):
    """Manual reroute { vehicleId, reason? }"""
    vehicle_id = body.vehicleId
    routes = await safe_call(firestore_service.list_routes(status="ACTIVE", vehicle_id=vehicle_id), [])
    if not routes:
        raise HTTPException(status_code=404, detail="Active route for vehicle not found")
    
    route_id = routes[0].get("route_id")
    return await asyncio.wait_for(self_heal_service.manual_heal(route_id), timeout=8.0)

@router.post("/seed")
async def force_seed():
    """Wipe mock store and re-run seeding"""
    from app.services import firestore_service
    from app.services.seed_service import seed_demo_vehicles
    
    # Clear mock store
    firestore_service._mock_store["routes"] = []
    firestore_service._mock_store["vehicles"] = []
    firestore_service._mock_store["drivers"] = []
    firestore_service._mock_store["disruptions"] = []
    
    await seed_demo_vehicles()
    return {"status": "ok", "message": "Demo data seeded successfully"}

@router.post("/reroute/all")
async def reroute_all(body: RerouteAllRequest = None):
    """Trigger reroute for all active vehicles"""
    try:
        # This is a heavy operation, giving it more time
        return await asyncio.wait_for(self_heal_service.heal_all_active_routes(), timeout=30.0)
    except Exception as e:
        logger.error(f"Heal all failed: {e}")
        return {"status": "error", "message": str(e)}
