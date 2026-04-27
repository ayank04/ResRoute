import requests

base_url = "http://localhost:8000"
endpoints = [
    "/health",
    "/vehicles",
    "/vehicles/",
    "/routes",
    "/routes/",
    "/routes/active",
    "/routes/active/",
    "/disruptions",
    "/disruptions/",
    "/drivers",
    "/drivers/"
]

for ep in endpoints:
    try:
        r = requests.get(base_url + ep, allow_redirects=True)
        print(f"GET {ep} -> {r.status_code}")
    except Exception as e:
        print(f"GET {ep} -> FAILED: {e}")
