$env:PYTHONPATH = "$($env:PYTHONPATH);$(Get-Location);$((Get-Location).Path)\backend"
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
