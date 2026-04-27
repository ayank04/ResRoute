from fastapi import APIRouter, HTTPException
from app.services.firestore_service import firestore_service
from datetime import datetime
import asyncio
from loguru import logger

router = APIRouter(prefix="/disruptions", tags=["Disruptions"])

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
async def list_disruptions(active: bool = None):
    """All disruptions (filterable: ?active=true)"""
    return await safe_call(firestore_service.list_disruptions(active_only=active), [])

@router.get("/{disruption_id}")
async def get_disruption(disruption_id: str):
    """Single disruption"""
    dis = await safe_call(firestore_service.get_disruption(disruption_id), None)
    if not dis:
        raise HTTPException(status_code=404, detail="Disruption not found")
    return dis

@router.post("/")
async def create_disruption(data: dict):
    """Create manual disruption"""
    dis_id = data.get("id") or f"dis_{int(datetime.utcnow().timestamp())}"
    data["id"] = dis_id
    data["isActive"] = True
    await safe_call(firestore_service.save_disruption(dis_id, data), None)
    return {"status": "ok", "id": dis_id}

@router.post("/{disruption_id}/resolve")
async def resolve_disruption(disruption_id: str):
    """Mark resolved"""
    updates = {
        "isActive": False,
        "resolvedAt": datetime.utcnow().isoformat()
    }
    await safe_call(firestore_service.save_disruption(disruption_id, updates), None)
    return {"status": "ok"}
