@echo off
chcp 65001 > nul
setlocal

set "REPO_ROOT=%~dp0"
cd /d "%REPO_ROOT%"

echo.
echo =========================================
echo   Passport Paper Battle 起動スクリプト
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
    echo [エラー] Python が見つかりませんでした。
    echo サンプル対戦ゲームは file:// ではなくローカルHTTPサーバーで開いてください。
    echo Python を入れる場合は https://www.python.org/ を確認してください。
    pause
    exit /b 1
)

echo サンプル対戦ゲームを起動しています。
echo ブラウザで http://localhost:8080/sample-games/passport-paper-battle/ を開いてください。
echo 終了するには Ctrl+C を押してください。
echo.
%PYTHON_CMD% -m http.server 8080
