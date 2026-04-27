from apscheduler.schedulers.asyncio import AsyncIOScheduler
import asyncio
import random
from loguru import logger
from app.services import firestore_service, self_heal_service
from app.services.routing_service import get_reroute_threshold
from app.core.websocket_manager import connection_manager

scheduler = AsyncIOScheduler(timezone="UTC")

async def monitor_active_routes():
    """Periodic task to evaluate risk and trigger self-healing if needed."""
    try:
        routes = await firestore_service.get_all_active_routes()
        if not routes:
            return
        
        # Fetch vehicles to check for priority and locks
        route_data_list = []
        for r in routes:
            v = await firestore_service.get_vehicle(r.driverId)
            if not v:
                # Fallback mock for demo
                v = {"id": r.driverId, "type": "delivery", "isEmergency": False, "priority": "normal", "isLocked": False}
            route_data_list.append({"route": r, "vehicle": v})

        # Sort: emergency first, then critical priority, then by risk score desc
        route_data_list.sort(key=lambda x: (
            0 if x["vehicle"].get("isEmergency") else 1,
            0 if x["vehicle"].get("priority") == "critical" else 1,
            -x["route"].currentRoute.risk_score if x["route"].currentRoute else 0
        ))

        for item in route_data_list:
            route = item["route"]
            vehicle = item["vehicle"]
            
            # Skip locked vehicles
            if vehicle.get("isLocked"):
                continue

            current_risk = route.currentRiskScore
            threshold = get_reroute_threshold(vehicle.get("vehicleType", "delivery"))
            
            if current_risk > threshold:
                logger.bind(service_name="SCHEDULER").info(f"Risk threshold exceeded for vehicle {route.driverId}: {current_risk} > {threshold}")
                
                # Check for better alternates in the existing list
                better_found = False
                if route.alternateRoutes:
                    for alt in route.alternateRoutes:
                        if alt.risk_score < threshold:
                            logger.bind(service_name="SCHEDULER").info(f"Found better alternate for {route.driverId}. Risk: {alt.risk_score}")
                            await self_heal_service.manual_heal(route.id)
                            better_found = True
                            break
                
                # If no existing alternates are good, or force a fresh check
                if not better_found:
                    logger.bind(service_name="SCHEDULER").info(f"No good alternates in cache for {route.driverId}, triggering fresh heal")
                    await self_heal_service.manual_heal(route.id)

    except Exception as e:
        logger.error(f"Error in monitor_active_routes: {e}")

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(monitor_active_routes, "interval", seconds=30, id="monitor_active_routes")
        scheduler.start()
        logger.bind(service_name="SCHEDULER").info("Scheduler started — monitoring every 30 seconds with priority logic")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.bind(service_name="SCHEDULER").info("Scheduler stopped")
