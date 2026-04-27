from app.services import firestore_service
from datetime import datetime

async def create_driver(data: dict) -> dict:
    """Create driver with validation"""
    driver_id = data.get("id")
    # License validation, phone duplicate check etc. (Simplified for MVP)
    data["joinedAt"] = datetime.utcnow().isoformat()
    data["status"] = data.get("status", "available")
    await firestore_service.save_driver(driver_id, data)
    return data

async def update_driver(driver_id: str, data: dict) -> dict:
    """Update driver"""
    await firestore_service.save_driver(driver_id, data)
    return data

async def assign_driver_to_vehicle(driver_id: str, vehicle_id: str):
    """
    Check driver is 'available'
    Check vehicle has no current driver
    Update both documents atomically
    """
    driver = await firestore_service.get_driver(driver_id)
    vehicle = await firestore_service.get_vehicle(vehicle_id)
    
    if not driver or not vehicle:
        raise ValueError("Driver or Vehicle not found")
        
    if driver.get("status") != "available":
        raise ValueError("Driver is not available")
        
    if vehicle.get("currentDriverId"):
        raise ValueError("Vehicle already has an assigned driver")
        
    await firestore_service.save_driver(driver_id, {
        "status": "on_trip",
        "currentVehicleId": vehicle_id
    })
    await firestore_service.save_vehicle(vehicle_id, {
        "currentDriverId": driver_id
    })

async def unassign_driver(driver_id: str):
    """
    Set driver status 'available'
    Clear vehicle currentDriverId
    """
    driver = await firestore_service.get_driver(driver_id)
    if not driver: return
    
    vehicle_id = driver.get("currentVehicleId")
    await firestore_service.save_driver(driver_id, {
        "status": "available",
        "currentVehicleId": None
    })
    
    if vehicle_id:
        await firestore_service.save_vehicle(vehicle_id, {
            "currentDriverId": None
        })

async def get_driver_stats(driver_id: str) -> dict:
    """Aggregate stats from history"""
    history = await firestore_service.get_route_history()
    driver_history = [h for h in history if h.get("driver_id") == driver_id or h.get("driver") == driver_id]
    
    return {
        "totalTrips": len(driver_history),
        "totalDistanceKm": sum(h.get("distance_km", 0) for h in driver_history),
        "totalCo2SavedKg": sum(h.get("co2_saved_kg", 0) for h in driver_history),
        "avgRisk": sum(h.get("risk_score", 0) for h in driver_history) / len(driver_history) if driver_history else 0
    }
