# AI Module Constants
# This file stores constant mappings, thresholds, and static configurations

# Weight logic for risk features
RISK_WEIGHTS = {
    "traffic": 0.5,
    "weather": 0.3,
    "incident": 0.2
}

# Weather severity mappings
WEATHER_RISK_MAP = {
    "Clear": 0.0,
    "Rain": 0.3,
    "Fog": 0.3,
    "Heavy rain": 0.6,
    "Thunderstorm": 0.9,
    "Snow": 0.9
}

# Incident severity weights
INCIDENT_SEVERITY_MAP = {
    "MINOR": 0.1,
    "MODERATE": 0.3,
    "SEVERE": 0.7
}

# Segment Risk Level Thresholds
SEGMENT_RISK_LEVELS = {
    "LOW": 0.3,    # < 0.3
    "HIGH": 0.6    # > 0.6. Medium is [0.3, 0.6]
}

# Disruption detector rule thresholds
DISRUPTION_THRESHOLDS = {
    "traffic_delay_pct": 0.4,
    "weather_code": 500
}
