from __future__ import annotations

from typing import Literal


ServiceState = Literal["up", "down", "unknown"]


service_status: dict[str, dict[str, str]] = {
    "firestore": {"status": "unknown", "detail": "Startup not completed"},
    "weather_api": {"status": "unknown", "detail": "Startup not completed"},
    "risk_engine": {"status": "unknown", "detail": "Startup not completed"},
}


def set_service_status(service: str, status: ServiceState, detail: str) -> None:
    service_status[service] = {"status": status, "detail": detail}


def get_service_status() -> dict[str, dict[str, str]]:
    return service_status


def get_disabled_features() -> list[str]:
    disabled: list[str] = []

    if service_status.get("firestore", {}).get("status") != "up":
        disabled.extend([
            "route_persistence",
            "analytics_from_firestore",
            "disruption_audit_logging",
        ])

    if service_status.get("weather_api", {}).get("status") != "up":
        disabled.append("live_weather_risk_adjustment")

    if service_status.get("risk_engine", {}).get("status") != "up":
        disabled.append("dynamic_risk_scoring")

    return disabled


def overall_status() -> str:
    statuses = [v.get("status", "unknown") for v in service_status.values()]
    return "ok" if all(status == "up" for status in statuses) else "degraded"
