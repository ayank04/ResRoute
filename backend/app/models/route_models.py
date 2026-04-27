from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class Coordinates(BaseModel):
    lat: float
    lon: float

class RouteRequest(BaseModel):
    origin: str
    destination: str
    waypoints: List[str] = Field(default_factory=list)
    driver_id: str

class RouteCandidate(BaseModel):
    route_id: str
    duration_seconds: int
    distance_meters: int
    polyline: str
    steps: List[Coordinates] = Field(default_factory=list)
    score: float = 0.0
    risk_score: float = 0.0
    stale: bool = False

class RouteSegment(BaseModel):
    id: str
    start: Coordinates
    end: Coordinates
    polyline: str
    decodedPath: List[Coordinates]
    riskLevel: str
    riskScore: float
    distanceKm: float
    durationMinutes: int
    co2Kg: float

class ActiveRoute(BaseModel):
    id: str
    routeId: str = Field(alias="route_id")
    driverId: str = Field(alias="driver_id")
    origin: str
    destination: str
    originCoords: Coordinates = Field(alias="origin_coords")
    destinationCoords: Coordinates = Field(alias="destination_coords")
    currentRoute: RouteCandidate = Field(alias="current_route")
    alternateRoutes: List[RouteCandidate] = Field(default_factory=list, alias="alternate_routes")
    status: str
    rerouteCount: int = Field(default=0, alias="reroute_count")
    disruptionLog: List[dict] = Field(default_factory=list, alias="disruption_log")
    createdAt: datetime = Field(alias="created_at", default_factory=datetime.utcnow)
    updatedAt: datetime = Field(alias="updated_at", default_factory=datetime.utcnow)
    
    # Frontend compatibility fields
    currentRiskScore: float = Field(default=0.0, alias="current_risk_score")
    etaMinutes: int = Field(default=0, alias="eta_minutes")
    distanceKm: float = Field(default=0.0, alias="distance_km")
    trackingToken: Optional[str] = Field(default=None, alias="tracking_token")
    tokenExpiresAt: Optional[datetime] = Field(default=None, alias="token_expires_at")

    @property
    def segments(self) -> List[dict]:
        """Maps OSRM steps to frontend RouteSegment structure"""
        if not self.currentRoute or not self.currentRoute.steps:
            return []
            
        segs = []
        steps = self.currentRoute.steps
        for i in range(len(steps) - 1):
            s = steps[i]
            e = steps[i+1]
            segs.append({
                "id": f"seg-{i}",
                "start": {"lat": s.lat, "lng": s.lon},
                "end": {"lat": e.lat, "lng": e.lon},
                "polyline": "", 
                "decodedPath": [{"lat": s.lat, "lng": s.lon}, {"lat": e.lat, "lng": e.lon}],
                "riskLevel": "LOW",
                "riskScore": 0.1,
                "distanceKm": 0.1,
                "durationMinutes": 1,
                "co2Kg": 0.01
            })
        return segs

    def model_dump(self, **kwargs) -> dict:
        """Ensure segments is included in JSON output"""
        d = super().model_dump(**kwargs)
        d["segments"] = self.segments
        if isinstance(d.get("createdAt"), datetime):
            d["createdAt"] = d["createdAt"].isoformat()
        if isinstance(d.get("updatedAt"), datetime):
            d["updatedAt"] = d["updatedAt"].isoformat()
        return d

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class RerouteRequest(BaseModel):
    vehicleId: str
    reason: Optional[str] = None

class RerouteAllRequest(BaseModel):
    reason: Optional[str] = "System optimization"
