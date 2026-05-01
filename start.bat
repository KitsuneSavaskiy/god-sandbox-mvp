@echo off
chcp 65001 > nul
setlocal

set "REPO_ROOT=%~dp0"
cd /d "%REPO_ROOT%"

echo.
echo =========================================
echo   god-sandbox-mvp 起動スクリプト
echo =========================================
echo repo root: %CD%
echo.

node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [エラー] Node.js がインストールされていません。
    echo ゲームを起動するには Node.js が必要です。
    echo https://nodejs.org/ からインストールしてください。
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set "NODE_VER=%%v"
echo [OK] Node.js: %NODE_VER%

npm --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [エラー] npm がインストールされていません。
    echo Node.js を再インストールしてください: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('npm --version') do set "NPM_VER=%%v"
echo [OK] npm: %NPM_VER%
echo.

if not exist "node_modules" (
    echo 依存パッケージをインストールしています... 初回のみ時間がかかります。
    npm install
    if %errorlevel% neq 0 (
        echo [エラー] npm install が失敗しました。
        pause
        exit /b 1
    )
    echo.
)

echo 育成ゲーム本体を起動しています。
echo ブラウザで http://localhost:5173 を開いてください。
echo 終了するには Ctrl+C を押してください。
echo.
npm run dev -- --host 0.0.0.0
