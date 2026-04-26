#!/usr/bin/env bash
# god-sandbox-mvp 起動スクリプト (macOS / Linux)
set -euo pipefail

echo ""
echo "========================================="
echo "  god-sandbox-mvp 起動スクリプト"
echo "========================================="
echo ""

# ---- Node.js チェック ----
if ! command -v node &> /dev/null; then
    echo "[エラー] Node.js がインストールされていません。"
    echo ""
    echo "ゲームを起動するには Node.js が必要です。"
    echo "以下の URL からダウンロードしてインストールしてください:"
    echo "  https://nodejs.org/"
    echo ""
    read -r -p "ブラウザで Node.js のダウンロードページを開きますか？ (y/n): " OPEN_BROWSER
    if [[ "${OPEN_BROWSER:-n}" =~ ^[Yy]$ ]]; then
        if command -v open &> /dev/null; then
            open "https://nodejs.org/"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "https://nodejs.org/"
        fi
    fi
    echo ""
    echo "Node.js をインストール後、このスクリプトを再度実行してください。"
    exit 1
fi

echo "[OK] Node.js が見つかりました: $(node --version)"

# ---- npm チェック ----
if ! command -v npm &> /dev/null; then
    echo "[エラー] npm がインストールされていません。"
    echo "Node.js を再インストールしてください: https://nodejs.org/"
    exit 1
fi

echo "[OK] npm が見つかりました: $(npm --version)"
echo ""

# ---- 依存パッケージのインストール ----
if [ ! -d "node_modules" ]; then
    echo "依存パッケージをインストールしています... (初回のみ時間がかかります)"
    npm install
    echo ""
fi

# ---- ゲーム起動 ----
echo "ゲームを起動しています..."
echo "ブラウザで http://localhost:5173 を開いてください。"
echo "(自動でブラウザが開かない場合は手動でアクセスしてください)"
echo "終了するには Ctrl+C を押してください。"
echo ""
npm run dev
