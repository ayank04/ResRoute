from fastapi import APIRouter, HTTPException
from app.services.firestore_service import firestore_service
from datetime import datetime
from loguru import logger

router = APIRouter(prefix="/delivery", tags=["Public Delivery Tracking"])

@router.get("/{token}/live")
async def get_public_tracking(token: str):
    """
    Publicly accessible endpoint for delivery tracking.
    Requires no authentication, only a valid short-lived token.
    """
    try:
        # 1. Search for active route with this tracking token
        # In our mock store, we'll iterate. In production, this would be a Firestore query.
        active_routes = await firestore_service.get_all_active_routes()
        target_route = None
        for r in active_routes:
            if r.trackingToken == token:
                target_route = r
                break
        
        if not target_route:
            logger.warning(f"Tracking attempt with invalid token: {token}")
            raise HTTPException(status_code=404, detail="Tracking link invalid or expired")
            
        # 2. Check expiration
        if target_route.tokenExpiresAt and target_route.tokenExpiresAt < datetime.utcnow():
            logger.warning(f"Tracking attempt with expired token: {token}")
            raise HTTPException(status_code=410, detail="Tracking link has expired")
            
        # 3. Fetch associated vehicle for live position
        vehicle = await firestore_service.get_vehicle(target_route.id)
        
        # 4. Return simplified tracking payload
        return {
            "vehicleId": target_route.id,
            "driverName": vehicle.get("driverName", "ResRoute Driver") if vehicle else "ResRoute Driver",
            "currentPosition": vehicle.get("currentPosition", target_route.originCoords) if vehicle else target_route.originCoords,
            "destination": target_route.destination,
            "destinationCoords": target_route.destinationCoords,
            "status": vehicle.get("status", target_route.status) if vehicle else target_route.status,
            "etaMinutes": target_route.etaMinutes,
            "distanceKm": target_route.distanceKm,
            "updatedAt": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in public tracking: {e}")
        raise HTTPException(status_code=500, detail="Internal server error fetching tracking info")
