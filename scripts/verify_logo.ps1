# Verification TypeScript + Lint apres changement de logo.
$ErrorActionPreference = 'Continue'
$n =  8
$fe = 'c:\Users\HP PROBOOK 450 G2\CAMTEL-OnePortal\frontend\camtel\frontend'

Push-Location $fe
Write-Host '=== TSC ==='
npx tsc -b 2>&1 | Select-Object -Last $n
Write-Host ('TSC EXIT CODE = ' + $LASTEXITCODE)

Write-Host '=== LINT ==='
npm run lint 2>&1 | Select-Object -Last $n
Write-Host ('LINT EXIT CODE = ' + $LASTEXITCODE)
Pop-Location