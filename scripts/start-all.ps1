# NeuroDesk AI — Start All Services
# Run from the repo root: scripts\start-all.ps1
# Adjust paths if PostgreSQL/Neo4j/Redis are installed elsewhere.

Write-Host "=== NeuroDesk AI — Starting services ===" -ForegroundColor Cyan

# ── 1. PostgreSQL (should auto-start as Windows service) ──────────────────
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -eq "Running") {
    Write-Host "[OK] PostgreSQL is running" -ForegroundColor Green
} elseif ($pgService) {
    Write-Host "[..] Starting PostgreSQL service..." -ForegroundColor Yellow
    Start-Service $pgService.Name
} else {
    Write-Host "[WARN] PostgreSQL service not found — install it first" -ForegroundColor Red
}

# ── 2. Redis / Memurai ────────────────────────────────────────────────────
$redisService = Get-Service -Name "Memurai","redis*" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($redisService -and $redisService.Status -eq "Running") {
    Write-Host "[OK] Redis/Memurai is running" -ForegroundColor Green
} elseif ($redisService) {
    Write-Host "[..] Starting Redis/Memurai service..." -ForegroundColor Yellow
    Start-Service $redisService.Name
} else {
    Write-Host "[WARN] Redis/Memurai service not found — install it first" -ForegroundColor Red
}

# ── 3. Neo4j ─────────────────────────────────────────────────────────────
$neo4jService = Get-Service -Name "neo4j*" -ErrorAction SilentlyContinue
if ($neo4jService -and $neo4jService.Status -eq "Running") {
    Write-Host "[OK] Neo4j is running" -ForegroundColor Green
} elseif ($neo4jService) {
    Write-Host "[..] Starting Neo4j service..." -ForegroundColor Yellow
    Start-Service $neo4jService.Name
} else {
    Write-Host "[WARN] Neo4j service not found — install it first" -ForegroundColor Red
}

# ── 4. Ollama ─────────────────────────────────────────────────────────────
$ollamaExe = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
$ollamaRunning = $false
try {
    $ollamaRunning = (Invoke-RestMethod "http://127.0.0.1:11434" -ErrorAction Stop) -ne $null
} catch {}

if ($ollamaRunning) {
    Write-Host "[OK] Ollama is running" -ForegroundColor Green
} elseif (Test-Path $ollamaExe) {
    Write-Host "[..] Starting Ollama..." -ForegroundColor Yellow
    Start-Process $ollamaExe -ArgumentList "serve" -WindowStyle Minimized
    Start-Sleep 3
    Write-Host "[OK] Ollama started" -ForegroundColor Green
} else {
    Write-Host "[WARN] Ollama not found at $ollamaExe" -ForegroundColor Red
}

# ── 5. Python AI service ──────────────────────────────────────────────────
Write-Host "[..] Starting Python AI service on 127.0.0.1:8000..." -ForegroundColor Yellow
$aiDir = Join-Path $PSScriptRoot "..\services\ai"
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "cd '$aiDir'; .venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload" `
    -WindowStyle Normal

# ── 6. Node API ───────────────────────────────────────────────────────────
Write-Host "[..] Starting Node API on 127.0.0.1:4000..." -ForegroundColor Yellow
$apiDir = Join-Path $PSScriptRoot "..\services\api"
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "cd '$apiDir'; npx tsx watch src\index.ts" `
    -WindowStyle Normal

# ── 7. Next.js web ────────────────────────────────────────────────────────
Write-Host "[..] Starting Next.js on 127.0.0.1:3000..." -ForegroundColor Yellow
$webDir = Join-Path $PSScriptRoot "..\apps\web"
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "cd '$webDir'; pnpm dev" `
    -WindowStyle Normal

Write-Host ""
Write-Host "=== All services started ===" -ForegroundColor Cyan
Write-Host "Web:     http://127.0.0.1:3000"
Write-Host "API:     http://127.0.0.1:4000/api/v1/health"
Write-Host "AI:      http://127.0.0.1:8000/health"
Write-Host "Neo4j:   http://127.0.0.1:7474"
