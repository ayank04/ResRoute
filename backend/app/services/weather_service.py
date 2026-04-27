import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

async def get_weather(lat: float, lon: float) -> dict:
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.OPENWEATHER_API_KEY,
        "units": "metric"
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            return {
                "temp": float(data.get("main", {}).get("temp", 0.0)),
                "weather_main": str(data.get("weather", [{}])[0].get("main", "Clear")),
                "weather_description": str(data.get("weather", [{}])[0].get("description", "")),
                "wind_speed": float(data.get("wind", {}).get("speed", 0.0)),
                "visibility": int(data.get("visibility", 10000)),
                "humidity": int(data.get("main", {}).get("humidity", 0))
            }
    except Exception as e:
        logger.warning(f"Weather fetch failed for lat={lat}, lon={lon}: {e}")
        return {}

def get_weather_severity(weather_data: dict) -> float:
    if not weather_data:
        return 0.3
        
    main = weather_data.get("weather_main", "")
    mapping = {
        "Clear": 0.0,
        "Clouds": 0.1,
        "Drizzle": 0.2,
        "Rain": 0.4,
        "Snow": 0.6,
        "Thunderstorm": 0.8,
        "Tornado": 1.0,
        "Squall": 1.0
    }
    return mapping.get(main, 0.3)

async def probe_weather_api() -> tuple[bool, str]:
    if not settings.OPENWEATHER_API_KEY:
        return (False, "OPENWEATHER_API_KEY is not set")

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "lat": 12.9716,
        "lon": 77.5946,
        "appid": settings.OPENWEATHER_API_KEY,
        "units": "metric",
    }

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            response = await client.get(url, params=params)
            if response.status_code == 200:
                return (True, "probe request succeeded")
            return (False, f"probe request failed with status {response.status_code}")
    except Exception as e:
        return (False, f"probe request error: {e}")
