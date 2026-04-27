#!/bin/bash
cd "$(dirname "$0")"
export PYTHONPATH="${PYTHONPATH}:$(pwd):$(pwd)/backend"
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
