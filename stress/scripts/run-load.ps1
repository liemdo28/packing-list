/**
 * stress/scripts/run-load.ps1
 * Run: smoke → auth → order-flow → concurrency → summary → export
 * Reports each test's pass/fail status
 */

$ErrorActionPreference = "Stop"

$BASE_URL    = $env:BASE_URL    ?? "http://localhost:3001/api"
$ADMIN_EMAIL = $env:ADMIN_EMAIL ?? "admin@restaurant.com"
$ADMIN_PASS  = $env:ADMIN_PASSWORD ?? "password"
$B1_EMAIL    = $env:B1_EMAIL    ?? "b1@restaurant.com"
$B2_EMAIL    = $env:B2_EMAIL    ?? "b2@restaurant.com"
$B3_EMAIL    = $env:B3_EMAIL    ?? "b3@restaurant.com"

$env:BASE_URL = $BASE_URL
$env:ADMIN_EMAIL = $ADMIN_EMAIL
$env:ADMIN_PASSWORD = $ADMIN_PASS
$env:B1_EMAIL = $B1_EMAIL
$env:B2_EMAIL = $B2_EMAIL
$env:B3_EMAIL = $B3_EMAIL

$REPORT_DIR = Join-Path $PSScriptRoot "..\reports"
if (-not (Test-Path $REPORT_DIR)) {
    New-Item -ItemType Directory -Path $REPORT_DIR -Force | Out-Null
}
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm"
$OUT_DIR   = $REPORT_DIR

function Run-Test($name, $script, $exitOnFail = $true) {
    Write-Host ""
    Write-Host "══ $name ══" -ForegroundColor Yellow
    $out = Join-Path $OUT_DIR "$TIMESTAMP-$name.json"
    $env:STAGE = $name
    k6 run --out json="$out" --quiet (Join-Path $PSScriptRoot "..\k6\$script")
    $EXIT = $LASTEXITCODE
    if ($EXIT -eq 0) {
        Write-Host "✅ $name PASSED" -ForegroundColor Green
    } else {
        Write-Host "❌ $name FAILED (exit $EXIT)" -ForegroundColor Red
        if ($exitOnFail) { exit $EXIT }
    }
}

# Pre-flight: verify servers are reachable
Write-Host "=== Pre-flight health check ===" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri "$BASE_URL/auth/me" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($r.StatusCode -eq 401 -or $r.StatusCode -eq 200) {
        Write-Host "  ✅ API reachable at $BASE_URL" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  API returned $($r.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Cannot reach API at $BASE_URL — aborting" -ForegroundColor Red
    exit 1
}

Run-Test "smoke"       "smoke.js"
Run-Test "auth-load"   "auth-load.js"
Run-Test "order-flow"  "order-flow.js"
Run-Test "summary-load" "summary-load.js"
Run-Test "export-load" "export-load.js"

Write-Host ""
Write-Host "══ All load tests complete ══" -ForegroundColor Cyan
Write-Host "Reports saved to: $REPORT_DIR"