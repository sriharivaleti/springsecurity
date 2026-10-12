@echo off
title SpringSec Master Local Server
echo ===============================================================
echo   Starting SpringSec Master on http://localhost:3000 ...
echo   Press Ctrl+C in this terminal window anytime to stop.
echo ===============================================================
echo.

:: Automatically open default browser after a brief 1-second pause
start "" "http://localhost:3000"

:: Start Python lightweight HTTP server on port 3000
python -m http.server 3000

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Python was not found in PATH, trying Node.js npx serve...
    npx -y serve . -l 3000
)

pause
