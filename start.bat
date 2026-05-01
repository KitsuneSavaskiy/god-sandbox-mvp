@echo off
chcp 65001 > nul
setlocal

set "REPO_ROOT=%~dp0"
cd /d "%REPO_ROOT%"

echo.
echo =========================================
echo   god-sandbox-mvp start script
echo =========================================
echo repo root: %CD%
echo.

node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found.
    echo Install Node.js from https://nodejs.org/ and run this script again.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set "NODE_VER=%%v"
echo [OK] Node.js: %NODE_VER%

call npm --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm was not found.
    echo Reinstall Node.js from https://nodejs.org/ and run this script again.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('npm --version') do set "NPM_VER=%%v"
echo [OK] npm: %NPM_VER%
echo.

if not exist "node_modules" (
    echo Installing dependencies. This can take a while the first time.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo.
)

echo Starting the main GodSandbox app.
echo Open http://localhost:5173 in your browser.
echo Press Ctrl+C to stop.
echo.
call npm run dev -- --host 0.0.0.0
