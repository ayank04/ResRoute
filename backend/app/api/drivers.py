from fastapi import APIRouter, HTTPException
from app.services.firestore_service import firestore_service
import asyncio
from loguru import logger

router = APIRouter(prefix="/drivers", tags=["Drivers"])

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
async def list_drivers():
    """List all drivers with status + current assignment"""
    return await safe_call(firestore_service.list_drivers(), [])

@router.get("/available")
async def list_available_drivers():
    """List drivers with status 'available'"""
    drivers = await safe_call(firestore_service.list_drivers(), [])
    return [d for d in drivers if d.get("status") == "available"]

@router.get("/{driver_id}")
async def get_driver(driver_id: str):
    """Single driver full detail"""
    driver = await safe_call(firestore_service.get_driver(driver_id), None)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver

@router.post("/")
async def create_driver(data: dict):
    """Create driver"""
    driver_id = data.get("id")
    if not driver_id:
        raise HTTPException(status_code=422, detail="Driver ID required")
    await safe_call(firestore_service.save_driver(driver_id, data), None)
    return {"status": "ok", "driver_id": driver_id}

@router.post("/{driver_id}/status")
async def update_driver_status(driver_id: str, body: dict):
    """Update status { status }"""
    status = body.get("status")
    if status not in ["available", "on_trip", "offline", "break"]:
        raise HTTPException(status_code=422, detail="Invalid status")
    await safe_call(firestore_service.save_driver(driver_id, {"status": status}), None)
    return {"status": "ok"}
