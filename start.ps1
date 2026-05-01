$ErrorActionPreference = "Stop"

$RepoRoot = $PSScriptRoot
Set-Location -LiteralPath $RepoRoot

Write-Host ""
Write-Host "========================================="
Write-Host "  god-sandbox-mvp 起動スクリプト"
Write-Host "========================================="
Write-Host "repo root: $RepoRoot"
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "[エラー] Node.js がインストールされていません。"
  Write-Host "ゲームを起動するには Node.js が必要です。"
  Write-Host "https://nodejs.org/ からインストールしてください。"
  exit 1
}

Write-Host "[OK] Node.js: $(node --version)"

$NpmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $NpmCommand) {
  $NpmCommand = Get-Command npm -ErrorAction SilentlyContinue
}

if (-not $NpmCommand) {
  Write-Host "[エラー] npm がインストールされていません。"
  Write-Host "Node.js を再インストールしてください: https://nodejs.org/"
  exit 1
}

Write-Host "[OK] npm: $(& $NpmCommand.Source --version)"
Write-Host ""

if (-not (Test-Path -LiteralPath "node_modules" -PathType Container)) {
  Write-Host "依存パッケージをインストールしています... 初回のみ時間がかかります。"
  & $NpmCommand.Source install
  Write-Host ""
}

Write-Host "育成ゲーム本体を起動しています。"
Write-Host "ブラウザで http://localhost:5173 を開いてください。"
Write-Host "終了するには Ctrl+C を押してください。"
Write-Host ""
& $NpmCommand.Source run dev -- --host 0.0.0.0
