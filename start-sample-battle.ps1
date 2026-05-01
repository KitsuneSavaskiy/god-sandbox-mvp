$ErrorActionPreference = "Stop"

$RepoRoot = $PSScriptRoot
Set-Location -LiteralPath $RepoRoot

Write-Host ""
Write-Host "========================================="
Write-Host "  Passport Paper Battle startup"
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
  Write-Host "[ERROR] Python was not found."
  Write-Host "Open the sample battle through a local HTTP server, not file://."
  Write-Host "Install Python from https://www.python.org/ and try again."
  exit 1
}

Write-Host "Starting Passport Paper Battle local server."
Write-Host "Open http://localhost:8080/sample-games/passport-paper-battle/ in your browser."
Write-Host "Press Ctrl+C to stop."
Write-Host ""
& $PythonCommand @PythonArgs -m http.server 8080
