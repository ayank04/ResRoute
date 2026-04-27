import asyncio
from datetime import datetime
from fastapi import HTTPException
from ..core.config import settings
from . import firestore_service
from .routing_service import fetch_routes_with_fallback
from ..core.websocket_manager import connection_manager
from . import scoring_service
from ..models.response_models import HealResponse
from ..models.route_models import ActiveRoute
from .weather_service import get_weather
from .risk_engine import risk_engine
from loguru import logger

async def monitor_route(route_id: str) -> None:
    route = await firestore_service.get_route(route_id)
    if not route:
        return
    
    if route.status != "ACTIVE":
        return

    try:
        candidates, stale = await fetch_routes_with_fallback(
            route.origin, route.destination, [], firestore_service
        )
    except Exception:
        return

    if stale:
        return

    weather = await get_weather(
        route.originCoords.lat, route.originCoords.lon
    )

    current_risk = await risk_engine.compute_risk(route.currentRoute, weather)
    route.currentRoute.risk_score = current_risk

    if current_risk <= settings.REROUTE_RISK_THRESHOLD:
        return

    risk_scores = await asyncio.gather(*[
        risk_engine.compute_risk(c, weather)
        for c in candidates
    ], return_exceptions=True)
    risk_scores = [r if isinstance(r, float) else 0.3 for r in risk_scores]

    scored = scoring_service.score_routes(candidates, risk_scores)
    best = scored[0] if scored else None
    
    if not best:
        return

    # Compare route IDs (currentRoute.route_id is snake_case in OSRM payload)
    if best.route_id == route.currentRoute.route_id:
        return

    improvement = route.currentRoute.score - best.score
    if improvement <= 0.1:
        return

    disruption_event = {
        "timestamp": datetime.utcnow().isoformat(),
        "reason": "risk_threshold_exceeded",
        "oldRisk": current_risk,
        "newRisk": best.risk_score,
        "improvement": improvement
    }

    route.currentRoute = best
    route.alternateRoutes = scored[1:] if len(scored) > 1 else []
    route.rerouteCount += 1
    route.status = "REROUTING"
    route.disruptionLog.append(disruption_event)
    route.updatedAt = datetime.utcnow()

    # update_route in firestore_service expects a dict
    await firestore_service.update_route(route_id, route.model_dump(by_alias=True))

    await connection_manager.push_event(route.driverId, {
        "type": "reroute_event",
        "payload": route.model_dump() # Broadcast camelCase to frontend
    })

    route.status = "ACTIVE"
    route.updatedAt = datetime.utcnow()
    
    await firestore_service.update_route(route_id, route.model_dump(by_alias=True))

async def manual_heal(route_id: str) -> HealResponse:
    route = await firestore_service.get_route(route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
        
    old_risk = route.currentRoute.risk_score
    
    await monitor_route(route_id)
    
    updated = await firestore_service.get_route(route_id)
    new_risk = updated.currentRoute.risk_score
    rerouted = updated.rerouteCount > route.rerouteCount
    
    return HealResponse(
        healed=True,
        rerouted=rerouted,
        old_risk=old_risk,
        new_risk=new_risk,
        message="Rerouted successfully" if rerouted else "No reroute needed"
    )

async def heal_all_active_routes() -> dict:
    """Trigger a monitor pass for every active route"""
    active_routes = await firestore_service.get_all_active_routes()
    if not active_routes:
        return {"status": "ok", "message": "No active routes to heal", "count": 0}
    
    tasks = [monitor_route(r.id) for r in active_routes]
    await asyncio.gather(*tasks, return_exceptions=True)
    
    return {
        "status": "ok",
        "message": f"Triggered healing for {len(active_routes)} routes",
        "count": len(active_routes)
    }
