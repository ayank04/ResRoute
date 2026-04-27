from app.models.route_models import RouteCandidate

WEIGHT_TIME = 0.4
WEIGHT_DISTANCE = 0.2
WEIGHT_RISK = 0.4

def normalize(values: list[float]) -> list[float]:
    max_val = max(values) if values and max(values) > 0 else 1
    return [v / max_val for v in values]

def score_routes(
    candidates: list[RouteCandidate],
    risk_scores: list[float]
) -> list[RouteCandidate]:
    if not candidates:
        return []

    durations = [float(c.duration_seconds) for c in candidates]
    distances = [float(c.distance_meters) for c in candidates]

    t_norm = normalize(durations)
    c_norm = normalize(distances)
    r_norm = risk_scores

    for i, candidate in enumerate(candidates):
        candidate.risk_score = round(r_norm[i], 4)
        candidate.score = round(
            (WEIGHT_TIME * t_norm[i]) +
            (WEIGHT_DISTANCE * c_norm[i]) +
            (WEIGHT_RISK * r_norm[i]),
            4
        )

    return sorted(candidates, key=lambda c: c.score)

def select_best_route(scored: list[RouteCandidate]) -> RouteCandidate:
    if not scored:
        raise ValueError("Cannot select best route from empty list")
    return scored[0]

def should_reroute(
    current: RouteCandidate,
    best_alternate: RouteCandidate,
    improvement_threshold: float = 0.1
) -> bool:
    return (current.score - best_alternate.score) > improvement_threshold
