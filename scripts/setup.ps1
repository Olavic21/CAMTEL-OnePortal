# ============================================================================
# CAMTEL OnePortal -- Setup one-command (Windows PowerShell)
# ============================================================================
# Installe, migre, charge les donnees et prepare le systeme complet
# (regle #43 du cahier des charges). Idempotent : relancer ne casse rien.
#
# Usage :
#   powershell -ExecutionPolicy Bypass -File scripts/setup.ps1           # complet
#   powershell -ExecutionPolicy Bypass -File scripts/setup.ps1 -SkipDemo # sans seed demo
#
# L'installation manuelle decrite dans README.md reste 100% equivalente.
# ============================================================================

param(
    [switch]$SkipDemo = $false
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot

Write-Host "=== CAMTEL OnePortal -- Setup ===" -ForegroundColor Cyan
Write-Host "Racine : $Root"

# ---- 1. Verification des prerequis -----------------------------------------
try { $pyVersion = python --version } catch {
    Write-Host "[ERREUR] Python introuvable. Installez Python 3.12+ et relancez." -ForegroundColor Red; exit 1
}
Write-Host "[OK] $pyVersion"
try { $nodeVersion = node --version } catch {
    Write-Host "[ERREUR] Node.js introuvable. Installez Node 20+ et relancez." -ForegroundColor Red; exit 1
}
Write-Host "[OK] Node $nodeVersion"

# ---- 2. Backend : venv + dependances ----------------------------------------
Write-Host "`n--- Backend : environnement virtuel + dependances ---" -ForegroundColor Cyan
Push-Location $Root
if (-not (Test-Path ".venv")) {
    python -m venv .venv
    Write-Host "[OK] venv cree (.venv)"
} else {
    Write-Host "[OK] venv deja present (.venv)"
}
$python = Join-Path $Root ".venv\Scripts\python.exe"
& $python -m pip install --quiet -r requirements.txt
Write-Host "[OK] dependances backend installees"

# ---- 3. Migrations -----------------------------------------------------------
Write-Host "`n--- Backend : migrations ---" -ForegroundColor Cyan
Push-Location (Join-Path $Root "backend")
& $python manage.py migrate --noinput
& $python manage.py makemigrations --check --dry-run
Write-Host "[OK] migrations appliquees"

# ---- 4. Catalogue officiel (idempotent) -------------------------------------
Write-Host "`n--- Backend : catalogue CAMTEL ---" -ForegroundColor Cyan
& $python manage.py seed_camtel_data
& $python manage.py validate_camtel_data
& $python manage.py attach_official_images
Write-Host "[OK] catalogue charge + valide"

# ---- 5. Seed demo (dev uniquement) ------------------------------------------
if ($SkipDemo) {
    Write-Host "`n[SKIP] seed demo desactive (-SkipDemo)"
} else {
    Write-Host "`n--- Backend : seed demo (dev) ---" -ForegroundColor Cyan
    & $python manage.py seed_data
    Write-Host "[OK] comptes demo : superadmin / CamtelAdmin2026! (dev uniquement)"
}

# ---- 6. Superadmin -----------------------------------------------------------
Write-Host "`n--- Superadmin ---" -ForegroundColor Cyan
Write-Host "Compte demo 'superadmin' disponible (seed_data, dev uniquement)."
Write-Host "Pour un Superadmin en production : python manage.py createsuperuser"

# ---- 7. Frontend : dependances ----------------------------------------------
Write-Host "`n--- Frontend : dependances npm ---" -ForegroundColor Cyan
Push-Location (Join-Path $Root "frontend\camtel\frontend")
npm install
Write-Host "[OK] dependances frontend installees"

Pop-Location; Pop-Location; Pop-Location

# ---- Recap -------------------------------------------------------------------
Write-Host "`n=== SETUP TERMINE ===" -ForegroundColor Green
Write-Host "Backend  : cd backend ; ..\.venv\Scripts\python.exe manage.py runserver"
Write-Host "           API  : http://127.0.0.1:8000/api/v1/   Swagger : /api/docs/"
Write-Host "Frontend : cd frontend\camtel\frontend ; npm run dev"
Write-Host "           UI   : http://localhost:5173"
Write-Host "Comptes demo (dev) : superadmin / CamtelAdmin2026! | admin / admin123 | editor / editor123"