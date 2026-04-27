# ResRoute

ResRoute is a full-stack, self-healing delivery routing platform with:
- FastAPI backend for route orchestration, risk scoring, analytics, and settings APIs
- React + Vite frontend dashboard for dispatch, history, analytics, and configuration
- Shared Python AI risk/disruption logic in the root `ai/` package

## Repository Layout

- `backend/`: FastAPI service
- `frontend_version1/`: React + TypeScript application
- `ai/`: canonical AI logic and tests

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

## Environment Configuration

Copy `.env.example` from the repo root (or `backend/.env.example`) to `.env` and update values.

### Required backend env vars

- `OSRM_BASE_URL`
- `NOMINATIM_BASE_URL`
- `NOMINATIM_USER_AGENT`

### Optional backend env vars

- `ORS_BASE_URL`
- `ORS_API_KEY`
- `OPENWEATHER_API_KEY`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `FIREBASE_CREDENTIALS`
- `FIREBASE_CREDENTIALS_PATH` (legacy fallback)
- `REROUTE_RISK_THRESHOLD`

### Frontend env vars

- `VITE_API_BASE_URL`
- `VITE_GOOGLE_MAPS_API_KEY`

## Backend Run

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

## Frontend Run

```bash
cd frontend_version1
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## AI Tests

```bash
python -m pytest ai/tests -q
```

## Data Modes

- Live-first behavior is implemented for routes, analytics/history, disruptions, and settings.
- `frontend_version1/src/services/mockData.ts` is intentionally retained as a documented fallback source for demo/offline usage.
