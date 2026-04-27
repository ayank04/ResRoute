import os
from dataclasses import dataclass
from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict
from loguru import logger

@dataclass(frozen=True)
class EnvRequirement:
    required: bool
    fallback_behavior: str

ENV_REQUIREMENTS: dict[str, EnvRequirement] = {
    "OSRM_BASE_URL": EnvRequirement(True, "No fallback. Routing is unavailable."),
    "NOMINATIM_BASE_URL": EnvRequirement(True, "No fallback. Geocoding is unavailable."),
    "NOMINATIM_USER_AGENT": EnvRequirement(True, "No fallback. Geocoding policy compliance required."),
    "ORS_BASE_URL": EnvRequirement(False, "ORS fallback is disabled; OSRM/cached/default routes are used."),
    "ORS_API_KEY": EnvRequirement(False, "ORS fallback is disabled; OSRM/cached/default routes are used."),
    "OPENWEATHER_API_KEY": EnvRequirement(False, "Weather fetch disabled; neutral weather severity defaults are used."),
}

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    OSRM_BASE_URL: str
    ORS_API_KEY: str | None = None
    ORS_BASE_URL: str | None = None
    NOMINATIM_BASE_URL: str
    NOMINATIM_USER_AGENT: str
    OPENWEATHER_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    REROUTE_RISK_THRESHOLD: float = 0.65
    
    # Hardening Settings
    LOG_LEVEL: str = "INFO"
    CACHE_TTL_HOURS: int = 2
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
    
    # Firebase related
    GOOGLE_APPLICATION_CREDENTIALS: str | None = None
    FIREBASE_CREDENTIALS: str | None = None
    FIREBASE_CREDENTIALS_PATH: str | None = None
    WS_SECRET_TOKEN: str = "resroute-default-token-2026"

def validate_startup_configuration(settings: "Settings") -> None:
    for key, requirement in ENV_REQUIREMENTS.items():
        value = getattr(settings, key, None) or os.getenv(key)
        
        if isinstance(value, str):
            value = value.strip()
            
        if requirement.required and not value:
            raise RuntimeError(
                f"Missing required environment variable {key}. {requirement.fallback_behavior}"
            )
        if not requirement.required and not value:
            logger.warning(
                f"Optional environment variable {key} is not set. {requirement.fallback_behavior}"
            )

settings = Settings()
