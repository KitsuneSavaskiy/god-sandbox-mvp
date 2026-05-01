@echo off
chcp 65001 > nul
setlocal

set "REPO_ROOT=%~dp0"
cd /d "%REPO_ROOT%"

echo.
echo =========================================
echo   Passport Paper Battle start script
echo =========================================
echo repo root: %CD%
echo.

set "PYTHON_CMD="
python --version > nul 2>&1
if %errorlevel% equ 0 (
    set "PYTHON_CMD=python"
) else (
    py -3 --version > nul 2>&1
    if %errorlevel% equ 0 (
        set "PYTHON_CMD=py -3"
    )
)

if "%PYTHON_CMD%"=="" (
    echo [ERROR] Python was not found.
    echo Open the sample battle through a local HTTP server, not file://.
    echo Install Python from https://www.python.org/ and run this script again.
    pause
    exit /b 1
)

echo Starting the Passport Paper Battle sample.
echo Open http://localhost:8080/sample-games/passport-paper-battle/ in your browser.
echo Press Ctrl+C to stop.
echo.
%PYTHON_CMD% -m http.server 8080
