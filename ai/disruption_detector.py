import os
import json
import asyncio
import logging
import time
from hashlib import md5
from typing import Dict, Any, Optional
import google.generativeai as genai
from .constants import DISRUPTION_THRESHOLDS

logger = logging.getLogger(__name__)

class DisruptionDetector:
    """
    Advanced disruption detection with LLM analysis, heuristic fallbacks, and caching.
    """
    _cache: Dict[str, Any] = {}  # Key: hash(incident_text[:100]), Value: (timestamp, result)
    _CACHE_TTL = 300  # 5 minutes

    @staticmethod
    def detect_structured(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detects disruptions based on structural factors like traffic delay, weather, and incidents.
        """
        traffic_delay_pct = data.get("traffic_delay_pct", 0.0)
        weather_code = data.get("weather_code", 0)
        incident_count = data.get("incident_count", 0)
        
        flags = []
        risk_hint = 0.0
        
        if traffic_delay_pct > DISRUPTION_THRESHOLDS["traffic_delay_pct"]:
            flags.append("traffic_jam")
            risk_hint += 0.3
            
        if weather_code >= DISRUPTION_THRESHOLDS["weather_code"]:
            flags.append("rain")
            risk_hint += 0.4
            
        if incident_count > 0:
            flags.append("incidents")
            risk_hint += 0.3
            
        return {
            "flags": flags,
            "risk_hint": min(1.0, risk_hint)
        }

    @staticmethod
    async def detect_disruption_llm(incident_text: str, context: dict) -> dict:
        """
        Uses Gemini Flash to analyze unstructured incident text and categorize disruptions.
        Includes caching, timeout protection, and a confidence-gated heuristic fallback.
        """
        # 1. Cache Check
        cache_key = md5(incident_text[:100].encode()).hexdigest()
        now = time.time()
        
        if cache_key in DisruptionDetector._cache:
            ts, cached_result = DisruptionDetector._cache[cache_key]
            if now - ts < DisruptionDetector._CACHE_TTL:
                logger.info(f"disruption_detector: cache_hit for {cache_key}")
                return cached_result
        
        logger.info(f"disruption_detector: gemini_call for {cache_key}")

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY not set. Falling back to heuristic.")
            return DisruptionDetector.detect_unstructured(incident_text)

        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            prompt = f"""
            Analyze the following emergency incident report and determine if it represents a significant route disruption.
            
            REPORT: "{incident_text}"
            
            CONTEXT:
            - Location: {context.get('location', 'Unknown')}
            - Severity Score: {context.get('severity_score', 'N/A')}
            - Weather: {context.get('weather_conditions', 'Unknown')}
            - Road Segment: {context.get('affected_road_segment', 'Unknown')}
            
            Return a JSON object ONLY with the following fields:
            - is_disruption (bool): True if the incident likely blocks or significantly slows traffic.
            - disruption_type (string): One of [ACCIDENT, WEATHER, ROAD_CLOSURE, TRAFFIC_JAM, OTHER].
            - confidence (float): 0.0 to 1.0.
            - suggested_action (string): Brief instruction for the driver.
            - estimated_duration_minutes (int): Predicted delay.
            """

            # 2. Timeout protection (8 seconds)
            gemini_task = asyncio.to_thread(
                model.generate_content,
                prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json"
                )
            )
            
            try:
                response = await asyncio.wait_for(gemini_task, timeout=8.0)
                llm_result = json.loads(response.text)
            except asyncio.TimeoutError:
                logger.warning(f"disruption_detector: gemini_timeout for {cache_key}")
                return DisruptionDetector.detect_unstructured(incident_text)

            # 3. Confidence Gate (0.55)
            if llm_result.get("confidence", 0.0) < 0.55:
                heuristic_result = DisruptionDetector.detect_unstructured(incident_text)
                
                # Safety-first: return the one with higher severity/disruption indicator
                if heuristic_result["is_disruption"] and not llm_result["is_disruption"]:
                    final_result = heuristic_result
                elif heuristic_result["estimated_duration_minutes"] > llm_result["estimated_duration_minutes"]:
                    final_result = heuristic_result
                else:
                    final_result = llm_result
            else:
                final_result = llm_result

            # Update cache
            DisruptionDetector._cache[cache_key] = (now, final_result)
            return final_result
            
        except Exception as e:
            logger.error(f"Gemini LLM detection failed: {e}. Falling back.")
            return DisruptionDetector.detect_unstructured(incident_text)

    @staticmethod
    def detect_unstructured(text: str) -> Dict[str, Any]:
        """
        Heuristic fallback for disruption detection when LLM is unavailable or unconfident.
        """
        text_lower = text.lower()
        severity = "LOW"
        delay = 0
        location = "Unknown"
        is_disruption = False
        disruption_type = "OTHER"
        
        if "accident" in text_lower or "crash" in text_lower:
            severity = "CRITICAL" if any(w in text_lower for w in ["massive", "major", "fatal"]) else "MEDIUM"
            delay = 45 if severity == "CRITICAL" else 20
            is_disruption = True
            disruption_type = "ACCIDENT"
        elif "jam" in text_lower or "traffic" in text_lower or "gridlock" in text_lower:
            severity = "MEDIUM"
            delay = 15
            is_disruption = True
            disruption_type = "TRAFFIC_JAM"
        elif any(w in text_lower for w in ["flood", "rain", "storm", "snow"]):
            is_disruption = True
            disruption_type = "WEATHER"
            delay = 30
            severity = "MEDIUM"
        elif "closure" in text_lower or "blocked" in text_lower:
            is_disruption = True
            disruption_type = "ROAD_CLOSURE"
            delay = 60
            severity = "CRITICAL"
            
        return {
            "is_disruption": is_disruption,
            "disruption_type": disruption_type,
            "confidence": 0.5,
            "suggested_action": "Proceed with caution" if not is_disruption else "Consider rerouting",
            "estimated_duration_minutes": delay,
            "location": location,
            "severity": severity
        }
