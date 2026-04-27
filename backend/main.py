import sys
import os
import time
from datetime import datetime

# Ensure the backend directory and the workspace root are in the python path
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json
import asyncio
from loguru import logger

from app.core.config import settings, validate_startup_configuration
from app.api import vehicles, drivers, routes, disruptions, driver_reports, analytics, health, delivery
from app.services import scheduler_service, firestore_service
from app.core.websocket_manager import connection_manager
from app.services.simulation_service import simulation_engine
from app.services.seed_service import seed_demo_vehicles
from app.models.route_models import RerouteRequest, RerouteAllRequest

# Structured Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logger.remove()
logger.add(
    sys.stdout, 
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level=LOG_LEVEL, 
    colorize=True
)

def load_firebase_credentials():
    try:
        from firebase_admin import credentials
    except ImportError:
        return None
        
    credentials_json = os.getenv("FIREBASE_CREDENTIALS")
    if credentials_json: return credentials.Certificate(json.loads(credentials_json))
    google_credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if google_credentials_path: return credentials.Certificate(google_credentials_path)
    return credentials.ApplicationDefault()

def initialize_firebase():
    """Blocking Firebase initialization to be run in executor"""
    import firebase_admin
    if not firebase_admin._apps:
        cred = load_firebase_credentials()
        if cred:
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized")
        else:
            logger.warning("No Firebase credentials found")
    
    # Also initialize the firestore service client
    firestore_service.firestore_service.initialize()

async def init_services_async():
    """Safe service initialization that never blocks startup"""
    loop = asyncio.get_event_loop()
    try:
        await asyncio.wait_for(
            loop.run_in_executor(None, initialize_firebase),
            timeout=5.0
        )
        logger.info("Service initialization successful")
    except asyncio.TimeoutError:
        logger.warning("Service initialization timed out — continuing with local storage")
    except Exception as e:
        logger.error(f"Service initialization error: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ResRoute backend (Zero-Block Mode)...")
    
    # 1. Background Initialization & Startup Logic
    async def background_startup():
        try:
            # First, init Firebase/Firestore (non-blocking)
            await init_services_async()
            
            # Start background engines
            scheduler_service.start_scheduler()
            await simulation_engine.start()
            
            # Run seeding and route recovery
            active_routes = await firestore_service.get_all_active_routes()
            logger.bind(service_name="STARTUP").info(f"Check: Found {len(active_routes)} active routes.")
            
            if not active_routes:
                logger.bind(service_name="STARTUP").info("Triggering demo seed system...")
                await seed_demo_vehicles()
                active_routes = await firestore_service.get_all_active_routes()

            # Recover simulation state
            # The simulation_engine already ticks all active routes in its loop
            pass
        except Exception as ex:
            logger.error(f"Error in background startup sequence: {ex}")

    # Fire and forget the startup logic so port 8000 opens immediately
    asyncio.create_task(background_startup())
    
    yield
    
    # Shutdown
    try:
        await simulation_engine.stop()
        scheduler_service.stop_scheduler()
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")

app = FastAPI(
    title="ResRoute API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SYSTEM ROUTES ---

@app.get("/ping")
async def ping():
    return {"status": "pong"}

@app.get("/debug/store")
async def debug_store():
    from app.services.firestore_service import _mock_store
    return _mock_store

# --- REGISTER ROUTERS ---

# Root level compatibility (No prefix)
app.include_router(health.router)
app.include_router(vehicles.router)
app.include_router(drivers.router)
app.include_router(routes.router, prefix="/routes")
app.include_router(disruptions.router)
app.include_router(analytics.router)

# Versioned API (With prefix)
app.include_router(health.router, prefix="/api/v1")
app.include_router(vehicles.router, prefix="/api/v1")
app.include_router(drivers.router, prefix="/api/v1")
app.include_router(routes.router, prefix="/api/v1/routes")
app.include_router(disruptions.router, prefix="/api/v1")
app.include_router(driver_reports.router, prefix="/api/v1")
app.include_router(delivery.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")

# Explicit Root Aliases for Rerouting
@app.post("/reroute")
async def root_reroute(body: RerouteRequest): return await routes.manual_reroute(body)

@app.post("/reroute/all")
async def root_reroute_all(body: RerouteAllRequest = None): return await routes.reroute_all(body or RerouteAllRequest())

# --- WEBSOCKETS ---

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Support token in query param
    token = websocket.query_params.get("token")
    driver_id = websocket.query_params.get("driverId")
        
    if token != settings.WS_SECRET_TOKEN:
        logger.bind(service_name="WEBSOCKET").warning(f"Connection rejected: Invalid token {token}")
        await websocket.close(code=1008)
        return

    # Identify if dashboard or driver
    if driver_id:
        await connection_manager.connect(driver_id, websocket)
    else:
        await connection_manager.connect_dashboard(websocket)

    try:
        while True:
            # Receive text or JSON
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "sync":
                    await connection_manager.handle_sync(
                        websocket, 
                        msg.get("lastEventId"), 
                        driver_id
                    )
            except json.JSONDecodeError:
                # Heartbeat or simple message
                pass
    except WebSocketDisconnect:
        if driver_id:
            await connection_manager.disconnect(driver_id)
        else:
            await connection_manager.disconnect_dashboard(websocket)
    except Exception as e:
        logger.bind(service_name="WEBSOCKET").error(f"WebSocket error: {e}")
        if driver_id:
            await connection_manager.disconnect(driver_id)
        else:
            await connection_manager.disconnect_dashboard(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
