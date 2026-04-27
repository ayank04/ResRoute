import asyncio
from functools import partial
import os
import random
from datetime import datetime, timedelta
from app.models.route_models import ActiveRoute, RouteCandidate, Coordinates
from loguru import logger

try:
    import firebase_admin
    from firebase_admin import firestore
except Exception:
    firebase_admin = None
    firestore = None

CACHE_TTL_HOURS = int(os.getenv("CACHE_TTL_HOURS", 2))

# --- IN-MEMORY MOCK STORE (Fallback) ---
_mock_store = {
    "vehicles": [],
    "drivers": [],
    "routes": [],
    "disruptions": [],
    "ai_decisions": [],
    "driver_reports": [],
    "app_settings": {"dispatch": {"autoReroute": True, "riskThreshold": 0.65}},
    "analytics_summary": {"co2": {"daily": 12.4, "weekly": 84.2, "monthly": 342.1, "totalSaved": 120.5}}
}

class FirestoreService:
    def __init__(self):
        self.db = None
        self._initialized = False

    def initialize(self):
        if self._initialized: return
        try:
            if not firebase_admin or not firebase_admin._apps:
                return
            self.db = firestore.client()
            self._initialized = True
            logger.bind(service_name="FIRESTORE").info("Firestore client initialized")
        except Exception as e:
            logger.bind(service_name="FIRESTORE").error(f"Firestore init failed: {e}")

    def get_db(self):
        return self.db

    async def _run(self, func, *args, **kwargs):
        try:
            loop = asyncio.get_event_loop()
            return await asyncio.wait_for(
                loop.run_in_executor(None, partial(func, *args, **kwargs)),
                timeout=2.0
            )
        except Exception:
            raise

    # --- VEHICLES ---
    async def list_vehicles(self) -> list[dict]:
        try:
            db = self.get_db()
            if db:
                docs = await self._run(db.collection("vehicles").get)
                res = [doc.to_dict() for doc in docs]
                if res: return res
        except Exception: pass
        return _mock_store["vehicles"]

    async def get_vehicle(self, vehicle_id: str) -> dict | None:
        try:
            db = self.get_db()
            if db:
                doc = await self._run(db.collection("vehicles").document(vehicle_id).get)
                if doc.exists: return doc.to_dict()
        except Exception: pass
        return next((v for v in _mock_store["vehicles"] if v["id"] == vehicle_id), None)

    async def save_vehicle(self, vehicle_id: str, data: dict) -> None:
        existing = next((v for v in _mock_store["vehicles"] if v["id"] == vehicle_id), None)
        if existing: existing.update(data)
        else: _mock_store["vehicles"].append({**data, "id": vehicle_id})
        try:
            db = self.get_db()
            if db: await self._run(db.collection("vehicles").document(vehicle_id).set, data, merge=True)
        except Exception: pass

    # --- DRIVERS ---
    async def list_drivers(self) -> list[dict]:
        try:
            db = self.get_db()
            if db:
                docs = await self._run(db.collection("drivers").get)
                res = [doc.to_dict() for doc in docs]
                if res: return res
        except Exception: pass
        return _mock_store["drivers"]

    async def get_driver(self, driver_id: str) -> dict | None:
        try:
            db = self.get_db()
            if db:
                doc = await self._run(db.collection("drivers").document(driver_id).get)
                if doc.exists: return doc.to_dict()
        except Exception: pass
        return next((d for d in _mock_store["drivers"] if d["id"] == driver_id), None)

    async def save_driver(self, driver_id: str, data: dict) -> None:
        existing = next((d for d in _mock_store["drivers"] if d["id"] == driver_id), None)
        if existing: existing.update(data)
        else: _mock_store["drivers"].append({**data, "id": driver_id})
        try:
            db = self.get_db()
            if db: await self._run(db.collection("drivers").document(driver_id).set, data, merge=True)
        except Exception: pass

    # --- ROUTES ---
    async def save_route(self, route: ActiveRoute) -> None:
        data = route.model_dump(by_alias=True)
        _mock_store["routes"] = [r for r in _mock_store["routes"] if r.get("id") != route.id]
        _mock_store["routes"].append(data)
        try:
            db = self.get_db()
            if db: await self._run(db.collection("routes").document(route.id).set, data, merge=True)
        except Exception: pass

    async def get_route(self, route_id: str) -> ActiveRoute | None:
        try:
            db = self.get_db()
            if db:
                doc = await self._run(db.collection("routes").document(route_id).get)
                if doc.exists: return ActiveRoute(**doc.to_dict())
        except Exception: pass
        data = next((r for r in _mock_store["routes"] if r.get("id") == route_id or r.get("route_id") == route_id), None)
        return ActiveRoute(**data) if data else None

    async def list_routes(self, status: str = None, vehicle_id: str = None) -> list[dict]:
        try:
            db = self.get_db()
            if db:
                query = db.collection("routes")
                if status: query = query.where("status", "==", status.upper())
                if vehicle_id: query = query.where("vehicle_id", "==", vehicle_id)
                docs = await self._run(query.get)
                res = [doc.to_dict() for doc in docs]
                if res: return res
        except Exception: pass
        res = _mock_store["routes"]
        if status: res = [r for r in res if r.get("status") == status.upper()]
        if vehicle_id: res = [r for r in res if r.get("vehicle_id") == vehicle_id]
        return res

    async def update_route(self, route_id: str, updates: dict) -> None:
        data = next((r for r in _mock_store["routes"] if r.get("id") == route_id or r.get("route_id") == route_id), None)
        if data: data.update(updates)
        try:
            db = self.get_db()
            if db: await self._run(db.collection("routes").document(route_id).update, updates)
        except Exception: pass

    async def get_all_active_routes(self) -> list[ActiveRoute]:
        try:
            db = self.get_db()
            if db:
                docs = await self._run(db.collection("routes").where("status", "==", "ACTIVE").get)
                res = [ActiveRoute(**doc.to_dict()) for doc in docs]
                if res: return res
        except Exception: pass
        return [ActiveRoute(**r) for r in _mock_store["routes"] if r.get("status") == "ACTIVE"]

    # --- DISRUPTIONS ---
    async def list_disruptions(self, active_only: bool = False) -> list[dict]:
        try:
            db = self.get_db()
            if db:
                query = db.collection("disruptions")
                if active_only: query = query.where("isActive", "==", True)
                docs = await self._run(query.get)
                res = [doc.to_dict() for doc in docs]
                if res: return res
        except Exception: pass
        res = _mock_store["disruptions"]
        if active_only: res = [d for d in res if d.get("active") or d.get("isActive")]
        return res

    async def get_disruption(self, disruption_id: str) -> dict | None:
        try:
            db = self.get_db()
            if db:
                doc = await self._run(db.collection("disruptions").document(disruption_id).get)
                if doc.exists: return doc.to_dict()
        except Exception: pass
        return next((d for d in _mock_store["disruptions"] if d["id"] == disruption_id), None)

    async def save_disruption(self, disruption_id: str, data: dict) -> None:
        existing = next((d for d in _mock_store["disruptions"] if d["id"] == disruption_id), None)
        if existing: existing.update(data)
        else: _mock_store["disruptions"].append({**data, "id": disruption_id})
        try:
            db = self.get_db()
            if db: await self._run(db.collection("disruptions").document(disruption_id).set, data, merge=True)
        except Exception: pass

    # --- CACHE & HISTORY ---
    async def get_cached_routes(self, origin: str, destination: str) -> list[RouteCandidate]:
        try:
            db = self.get_db()
            if db:
                docs = await self._run(db.collection("routes").where("origin", "==", origin).where("destination", "==", destination).get)
                if docs:
                    data = docs[0].to_dict()
                    return [RouteCandidate(**r) for r in data.get("alternateRoutes", [])]
        except Exception: pass
        # Search mock store
        match = next((r for r in _mock_store["routes"] if r.get("origin") == origin and r.get("destination") == destination), None)
        if match:
            return [RouteCandidate(**r) for r in match.get("alternateRoutes", [])]
        return []

    async def get_route_history(self, limit: int = 50) -> list[dict]:
        try:
            db = self.get_db()
            if db:
                docs = await self._run(db.collection("routes").where("status", "==", "COMPLETED").limit(limit).get)
                return [doc.to_dict() for doc in docs]
        except Exception: pass
        return [r for r in _mock_store["routes"] if r.get("status") == "COMPLETED"]

    async def count_routes(self) -> int:
        try:
            db = self.get_db()
            if db:
                docs = await self._run(db.collection("routes").get)
                return len(list(docs))
        except Exception: pass
        return len(_mock_store["routes"])

    # --- ANALYTICS ---
    async def get_app_settings(self) -> dict:
        try:
            db = self.get_db()
            if db:
                doc = await self._run(db.collection("app_settings").document("dispatch").get)
                if doc.exists: return doc.to_dict()
        except Exception: pass
        return _mock_store["app_settings"]["dispatch"]

    async def get_co2_summary(self) -> dict:
        try:
            db = self.get_db()
            if db:
                doc = await self._run(db.collection("analytics").document("co2_summary").get)
                if doc.exists: return doc.to_dict()
        except Exception: pass
        return _mock_store["analytics_summary"]["co2"]

    async def increment_co2_summary(self, co2_saved_kg: float) -> None:
        s = _mock_store["analytics_summary"]["co2"]
        for k in ["totalSaved", "daily", "weekly", "monthly"]:
            s[k] = s.get(k, 0.0) + co2_saved_kg
        try:
            db = self.get_db()
            if db:
                doc_ref = db.collection("analytics").document("co2_summary")
                await self._run(doc_ref.update, {
                    "totalSaved": firestore.Increment(co2_saved_kg),
                    "daily": firestore.Increment(co2_saved_kg),
                    "updatedAt": datetime.utcnow().isoformat()
                })
        except Exception: pass

    async def log_disruption(self, route_id: str, driver_id: str, event: dict) -> None:
        event["id"] = event.get("event_id") or f"dis_{random.randint(1000, 9999)}"
        _mock_store["disruptions"].append(event)
        try:
            db = self.get_db()
            if db: await self._run(db.collection("disruptions").add, event)
        except Exception: pass

    async def log_ai_decision(self, decision: dict) -> None:
        _mock_store["ai_decisions"].append(decision)
        try:
            db = self.get_db()
            if db: await self._run(db.collection("ai_decisions").add, decision)
        except Exception: pass

# Singleton
firestore_service = FirestoreService()

# Exports
list_vehicles = firestore_service.list_vehicles
get_vehicle = firestore_service.get_vehicle
save_vehicle = firestore_service.save_vehicle
list_drivers = firestore_service.list_drivers
get_driver = firestore_service.get_driver
save_driver = firestore_service.save_driver
save_route = firestore_service.save_route
get_route = firestore_service.get_route
list_routes = firestore_service.list_routes
update_route = firestore_service.update_route
get_all_active_routes = firestore_service.get_all_active_routes
list_disruptions = firestore_service.list_disruptions
get_disruption = firestore_service.get_disruption
save_disruption = firestore_service.save_disruption
log_ai_decision = firestore_service.log_ai_decision
get_route_history = firestore_service.get_route_history
count_routes = firestore_service.count_routes
get_cached_routes = firestore_service.get_cached_routes
log_disruption = firestore_service.log_disruption
get_app_settings = firestore_service.get_app_settings
get_co2_summary = firestore_service.get_co2_summary
increment_co2_summary = firestore_service.increment_co2_summary
get_db = firestore_service.get_db
_run = firestore_service._run
