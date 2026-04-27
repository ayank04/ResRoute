from fastapi import APIRouter, HTTPException
from app.services.firestore_service import firestore_service
from datetime import datetime
import asyncio
from loguru import logger

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

async def safe_call(coro, fallback):
    """Ensure Firestore calls never block or hang the route"""
    try:
        return await asyncio.wait_for(coro, timeout=5.0)
    except asyncio.TimeoutError:
        logger.warning("Firestore operation timed out — returning fallback/mock data")
        return fallback
    except Exception as e:
        logger.error(f"Firestore operation failed: {e} — returning fallback/mock data")
        return fallback

@router.get("/")
async def list_vehicles():
    """List all vehicles with current driver + route"""
    # firestore_service.list_vehicles already returns mock data on failure
    return await safe_call(firestore_service.list_vehicles(), [])

@router.get("/{vehicle_id}")
async def get_vehicle(vehicle_id: str):
    """Single vehicle full detail"""
    vehicle = await safe_call(firestore_service.get_vehicle(vehicle_id), None)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@router.post("/")
async def create_vehicle(data: dict):
    """Create vehicle"""
    vehicle_id = data.get("id")
    if not vehicle_id:
        raise HTTPException(status_code=422, detail="Vehicle ID required")
    await safe_call(firestore_service.save_vehicle(vehicle_id, data), None)
    return {"status": "ok", "vehicle_id": vehicle_id}

@router.post("/{vehicle_id}/lock")
async def lock_vehicle(vehicle_id: str, body: dict):
    updates = {
        "isLocked": True,
        "lockedBy": body.get("lockedBy"),
        "lockedAt": datetime.utcnow().isoformat()
    }
    await safe_call(firestore_service.save_vehicle(vehicle_id, updates), None)
    return {"status": "ok"}

@router.post("/{vehicle_id}/unlock")
async def unlock_vehicle(vehicle_id: str):
    updates = {
        "isLocked": False,
        "lockedBy": None,
        "lockedAt": None
    }
    await safe_call(firestore_service.save_vehicle(vehicle_id, updates), None)
    return {"status": "ok"}

@router.post("/{vehicle_id}/priority")
async def set_priority(vehicle_id: str, body: dict):
    priority = body.get("priority")
    if priority not in ["critical", "normal", "low"]:
        raise HTTPException(status_code=422, detail="Invalid priority")
    await safe_call(firestore_service.save_vehicle(vehicle_id, {"priority": priority}), None)
    return {"status": "ok"}

@router.post("/{vehicle_id}/assign")
async def assign_vehicle(vehicle_id: str, body: dict):
    driver_id = body.get("driverId")
    if not driver_id:
        raise HTTPException(status_code=422, detail="Driver ID required")
    
    await safe_call(firestore_service.save_vehicle(vehicle_id, {"currentDriverId": driver_id}), None)
    await safe_call(firestore_service.save_driver(driver_id, {"currentVehicleId": vehicle_id, "status": "on_trip"}), None)
    return {"status": "ok"}
