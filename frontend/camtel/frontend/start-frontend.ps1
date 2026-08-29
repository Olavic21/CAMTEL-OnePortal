# ============================================================================
# CAMTEL OnePortal — Frontend Startup Script
# ============================================================================
# This script navigates to the frontend directory and starts the development server.
# 
# Usage: Right-click > "Run with PowerShell" or execute: .\start-frontend.ps1
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CAMTEL OnePortal — Frontend Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Working directory: $scriptDir" -ForegroundColor Yellow
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "$scriptDir\node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Green
    Set-Location $scriptDir
    npm install
    Write-Host ""
}

# Start the development server
Write-Host "Starting development server..." -ForegroundColor Green
Write-Host "The application will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Set-Location $scriptDir
npm run dev
