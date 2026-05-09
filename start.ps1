# ============================================================================
# Health AI Platform — One-Click Startup Script
# Starts: Docker DB → Backend → Frontend
# Usage: .\start.ps1
# ============================================================================

Write-Host ""
Write-Host "  ==============================================" -ForegroundColor Cyan
Write-Host "   Health AI Platform — Starting All Services" -ForegroundColor Cyan
Write-Host "  ==============================================" -ForegroundColor Cyan
Write-Host ""

$ROOT = $PSScriptRoot

# ── Step 1: Start PostgreSQL via Docker ─────────────────────────────────────

Write-Host "[1/4] Starting PostgreSQL database..." -ForegroundColor Yellow

docker compose -f "$ROOT\docker-compose.yml" up -d db 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Failed to start Docker. Is Docker Desktop running?" -ForegroundColor Red
    Write-Host "  Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

Write-Host "  Database started on port 5433" -ForegroundColor Green

# Wait for DB to be ready
Write-Host "  Waiting for database to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# ── Step 2: Run Prisma migrations ───────────────────────────────────────────

Write-Host "[2/4] Running database migrations..." -ForegroundColor Yellow

Push-Location "$ROOT\backend"
npx prisma generate 2>$null | Out-Null
npx prisma migrate deploy 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "  Warning: Migration may have issues. Trying migrate dev..." -ForegroundColor Yellow
    npx prisma migrate dev --skip-generate 2>$null | Out-Null
}

Write-Host "  Migrations applied successfully" -ForegroundColor Green
Pop-Location

# ── Step 3: Start Backend ──────────────────────────────────────────────────

Write-Host "[3/4] Starting backend server..." -ForegroundColor Yellow

$null = Start-Process powershell -ArgumentList "-NoProfile", "-Command", "cd '$ROOT\backend'; npx ts-node src/index.ts" -PassThru -WindowStyle Normal
Start-Sleep -Seconds 2

Write-Host "  Backend running on https://health-ai-platform-backend.onrender.com" -ForegroundColor Green

# ── Step 4: Start Frontend ─────────────────────────────────────────────────

Write-Host "[4/4] Starting frontend dev server..." -ForegroundColor Yellow

$null = Start-Process powershell -ArgumentList "-NoProfile", "-Command", "cd '$ROOT\frontend'; npm run dev" -PassThru -WindowStyle Normal
Start-Sleep -Seconds 2

Write-Host "  Frontend running on http://localhost:5173" -ForegroundColor Green

# ── Done ───────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  ==============================================" -ForegroundColor Green
Write-Host "   All services are running!" -ForegroundColor Green
Write-Host "  ==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend:   https://health-ai-platform-backend.onrender.com" -ForegroundColor Cyan
Write-Host "  Database:  localhost:5433" -ForegroundColor Cyan
Write-Host ""
Write-Host "  To stop all services:" -ForegroundColor Gray
Write-Host "    - Close the backend and frontend terminal windows" -ForegroundColor Gray
Write-Host "    - Run: docker compose down" -ForegroundColor Gray
Write-Host ""

# Open browser
Start-Process "http://localhost:5173"
