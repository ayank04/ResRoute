from fastapi import APIRouter
from app.services.firestore_service import firestore_service
import time
from datetime import datetime
import asyncio

router = APIRouter(prefix="/health", tags=["System"])

@router.get("")
async def health():
    """Must respond immediately even if Firestore is down"""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "firestore": "connected" if firestore_service.db else "down/mock",
            "scheduler": "active"
        }
    }
