/**
 * stress/scripts/run-smoke.ps1
 * Run smoke test + report result
 */

$ErrorActionPreference = "Stop"

$BASE_URL = $env:BASE_URL ?? "http://localhost:3001/api"
$ADMIN_EMAIL = $env:ADMIN_EMAIL ?? "admin@restaurant.com"
$ADMIN_PASSWORD = $env:ADMIN_PASSWORD ?? "password"

$REPORT_DIR = Join-Path $PSScriptRoot "..\reports"
if (-not (Test-Path $REPORT_DIR)) {
    New-Item -ItemType Directory -Path $REPORT_DIR -Force | Out-Null
}
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm"
$OUT_FILE = Join-Path $REPORT_DIR "$TIMESTAMP-smoke.json"

Write-Host "=== Smoke Test ===" -ForegroundColor Cyan
Write-Host "BASE_URL: $BASE_URL"

$env:BASE_URL = $BASE_URL
$env:ADMIN_EMAIL = $ADMIN_EMAIL
$env:ADMIN_PASSWORD = $ADMIN_PASSWORD

k6 run --out json="$OUT_FILE" (Join-Path $PSScriptRoot "..\k6\smoke.js")
$EXIT = $LASTEXITCODE

if ($EXIT -eq 0) {
    Write-Host "✅ Smoke test PASSED" -ForegroundColor Green
} else {
    Write-Host "❌ Smoke test FAILED (exit $EXIT)" -ForegroundColor Red
}

exit $EXIT