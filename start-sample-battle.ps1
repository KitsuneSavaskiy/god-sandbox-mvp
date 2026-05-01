$ErrorActionPreference = "Stop"

$RepoRoot = $PSScriptRoot
Set-Location -LiteralPath $RepoRoot

Write-Host ""
Write-Host "========================================="
Write-Host "  Passport Paper Battle 起動スクリプト"
Write-Host "========================================="
Write-Host "repo root: $RepoRoot"
Write-Host ""

$PythonCommand = $null
$PythonArgs = @()

if (Get-Command python -ErrorAction SilentlyContinue) {
  $PythonCommand = "python"
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
  $PythonCommand = "py"
  $PythonArgs = @("-3")
}

if (-not $PythonCommand) {
  Write-Host "[エラー] Python が見つかりませんでした。"
  Write-Host "サンプル対戦ゲームは file:// ではなくローカルHTTPサーバーで開いてください。"
  Write-Host "Python を入れる場合は https://www.python.org/ を確認してください。"
  exit 1
}

Write-Host "サンプル対戦ゲームを起動しています。"
Write-Host "ブラウザで http://localhost:8080/sample-games/passport-paper-battle/ を開いてください。"
Write-Host "終了するには Ctrl+C を押してください。"
Write-Host ""
& $PythonCommand @PythonArgs -m http.server 8080
