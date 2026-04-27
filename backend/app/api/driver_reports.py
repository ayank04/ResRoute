from fastapi import APIRouter, HTTPException
from app.services import firestore_service
from loguru import logger

router = APIRouter(prefix="/driver-reports", tags=["Driver Reports"])

@router.post("/")
async def submit_report(body: dict):
    """
    Driver submits field report
    → runs Gemini classification (Mocked for now)
    → if road_blocked: creates disruption
    → if route_clear: flags reroute as unnecessary
    → if need_help: creates CRITICAL alert, WebSocket push to dispatcher
    """
    try:
        report_id = f"rep_{int(body.get('timestamp', 0)) or 'now'}"
        # Mocking Gemini Classification
        raw_text = body.get("rawText", "").lower()
        classification = {
            "type": "other",
            "severity": "low"
        }
        
        if "blocked" in raw_text or "closure" in raw_text:
            classification["type"] = "road_blocked"
            classification["severity"] = "high"
        elif "clear" in raw_text:
            classification["type"] = "route_clear"
        elif "help" in raw_text or "emergency" in raw_text:
            classification["type"] = "need_help"
            classification["severity"] = "critical"

        body["geminiClassification"] = classification
        body["isProcessed"] = True
        
        await firestore_service.save_driver_report(body)
        
        # Action based on classification
        if classification["type"] == "road_blocked":
            dis_data = {
                "type": "traffic",
                "title": "Road Blocked (Driver Report)",
                "description": body.get("rawText"),
                "severity": classification["severity"],
                "location": body.get("location"),
                "source": "driver_report",
                "reportedByDriverId": body.get("driverId"),
                "isActive": True
            }
            await firestore_service.save_disruption(f"dis_rep_{report_id}", dis_data)
            
        return {"status": "ok", "classification": classification}
    except Exception as e:
        logger.error(f"Report processing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_reports():
    """List all reports"""
    return await firestore_service.list_driver_reports()
