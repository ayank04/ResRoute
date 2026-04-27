Write-Host "🚀 Launching ResRoute Suite..." -ForegroundColor Cyan

# 1. Start Backend in a new window
Write-Host "Starting Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\run.ps1"

# 2. Wait for backend to bind port (optional but helpful)
Start-Sleep -Seconds 2

# 3. Start Frontend in a new window
Write-Host "Starting Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend_version1; npm run dev"

Write-Host "All systems GO! Check the new terminal windows for logs." -ForegroundColor White
Write-Host "Dashboard: http://localhost:5173" -ForegroundColor Cyan
Write-Host "API Health: http://localhost:8000/ping" -ForegroundColor Cyan
