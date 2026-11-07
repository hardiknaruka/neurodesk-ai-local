# NeuroDesk AI — Health Check
# Quickly pings all local service endpoints.
# Run from repo root: scripts\check-health.ps1

function Check-Endpoint {
    param([string]$Name, [string]$Url)
    try {
        $response = Invoke-RestMethod -Uri $Url -TimeoutSec 3 -ErrorAction Stop
        Write-Host "[OK] $Name — $Url" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] $Name — $Url ($($_.Exception.Message))" -ForegroundColor Red
    }
}

Write-Host "=== NeuroDesk AI — Health Checks ===" -ForegroundColor Cyan

Check-Endpoint "Node API"      "http://127.0.0.1:4000/api/v1/health"
Check-Endpoint "Python AI"     "http://127.0.0.1:8000/health"
Check-Endpoint "Ollama"        "http://127.0.0.1:11434"
Check-Endpoint "Neo4j Browser" "http://127.0.0.1:7474"

# PostgreSQL
try {
    $pg = Get-Service -Name "postgresql*" -ErrorAction Stop | Select-Object -First 1
    if ($pg.Status -eq "Running") {
        Write-Host "[OK] PostgreSQL service — Running" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] PostgreSQL service — $($pg.Status)" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] PostgreSQL — service not found" -ForegroundColor Red
}

# Redis / Memurai
try {
    $redis = Get-Service -Name "Memurai","redis*" -ErrorAction Stop | Select-Object -First 1
    if ($redis.Status -eq "Running") {
        Write-Host "[OK] Redis/Memurai service — Running" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Redis/Memurai service — $($redis.Status)" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Redis/Memurai — service not found" -ForegroundColor Red
}

