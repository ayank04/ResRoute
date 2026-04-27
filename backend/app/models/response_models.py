from pydantic import BaseModel, Field
from .route_models import RouteCandidate

class RouteCreateResponse(BaseModel):
    route_id: str
    driver_id: str
    best_route: RouteCandidate
    ranked_routes: list[RouteCandidate] = Field(default_factory=list)
    stale: bool = False

class RouteStatusResponse(BaseModel):
    route_id: str
    driver_id: str
    status: str
    risk_score: float
    eta_seconds: int
    reroute_count: int
    disruption_log: list[dict] = Field(default_factory=list)

class HealResponse(BaseModel):
    healed: bool
    rerouted: bool
    old_risk: float
    new_risk: float
    message: str
