@echo off
REM ============================================================================
REM CAMTEL OnePortal — Frontend Startup Script
REM ============================================================================
REM This script navigates to the frontend directory and starts the development server.
REM 
REM Usage: Double-click this file or run from command prompt
REM ============================================================================

echo ========================================
echo   CAMTEL OnePortal — Frontend Startup
echo ========================================
echo.

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo Working directory: %SCRIPT_DIR%
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the development server
echo Starting development server...
echo The application will be available at: http://localhost:5173
echo.
call npm run dev

pause
