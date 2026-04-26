@echo off
chcp 65001 > nul
echo.
echo =========================================
echo   god-sandbox-mvp 起動スクリプト
echo =========================================
echo.

REM ---- Node.js チェック ----
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [エラー] Node.js がインストールされていません。
    echo.
    echo ゲームを起動するには Node.js が必要です。
    echo 以下の URL からダウンロードしてインストールしてください:
    echo   https://nodejs.org/
    echo.
    set /p OPEN_BROWSER="ブラウザで Node.js のダウンロードページを開きますか？ (y/n): "
    if /i "%OPEN_BROWSER%"=="y" (
        start https://nodejs.org/
    )
    echo.
    echo Node.js をインストール後、このスクリプトを再度実行してください。
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo [OK] Node.js が見つかりました: %NODE_VER%

REM ---- npm チェック ----
npm --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [エラー] npm がインストールされていません。
    echo Node.js を再インストールしてください: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('npm --version') do set NPM_VER=%%v
echo [OK] npm が見つかりました: %NPM_VER%
echo.

REM ---- 依存パッケージのインストール ----
if not exist "node_modules" (
    echo 依存パッケージをインストールしています... (初回のみ時間がかかります)
    npm install
    if %errorlevel% neq 0 (
        echo [エラー] npm install が失敗しました。
        echo.
        echo 以下の点を確認してください:
        echo   - インターネット接続が正常か確認してください。
        echo   - 管理者権限でコマンドプロンプトを実行してみてください。
        echo   - npm のキャッシュをクリアしてから再実行してください: npm cache clean --force
        pause
        exit /b 1
    )
    echo.
)

REM ---- ゲーム起動 ----
echo ゲームを起動しています...
echo ブラウザで http://localhost:5173 を開いてください。
echo (自動でブラウザが開かない場合は手動でアクセスしてください)
echo 終了するには Ctrl+C を押してください。
echo.
npm run dev
