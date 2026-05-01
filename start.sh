#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

echo ""
echo "========================================="
echo "  god-sandbox-mvp 起動スクリプト"
echo "========================================="
echo "repo root: $(pwd)"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "[エラー] Node.js がインストールされていません。"
  echo "ゲームを起動するには Node.js が必要です。"
  echo "https://nodejs.org/ からインストールしてください。"
  exit 1
fi

echo "[OK] Node.js: $(node --version)"

if ! command -v npm >/dev/null 2>&1; then
  echo "[エラー] npm がインストールされていません。"
  echo "Node.js を再インストールしてください: https://nodejs.org/"
  exit 1
fi

echo "[OK] npm: $(npm --version)"
echo ""

if [ ! -d "node_modules" ]; then
  echo "依存パッケージをインストールしています... 初回のみ時間がかかります。"
  npm install
  echo ""
fi

echo "育成ゲーム本体を起動しています。"
echo "ブラウザで http://localhost:5173 を開いてください。"
echo "終了するには Ctrl+C を押してください。"
echo ""
npm run dev -- --host 0.0.0.0
