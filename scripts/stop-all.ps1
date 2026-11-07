# NeuroDesk AI — Stop All Services
# Run from repo root: scripts\stop-all.ps1

Write-Host "=== NeuroDesk AI — Stopping app processes ===" -ForegroundColor Cyan

# Kill Uvicorn (Python AI service)
Get-Process -Name "python","uvicorn" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "[OK] Python AI service stopped" -ForegroundColor Green

# Kill Node (API + Next.js dev servers)
# Note: this stops ALL node processes — be careful in shared environments
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "[OK] Node processes stopped" -ForegroundColor Green

Write-Host "Database services (PostgreSQL, Redis, Neo4j) are Windows services — stop them via Services panel if needed."
