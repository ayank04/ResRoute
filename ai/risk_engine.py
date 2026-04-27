from typing import Dict, Any, List, Optional
from .constants import RISK_WEIGHTS, WEATHER_RISK_MAP, INCIDENT_SEVERITY_MAP

class RiskEngine:
    """
    Core risk calculation engine for evaluating route safety with trend analysis and explainability.
    """
    
    @staticmethod
    def compute_route_risk(
        route: Dict[str, Any], 
        weather: Dict[str, Any], 
        incidents: List[Dict[str, Any]],
        risk_history: Optional[List[float]] = None
    ) -> Dict[str, Any]:
        """
        Computes the route risk score based on traffic, weather, and active incidents.
        Includes trend detection and primary factor explainability.
        """
        # 1. Traffic Score calculation
        duration = route.get("duration", 0)
        static_duration = route.get("static_duration", duration)
        
        if static_duration <= 0:
            traffic_score = 0.0
        else:
            # Normalized delay ratio capped at 1.0
            traffic_score = (duration - static_duration) / static_duration
        
        traffic_score = max(0.0, min(1.0, float(traffic_score)))

        # 2. Weather Score Mapping
        condition = weather.get("condition", "Clear")
        weather_score = 0.0
        for key, val in WEATHER_RISK_MAP.items():
            if condition.lower() == key.lower():
                weather_score = val
                break
        
        # Fallback for common conditions if mapping is missing
        if weather_score == 0.0 and condition.lower() in ["light rain", "fog", "drizzle"]:
            weather_score = 0.3

        # 3. Incident Score Aggregation
        incident_score = 0.0
        for incident in incidents:
            severity = incident.get("severity", "").upper()
            incident_score += INCIDENT_SEVERITY_MAP.get(severity, 0.0)
            
        incident_score = max(0.0, min(1.0, incident_score))

        # 4. Final Weighted Risk Score
        base_risk = (
            RISK_WEIGHTS["traffic"] * traffic_score +
            RISK_WEIGHTS["weather"] * weather_score +
            RISK_WEIGHTS["incident"] * incident_score
        )
        
        risk = max(0.0, min(1.0, base_risk))

        # 5. Trend Detection
        trend = "stable"
        if risk_history and len(risk_history) >= 3:
            last_3 = risk_history[-3:]
            # If last 3 are strictly rising
            if last_3[0] < last_3[1] < last_3[2]:
                trend = "rising"
                # Add penalty if current risk is already high
                if last_3[-1] > 0.5:
                    risk = min(1.0, risk + 0.1)
            elif last_3[0] > last_3[1] > last_3[2]:
                trend = "falling"
        
        # 6. Explainability and Reason String
        components = {
            "traffic": RISK_WEIGHTS["traffic"] * traffic_score,
            "weather": RISK_WEIGHTS["weather"] * weather_score,
            "incidents": RISK_WEIGHTS["incident"] * incident_score
        }
        
        primary_factor = max(components, key=components.get)
        
        if risk == 0.0:
            reason_string = "No significant risk factors detected."
        else:
            traffic_desc = f"Traffic delay {1 + traffic_score:.1f}x normal."
            weather_desc = f"Condition: {condition} ({weather_score:.2f})."
            incident_desc = f"{len(incidents)} active incidents."
            
            factors = {
                "traffic": traffic_desc,
                "weather": weather_desc,
                "incidents": incident_desc
            }
            
            reason_string = f"Primary risk: {primary_factor}. {factors[primary_factor]}"

        return {
            "risk_score": round(risk, 4),
            "trend": trend,
            "primary_factor": primary_factor,
            "reason_string": reason_string,
            "breakdown": {
                "traffic": round(traffic_score, 4),
                "weather": round(weather_score, 4),
                "incident": round(incident_score, 4)
            }
        }
