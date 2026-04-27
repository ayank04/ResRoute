from fastapi import WebSocket
from datetime import datetime
from collections import deque
import uuid
from loguru import logger

class ConnectionManager:
    def __init__(self):
        # driver_id -> WebSocket
        self.active_connections: dict[str, WebSocket] = {}
        # Per-vehicle event queue (max 20 events)
        self.event_queues: dict[str, deque] = {}
        # Dashboard connections (broadcast group)
        self.dashboard_connections: list[WebSocket] = []

    async def connect(self, driver_id: str, websocket: WebSocket) -> None:
        try:
            # Check if websocket is already accepted/open
            if websocket.client_state.name == "CONNECTING":
                await websocket.accept()
            
            self.active_connections[driver_id] = websocket
            if driver_id not in self.event_queues:
                self.event_queues[driver_id] = deque(maxlen=20)
            logger.bind(service_name="WS_MANAGER").info(f"Driver {driver_id} connected")
        except Exception as e:
            logger.bind(service_name="WS_MANAGER").error(f"Error in driver connect: {e}")

    async def connect_dashboard(self, websocket: WebSocket) -> None:
        try:
            if websocket.client_state.name == "CONNECTING":
                await websocket.accept()
            
            if websocket not in self.dashboard_connections:
                self.dashboard_connections.append(websocket)
            logger.bind(service_name="WS_MANAGER").info("Dashboard client connected")
        except Exception as e:
            logger.bind(service_name="WS_MANAGER").error(f"Error in dashboard connect: {e}")

    async def disconnect(self, driver_id: str) -> None:
        self.active_connections.pop(driver_id, None)
        logger.bind(service_name="WS_MANAGER").info(f"Driver {driver_id} disconnected")

    async def disconnect_dashboard(self, websocket: WebSocket) -> None:
        if websocket in self.dashboard_connections:
            self.dashboard_connections.remove(websocket)
        logger.bind(service_name="WS_MANAGER").info("Dashboard client disconnected")

    async def broadcast(self, payload: dict) -> None:
        """Broadcast event to all connected dashboards"""
        if "timestamp" not in payload:
            payload["timestamp"] = datetime.utcnow().isoformat()
        
        dead_connections = []
        for ws in self.dashboard_connections:
            try:
                await ws.send_json(payload)
            except Exception:
                dead_connections.append(ws)
        
        for dc in dead_connections:
            await self.disconnect_dashboard(dc)

    async def push_event(self, driver_id: str, payload: dict) -> None:
        """Send event to specific driver AND all dashboards"""
        event_id = str(uuid.uuid4())
        payload["eventId"] = event_id
        if "timestamp" not in payload:
            payload["timestamp"] = datetime.utcnow().isoformat()
        
        # Add to queue for driver sync
        if driver_id not in self.event_queues:
            self.event_queues[driver_id] = deque(maxlen=20)
        self.event_queues[driver_id].append(payload)

        # 1. Send to specific driver if connected
        ws = self.active_connections.get(driver_id)
        if ws:
            try:
                await ws.send_json(payload)
            except Exception:
                await self.disconnect(driver_id)
        
        # 2. BROADCAST to all dashboard clients
        await self.broadcast(payload)

    async def handle_sync(self, websocket: WebSocket, last_event_id: str = None, driver_id: str = None):
        """Sync logic for reconnection"""
        try:
            if not driver_id:
                # Dashboard sync: just send a heartbeat or summary if needed
                await websocket.send_json({"type": "sync_complete", "payload": {"status": "ok"}})
                return

            if driver_id not in self.event_queues:
                await websocket.send_json({"type": "sync_complete", "payload": {"status": "no_queue"}})
                return
                
            queue = self.event_queues[driver_id]
            found = False
            for event in list(queue):
                if not last_event_id or found:
                    await websocket.send_json(event)
                if last_event_id and event.get("eventId") == last_event_id:
                    found = True
            
            await websocket.send_json({"type": "sync_complete", "payload": {"status": "ok"}})
        except Exception as e:
            logger.bind(service_name="WS_MANAGER").error(f"Sync error: {e}")

connection_manager = ConnectionManager()
