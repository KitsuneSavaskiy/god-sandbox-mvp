#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

echo ""
echo "========================================="
echo "  Passport Paper Battle 起動スクリプト"
echo "========================================="
echo "repo root: $(pwd)"
echo ""

if command -v python3 >/dev/null 2>&1; then
  PYTHON_CMD=(python3)
elif command -v python >/dev/null 2>&1; then
  PYTHON_CMD=(python)
else
  echo "[エラー] Python が見つかりませんでした。"
  echo "サンプル対戦ゲームは file:// ではなくローカルHTTPサーバーで開いてください。"
  echo "Python を入れる場合は https://www.python.org/ を確認してください。"
  exit 1
fi

echo "サンプル対戦ゲームを起動しています。"
echo "ブラウザで http://localhost:8080/sample-games/passport-paper-battle/ を開いてください。"
echo "終了するには Ctrl+C を押してください。"
echo ""
"${PYTHON_CMD[@]}" -m http.server 8080
