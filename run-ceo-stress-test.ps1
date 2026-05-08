# ============================================================
# CEO STRESS TEST SCRIPT - packing-list
# Repo: https://github.com/liemdo28/packing-list
# Branch: master
# ============================================================

$ErrorActionPreference = "Stop"

$ROOT = "C:\Project\packing-list"
$REPO = "https://github.com/liemdo28/packing-list.git"
$REPORT_DIR = "$ROOT\reports\stress"
$STAMP = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host "=== 1. Pull latest source ==="
if (!(Test-Path $ROOT)) {
  git clone $REPO $ROOT
}
cd $ROOT
git checkout master
git pull origin master

New-Item -ItemType Directory -Force -Path $REPORT_DIR | Out-Null

Write-Host "=== 2. Start MySQL docker ==="
docker compose up -d

Write-Host "=== 3. Build React client ==="
cd "$ROOT\v2-react\client"
npm install
npm run build

Write-Host "=== 4. Install server dependencies + migrate + seed ==="
cd "$ROOT\v2-react\server"
npm install
Copy-Item ".env.example" ".env" -Force -ErrorAction SilentlyContinue
npm run migrate
npm run seed

Write-Host "=== 5. Start API server ==="
$server = Start-Process powershell -PassThru -ArgumentList "-NoExit", "-Command", "cd '$ROOT\v2-react\server'; npm run dev"
Start-Sleep -Seconds 10

Write-Host "=== 6. Run business simulation test ==="
cd $ROOT
node tests/simulation.js *> "$REPORT_DIR\simulation-$STAMP.log"

Write-Host "=== 7. Run k6 stress test suite ==="
cd "$ROOT\v2-react\server"

npm run stress:smoke *> "$REPORT_DIR\k6-smoke-$STAMP.log"
npm run stress:auth *> "$REPORT_DIR\k6-auth-$STAMP.log"
npm run stress:flow *> "$REPORT_DIR\k6-flow-$STAMP.log"
npm run stress:concurrency *> "$REPORT_DIR\k6-concurrency-$STAMP.log"
npm run stress:summary *> "$REPORT_DIR\k6-summary-$STAMP.log"
npm run stress:export *> "$REPORT_DIR\k6-export-$STAMP.log"
npm run stress:soak *> "$REPORT_DIR\k6-soak-$STAMP.log"

Write-Host "=== 8. Final report ==="
Write-Host "Reports saved to: $REPORT_DIR"

Write-Host ""
Write-Host "=============================================="
Write-Host "CEO CHECKLIST:"
Write-Host "=============================================="
Write-Host "- Client build must PASS"
Write-Host "- Migration/seed must PASS"
Write-Host "- Simulation assertions failed must be 0"
Write-Host "- k6 http_req_failed should be under 1%"
Write-Host "- Same-order concurrency must not create duplicate status/write conflict"
Write-Host "- Export/summary must not timeout"
Write-Host "=============================================="