$ErrorActionPreference = "Stop"

$RepoRoot = $PSScriptRoot
Set-Location -LiteralPath $RepoRoot

Write-Host ""
Write-Host "========================================="
Write-Host "  god-sandbox-mvp startup"
Write-Host "========================================="
Write-Host "repo root: $RepoRoot"
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "[ERROR] Node.js is not installed."
  Write-Host "Install Node.js from https://nodejs.org/ and try again."
  exit 1
}

Write-Host "[OK] Node.js: $(node --version)"

$NpmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $NpmCommand) {
  $NpmCommand = Get-Command npm -ErrorAction SilentlyContinue
}

if (-not $NpmCommand) {
  Write-Host "[ERROR] npm is not installed."
  Write-Host "Reinstall Node.js from https://nodejs.org/ and try again."
  exit 1
}

Write-Host "[OK] npm: $(& $NpmCommand.Source --version)"
Write-Host ""

if (-not (Test-Path -LiteralPath "node_modules" -PathType Container)) {
  Write-Host "Installing dependencies... This may take a while on the first run."
  & $NpmCommand.Source install
  Write-Host ""
}

Write-Host "Starting GodSandbox development server."
Write-Host "Open http://localhost:5173 in your browser."
Write-Host "Press Ctrl+C to stop."
Write-Host ""
& $NpmCommand.Source run dev -- --host 0.0.0.0
