import asyncio
import random
import polyline
from datetime import datetime
from loguru import logger
from app.services import firestore_service, route_service
from app.core.websocket_manager import connection_manager

class SimulationEngine:
    def __init__(self):
        self.is_running = False
        # Tracks driver_id -> {current_index: int, total_points: int, points: list}
        self.driver_progress = {}

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        logger.bind(service_name="SIMULATION").info("Simulation Engine started")
        asyncio.create_task(self._simulation_loop())

    async def stop(self):
        self.is_running = False
        logger.bind(service_name="SIMULATION").info("Simulation Engine stopped")

    async def _simulation_loop(self):
        while self.is_running:
            try:
                await self._tick()
            except Exception as e:
                logger.bind(service_name="SIMULATION").error(f"Simulation tick failed: {e}")
            
            # Tick every 2 seconds for smoother demo movement
            await asyncio.sleep(2)

    async def _tick(self):
        routes = await firestore_service.get_all_active_routes()
        if not routes:
            return

        db = firestore_service.get_db()
        batch = db.batch() if db else None

        for route in routes:
            # 1. Update internal state
            new_pos = self._update_vehicle_state(route)
            if not new_pos:
                continue
            
            lat, lng = new_pos
            
            # 2. Persist to storage (using batch)
            await self._persist_vehicle_state(route, lat, lng, batch=batch)
            
            # 3. Broadcast to clients
            await self._broadcast_vehicle_update(route, lat, lng)
            
            # 4. Occasional risk update broadcast
            if random.random() < 0.1:
                await self._broadcast_risk_update(route)

        if batch:
            try:
                # Commit all updates in one go
                await firestore_service._run(batch.commit)
            except Exception:
                logger.exception("Simulation batch commit failed")

        # Occasionally inject a disruption (2% chance per tick)
        if random.random() < 0.02:
            await self._inject_random_disruption(routes)

    def _update_vehicle_state(self, route):
        driver_id = route.driverId
        
        # Initialize progress if new route
        if driver_id not in self.driver_progress or self.driver_progress[driver_id].get("route_id") != route.id:
            points = []
            if route.currentRoute and route.currentRoute.polyline:
                try:
                    points = polyline.decode(route.currentRoute.polyline)
                except Exception as e:
                    logger.bind(service_name="SIMULATION").warning(f"Failed to decode polyline for {driver_id}: {e}")
            
            # Fallback to steps if polyline decode failed or was missing
            if not points and route.currentRoute and route.currentRoute.steps:
                points = [(s.lat, s.lon) for s in route.currentRoute.steps]
                
            if points:
                self.driver_progress[driver_id] = {
                    "route_id": route.id,
                    "points": points,
                    "current_index": 0,
                    "total_points": len(points)
                }
                logger.bind(service_name="SIMULATION").info(f"Initialized simulation for {driver_id} with {len(points)} points")
            else:
                logger.bind(service_name="SIMULATION").debug(f"No points found for route {route.id}")
                return None

        progress = self.driver_progress[driver_id]
        
        # Advance driver (move 1-2 points per tick)
        move_speed = random.randint(1, 2)
        progress["current_index"] = min(progress["current_index"] + move_speed, progress["total_points"] - 1)
        
        return progress["points"][progress["current_index"]]

    async def _persist_vehicle_state(self, route, lat, lng, batch=None):
        progress = self.driver_progress[route.driverId]
        
        # 1. Prepare Route Updates
        route_updates = {
            "originCoords": {"lat": lat, "lon": lng},
            "updatedAt": datetime.utcnow().isoformat()
        }
        
        # 2. Prepare Vehicle Updates
        vehicle_id = route.id # In our seed system, route.id == vehicle_id
        vehicle_updates = {
            "currentPosition": {"lat": lat, "lng": lng},
            "updatedAt": datetime.utcnow().isoformat(),
            "status": "EN_ROUTE"
        }
        
        # If reached end, mark both as completed
        if progress["current_index"] >= progress["total_points"] - 1:
            route_updates["status"] = "COMPLETED"
            vehicle_updates["status"] = "COMPLETED"
            
            # Calculate CO2 saved
            distance_km = route.distanceKm
            co2_saved = round(distance_km * 0.1, 2)
            route_updates["co2_saved_kg"] = co2_saved
            await firestore_service.increment_co2_summary(co2_saved)

        if batch:
            db = firestore_service.get_db()
            # Update Route
            route_ref = db.collection("routes").document(route.id)
            batch.update(route_ref, route_updates)
            # Update Vehicle
            vehicle_ref = db.collection("vehicles").document(vehicle_id)
            batch.update(vehicle_ref, vehicle_updates)
        else:
            await firestore_service.update_route(route.id, route_updates)
            await firestore_service.save_vehicle(vehicle_id, vehicle_updates)

    async def _broadcast_vehicle_update(self, route, lat, lng):
        driver_id = route.driverId
        progress = self.driver_progress[driver_id]
        
        is_completed = progress["current_index"] >= progress["total_points"] - 1
        
        # Push live update via WebSocket
        await connection_manager.push_event(driver_id, {
            "type": "vehicle_update",
            "payload": {
                "id": driver_id,
                "currentPosition": {"lat": lat, "lng": lng},
                "status": "COMPLETED" if is_completed else "EN_ROUTE"
            }
        })

    async def _broadcast_risk_update(self, route):
        # Slightly jitter the risk for demo effect
        jitter = random.uniform(-2, 2)
        base_risk = route.currentRiskScore
        new_risk = max(5, min(95, base_risk + jitter))
        
        await connection_manager.push_event(route.driverId, {
            "type": "risk_update",
            "payload": {
                "vehicleId": route.driverId,
                "riskScore": round(new_risk, 1),
                "trend": "UP" if jitter > 0 else "DOWN"
            }
        })

    async def _tick_single_route(self, route_id: str):
        """Simulate a single tick for one specific route (used by APScheduler)"""
        route = await firestore_service.get_route(route_id)
        if not route or route.status != "ACTIVE":
            return
            
        new_pos = self._update_vehicle_state(route)
        if not new_pos:
            return
            
        lat, lng = new_pos
        await self._persist_vehicle_state(route, lat, lng)
        await self._broadcast_vehicle_update(route, lat, lng)

    async def _inject_random_disruption(self, routes):
        target_route = random.choice(routes)
        disruption_types = ["ACCIDENT", "TRAFFIC", "WEATHER"]
        d_type = random.choice(disruption_types)
        
        # Create a disruption near the driver
        pos = target_route.originCoords
        event = {
            "event_id": f"sim_{random.randint(1000, 9999)}",
            "type": d_type,
            "severity": "HIGH" if random.random() > 0.5 else "MEDIUM",
            "location": {"lat": pos.lat + 0.001, "lng": pos.lon + 0.001},
            "radiusMeters": 500,
            "timestamp": datetime.utcnow().isoformat(),
            "reason": f"Simulated {d_type.lower()} detected on route path",
            "title": f"Live {d_type.title()} Detected"
        }
        
        logger.bind(service_name="SIMULATION").info(f"Injecting disruption {d_type} for route {target_route.routeId}")
        await firestore_service.log_disruption(target_route.routeId, target_route.driverId, event)
        
        # Notify the dispatcher UI via WebSocket
        await connection_manager.push_event(target_route.driverId, {
            "type": "disruption_detected",
            "payload": event
        })

simulation_engine = SimulationEngine()
