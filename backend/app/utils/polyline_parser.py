import polyline

def decode_polyline(encoded: str) -> list[tuple[float, float]]:
    return polyline.decode(encoded)

def encode_polyline(coords: list[tuple[float, float]]) -> str:
    return polyline.encode(coords)

def polyline_to_steps(encoded: str) -> list[dict]:
    coords = decode_polyline(encoded)
    return [{"lat": lat, "lon": lon} for lat, lon in coords]
