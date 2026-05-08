/**
 * stress/scripts/run-concurrency.ps1
 *
 * Run the same-order concurrency test with configurable VUs and action.
 *
 * Usage:
 *   .\run-concurrency.ps1                              # 20 VUs, complete action
 *   .\run-concurrency.ps1 -OrderId 42 -Action cancel  # specific order, cancel
 *   .\run-concurrency.ps1 -ConcurrentUsers 50          # 50 simultaneous callers
 */

param(
    [int]$OrderId           = 0,          # 0 = create fresh order in setup()
    [string]$Action          = "complete", # submit|prepare|ship|receive|complete|cancel
    [int]$ConcurrentUsers    = 20
)

$ErrorActionPreference = "Stop"

$BASE_URL    = $env:BASE_URL    ?? "http://localhost:3001/api"
$ADMIN_USER = $env:ADMIN_USER ?? "admin"
$ADMIN_PASS  = $env:ADMIN_PASSWORD ?? "password"

$env:BASE_URL = $BASE_URL
$env:ADMIN_USER = $ADMIN_USER
$env:ADMIN_PASSWORD = $ADMIN_PASS
$env:ACTION = $Action
$env:CONCURRENT_USERS = $ConcurrentUsers

if ($OrderId -gt 0) {
    $env:ORDER_ID = $OrderId
    Write-Host "Testing existing order ID: $OrderId" -ForegroundColor Cyan
} else {
    Write-Host "Will create a fresh order in setup phase" -ForegroundColor Cyan
}

$REPORT_DIR = Join-Path $PSScriptRoot "..\reports"
if (-not (Test-Path $REPORT_DIR)) {
    New-Item -ItemType Directory -Path $REPORT_DIR -Force | Out-Null
}
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm"
$OUT_FILE  = Join-Path $REPORT_DIR "$TIMESTAMP-concurrency-${Action}.json"

Write-Host "=== Same-Order Concurrency Test ===" -ForegroundColor Cyan
Write-Host "  Action:       $Action"
Write-Host "  Concurrent:     $ConcurrentUsers VUs"
Write-Host "  BASE_URL:      $BASE_URL"
Write-Host ""

k6 run --out json="$OUT_FILE" (Join-Path $PSScriptRoot "..\k6\same-order-concurrency.js")
$EXIT = $LASTEXITCODE

if ($EXIT -eq 0) {
    Write-Host "✅ Concurrency test PASSED" -ForegroundColor Green
} else {
    Write-Host "❌ Concurrency test FAILED (exit $EXIT)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Report: $OUT_FILE" -ForegroundColor Gray

# Post-test: run SQL integrity checks
Write-Host ""
Write-Host "=== Running DB integrity checks ===" -ForegroundColor Yellow
$mysql = Get-Command mysql -ErrorAction SilentlyContinue
if ($mysql) {
    $env:MYSQL_PWD = $env:MYSQL_PASSWORD ?? ""
    mysql -u root -p"$($env:MYSQL_PWD)" packing_list < (Join-Path $PSScriptRoot "..\sql\integrity-checks.sql")
} else {
    Write-Host "mysql CLI not found — skip DB checks" -ForegroundColor Gray
}

exit $EXIT