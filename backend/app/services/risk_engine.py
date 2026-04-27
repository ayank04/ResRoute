import asyncio
import logging
from typing import Any

from app.services.weather_service import get_weather_severity
from ai.risk_engine import RiskEngine as CanonicalRiskEngine

logger = logging.getLogger(__name__)

class RiskEngine:
    async def compute_risk(
        self,
        route_segments: Any,
        weather_data: dict,
        incidents: list[dict] = None
    ) -> float:
        """
        Compute risk score for a route.
        """
        if incidents is None:
            incidents = []

        try:
            return self._compute_with_canonical_ai(route_segments, weather_data, incidents)
        except Exception as e:
            logger.warning(f"Risk compute failed: {e}")
            return 0.3

    def _compute_with_canonical_ai(self, route_segments: Any, weather_data: dict, incidents: list[dict]) -> float:
        duration_seconds = self._extract_duration_seconds(route_segments)
        static_duration_seconds = self._extract_static_duration_seconds(route_segments, duration_seconds)

        ai_route = {
            "duration": duration_seconds,
            "static_duration": static_duration_seconds,
            "segments": route_segments.get("steps", []) if isinstance(route_segments, dict) else getattr(route_segments, "steps", []),
        }

        ai_weather = {
            "condition": weather_data.get("condition")
            or weather_data.get("weather_main")
            or "Clear"
        }

        ai_result = CanonicalRiskEngine.compute_route_risk(ai_route, ai_weather, incidents)
        return float(ai_result.get("risk_score", 0.3))

    def _extract_duration_seconds(self, route_segments: Any) -> float:
        if route_segments is None:
            return 0.0

        if isinstance(route_segments, dict):
            for key in ("duration_seconds", "duration"):
                value = route_segments.get(key)
                if value is not None:
                    return float(value)
            steps = route_segments.get("steps", [])
            if isinstance(steps, list) and steps:
                total = 0.0
                for step in steps:
                    if isinstance(step, dict):
                        duration = step.get("duration") or step.get("duration_seconds")
                        if duration is not None:
                            total += float(duration)
                if total > 0:
                    return total
            return 0.0

        for attribute in ("duration_seconds", "duration"):
            value = getattr(route_segments, attribute, None)
            if value is not None:
                return float(value)

        steps = getattr(route_segments, "steps", None)
        if isinstance(steps, list) and steps:
            total = 0.0
            for step in steps:
                if isinstance(step, dict):
                    duration = step.get("duration") or step.get("duration_seconds")
                    if duration is not None:
                        total += float(duration)
            if total > 0:
                return total

        return 0.0

    def _extract_static_duration_seconds(self, route_segments: Any, duration_seconds: float) -> float:
        if route_segments is None:
            return max(duration_seconds, 1.0)

        if isinstance(route_segments, dict):
            static_duration = route_segments.get("static_duration")
            if static_duration is not None:
                return max(float(static_duration), 1.0)
        else:
            static_duration = getattr(route_segments, "static_duration", None)
            if static_duration is not None:
                return max(float(static_duration), 1.0)

        if duration_seconds <= 0:
            return 1.0

        return max(duration_seconds * 0.75, 1.0)

    async def compute_risk_batch(
        self,
        routes: list,
        weather_data: dict,
        incidents: list[dict] = None
    ) -> list[float]:
        """
        Compute risk for multiple routes concurrently.
        """
        if incidents is None:
            incidents = []
            
        results = await asyncio.gather(*[
            self.compute_risk(r, weather_data, incidents)
            for r in routes
        ], return_exceptions=True)
        
        return [r if isinstance(r, float) else 0.3 for r in results]

risk_engine = RiskEngine()
