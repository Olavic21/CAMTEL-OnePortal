# ============================================================================
# CAMTEL OnePortal — Demarrage de l'environnement de developpement
# ============================================================================
# Demarre (ou verifie) le backend Django (:8000) et le frontend Vite (:5173).
# IDEMPOTENT : si un serveur tourne deja, il n'est pas relance.
#
# Usage :
#   powershell -ExecutionPolicy Bypass -File scripts/start_dev.ps1
#
# Repond au probleme recurrent « catalogue inaccessible » : dans 99% des cas
# l'un des deux serveurs etait arrete. Ce script le detecte et le relance.
# ============================================================================

$ErrorActionPreference = 'Continue'
$Root = Split-Path -Parent $PSScriptRoot
$Py = Join-Path $Root '.venv\Scripts\python.exe'
$BackendDir = Join-Path $Root 'backend'
$FrontendDir = Join-Path $Root 'frontend\camtel\frontend'
$LogDir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Test-Port([int]$Port) {
    return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

# ---- 1. Backend Django -------------------------------------------------------
if (Test-Port 8000) {
    Write-Host '[OK] Backend deja actif sur :8000' -ForegroundColor Green
} else {
    if (-not (Test-Path $Py)) {
        Write-Host '[ERREUR] venv introuvable (.venv). Lancez scripts/setup.ps1 d abord.' -ForegroundColor Red
        exit 1
    }
    Write-Host 'Demarrage backend Django (detache, --noreload)...' -ForegroundColor Cyan
    Start-Process -FilePath $Py `
        -ArgumentList 'manage.py','runserver','127.0.0.1:8000','--noreload' `
        -WorkingDirectory $BackendDir -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $LogDir 'backend_stdout.log') `
        -RedirectStandardError  (Join-Path $LogDir 'backend_err.log')
    # Django est lent a demarrer sur les machines modestes : on attend.
    $tries = 0
    while (-not (Test-Port 8000) -and $tries -lt 12) { Start-Sleep -Seconds 5; $tries++ }
    if (Test-Port 8000) { Write-Host '[OK] Backend demarre sur :8000' -ForegroundColor Green }
    else { Write-Host '[ERREUR] Backend non demarre. Voir logs\backend_err.log' -ForegroundColor Red }
}

# ---- 2. Frontend Vite --------------------------------------------------------
if (Test-Port 5173) {
    Write-Host '[OK] Frontend deja actif sur :5173' -ForegroundColor Green
} else {
    Write-Host 'Demarrage frontend Vite (detache)...' -ForegroundColor Cyan
    Start-Process -FilePath 'cmd.exe' `
        -ArgumentList '/c','npm run dev > ..\..\..\logs\frontend_stdout.log 2> ..\..\..\logs\frontend_err.log' `
        -WorkingDirectory $FrontendDir -WindowStyle Hidden
    $tries = 0
    while (-not (Test-Port 5173) -and $tries -lt 12) { Start-Sleep -Seconds 5; $tries++ }
    if (Test-Port 5173) { Write-Host '[OK] Frontend demarre sur :5173' -ForegroundColor Green }
    else { Write-Host '[ERREUR] Frontend non demarre. Voir logs\frontend_err.log' -ForegroundColor Red }
}

# ---- 3. Verifications de sante ------------------------------------------------
Write-Host "`n--- Verifications ---" -ForegroundColor Cyan
try {
    $h = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/v1/health/live/' -UseBasicParsing -TimeoutSec 30
    Write-Host "[OK] Backend health : $($h.StatusCode)" -ForegroundColor Green
} catch { Write-Host '[WARN] Backend health injoignable' -ForegroundColor Yellow }
try {
    $p = Invoke-WebRequest -Uri 'http://localhost:5173/api/v1/products/' -UseBasicParsing -TimeoutSec 30
    $j = $p.Content | ConvertFrom-Json
    Write-Host "[OK] Chaine complete (Vite -> Django) : $($p.StatusCode), $($j.count) produits" -ForegroundColor Green
} catch { Write-Host '[WARN] Proxy Vite -> Django injoignable' -ForegroundColor Yellow }

Write-Host "`nPortail       : http://localhost:5173"
Write-Host   "Back Office   : http://localhost:5173/admin"
Write-Host   "API Django    : http://127.0.0.1:8000/api/v1/"