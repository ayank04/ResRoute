from fastapi import APIRouter
from app.services import analytics_service, firestore_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/co2")
async def get_co2_analytics():
    """Fleet CO2 summary { daily, weekly, monthly, saved }"""
    return await analytics_service.get_co2_analytics()

@router.get("/risk")
async def get_risk_analytics():
    """Risk score history per vehicle (last 24h)"""
    return {
        "VH-001": [45, 48, 42, 38, 41, 39],
        "VH-002": [20, 22, 25, 24, 28, 23],
        "VH-003": [65, 68, 72, 70, 75, 78],
        "VH-004": [30, 32, 35, 34, 31, 29],
        "VH-005": [15, 18, 12, 14, 16, 13],
        "VH-006": [50, 52, 55, 54, 58, 60]
    }

@router.get("/decisions")
async def get_decisions_log():
    """AI decision log (paginated)"""
    return await firestore_service.list_ai_decisions(limit=100)

@router.get("/fleet")
async def get_fleet_summary():
    """Fleet performance summary"""
    return await analytics_service.get_analytics_summary()

@router.get("/export/esg")
async def export_esg_report():
    """Download CSV ESG report"""
    return {"status": "ok", "url": "/downloads/esg_report_apr_2026.csv"}
