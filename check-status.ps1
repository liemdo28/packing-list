#Requires -Version 5.1
<#
  Packing List System - Health Check
  Run via check-status.bat (double-click) or:
    powershell -ExecutionPolicy Bypass -File check-status.ps1
#>

$ErrorActionPreference = "SilentlyContinue"

$STATUS_DIR   = "C:\PackingList"
$LOG_DIR      = "$STATUS_DIR\logs"
$PC_NAME      = $env:COMPUTERNAME
$CHECK_TIME   = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
$APP_VERSION  = "1.0.0"

# -- Helpers -------------------------------------------------------------------

function Write-Header($msg) {
    Write-Host ""
    Write-Host ("=" * 56) -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host ("=" * 56) -ForegroundColor Cyan
}
function Write-Ok($msg)   { Write-Host "  [OK]   $msg" -ForegroundColor Green }
function Write-Fail($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red }
function Write-Skip($msg) { Write-Host "  [SKIP] $msg" -ForegroundColor Gray }
function Write-Warn($msg) { Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Write-Info($msg) { Write-Host "         $msg" -ForegroundColor Gray }

# -- Load config from previous install -----------------------------------------

$configPath = "$STATUS_DIR\config.json"
$REPO_DIR   = $PSScriptRoot
$HasBot     = $false
$DB_PASS    = ""
$TG_TOKEN   = ""
$TG_CHAT_ID = ""

if (Test-Path $configPath) {
    try {
        $cfg      = Get-Content $configPath -Raw | ConvertFrom-Json
        $REPO_DIR = $cfg.repoDir
        $HasBot   = [bool]$cfg.hasBot
        Write-Info "Config loaded from $configPath"
    } catch {
        Write-Warn "Could not read config.json - using script directory"
    }
} else {
    Write-Warn "No config.json found at $configPath"
    Write-Warn "Run setup.bat first, or place this script in the repo directory."
}

# -- Read credentials from .env files ------------------------------------------

function Read-EnvValue($envPath, $key) {
    if (-not (Test-Path $envPath)) { return "" }
    $line = Get-Content $envPath | Where-Object { $_ -match "^$key=" } | Select-Object -First 1
    if ($line) { return $line.Split("=", 2)[1].Trim() }
    return ""
}

$serverEnv   = Join-Path $REPO_DIR "v2-react\server\.env"
$monitorEnv  = Join-Path $REPO_DIR "monitoring\.env"
$telegramEnv = Join-Path $REPO_DIR "telegram\.env"

$DB_PASS    = Read-EnvValue $serverEnv "DB_PASS"
$TG_TOKEN   = Read-EnvValue $monitorEnv "TELEGRAM_BOT_TOKEN"
$TG_CHAT_ID = Read-EnvValue $monitorEnv "TELEGRAM_ADMIN_CHAT_ID"

if (-not $TG_TOKEN) {
    $TG_TOKEN = Read-EnvValue $telegramEnv "TELEGRAM_BOT_TOKEN"
}

# -- Health checks -------------------------------------------------------------

function Get-PM2Procs {
    try {
        $raw = & pm2 jlist 2>$null
        if ($raw) { return ($raw | ConvertFrom-Json) }
    } catch {}
    return @()
}

function Invoke-AllChecks {
    $c = [ordered]@{}

    # 1. Node.js
    try {
        $ver = (& node --version 2>$null)
        $c['nodejs'] = @{ ok=$true; msg="$ver installed"; required=$true }
    } catch {
        $c['nodejs'] = @{ ok=$false; msg="not found"; required=$true }
    }

    # 2. Database service
    $svc = Get-Service "MariaDB","MySQL" -ErrorAction SilentlyContinue |
           Where-Object Status -eq "Running" | Select-Object -First 1
    if ($svc) {
        $c['db_service'] = @{ ok=$true; msg="$($svc.Name) running"; required=$true }
    } else {
        $c['db_service'] = @{ ok=$false; msg="MariaDB/MySQL not running"; required=$true }
    }

    # 3. Database exists (via packing_app user)
    if ($DB_PASS) {
        try {
            $res = "SHOW DATABASES LIKE 'packing_list_prod';" | & mysql -u packing_app -p"$DB_PASS" 2>$null
            $c['database'] = @{ ok=($res -match 'packing_list_prod'); msg="packing_list_prod exists"; required=$true }
        } catch {
            $c['database'] = @{ ok=$false; msg="cannot connect as packing_app"; required=$true }
        }
    } else {
        $c['database'] = @{ ok=$null; skip=$true; msg="checked via API /health/db instead"; required=$false }
    }

    # 4. Backend .env
    $envPath = Join-Path $REPO_DIR "v2-react\server\.env"
    $envOk   = Test-Path $envPath
    $c['env_file'] = @{ ok=$envOk; msg=if($envOk){".env present"}else{".env missing at $envPath"}; required=$true }

    # 5-7. PM2 processes
    $pm2 = Get-PM2Procs

    $apiProc   = $pm2 | Where-Object { $_.name -eq 'packing-api' }
    $apiOnline = $apiProc -and ($apiProc | Select-Object -ExpandProperty pm2_env).status -eq 'online'
    $c['pm2_api'] = @{ ok=[bool]$apiOnline; msg=if($apiOnline){"online"}else{"not running - run: pm2 logs packing-api"}; required=$true }

    $monProc   = $pm2 | Where-Object { $_.name -eq 'packing-monitor' }
    $monOnline = $monProc -and ($monProc | Select-Object -ExpandProperty pm2_env).status -eq 'online'
    $c['pm2_monitor'] = @{ ok=[bool]$monOnline; msg=if($monOnline){"online"}else{"not running"}; required=$true }

    if ($HasBot) {
        $botProc   = $pm2 | Where-Object { $_.name -eq 'packing-bot' }
        $botOnline = $botProc -and ($botProc | Select-Object -ExpandProperty pm2_env).status -eq 'online'
        $c['pm2_bot'] = @{ ok=[bool]$botOnline; msg=if($botOnline){"online"}else{"not running"}; required=$true }
    } else {
        $c['pm2_bot'] = @{ ok=$null; skip=$true; msg="not configured (no Telegram token)"; required=$false }
    }

    # 8. API /health
    try {
        $h = Invoke-RestMethod "http://localhost:3001/health" -TimeoutSec 8 -ErrorAction Stop
        $c['api_health'] = @{ ok=($h.status -eq 'ok'); msg="status=$($h.status) uptime=$($h.uptime)s"; required=$true }
    } catch {
        $c['api_health'] = @{ ok=$false; msg="unreachable (port 3001)"; required=$true }
    }

    # 9. DB health via API
    try {
        $dh = Invoke-RestMethod "http://localhost:3001/health/db" -TimeoutSec 8 -ErrorAction Stop
        $c['db_health'] = @{ ok=($dh.status -eq 'ok'); msg="status=$($dh.status) latency=$($dh.latencyMs)ms"; required=$true }
    } catch {
        $c['db_health'] = @{ ok=$false; msg="unreachable"; required=$true }
    }

    # 10. Port 3001 listening
    $portLine = netstat -ano 2>$null | Select-String "0\.0\.0\.0:3001\s"
    $c['port_3001'] = @{ ok=($null -ne $portLine); msg=if($portLine){"port 3001 listening"}else{"not listening"}; required=$true }

    # 11. Cloudflare Tunnel service
    $cfSvc = Get-Service "cloudflared" -ErrorAction SilentlyContinue
    $cfOk  = $cfSvc -and $cfSvc.Status -eq 'Running'
    $c['cloudflare'] = @{ ok=$cfOk; msg=if($cfOk){"cloudflared service running"}else{"not running as Windows service"}; required=$false }

    # 12. Remote API reachable
    try {
        $r = Invoke-WebRequest "https://api.bakudanramen.com/health" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        $c['remote_api'] = @{ ok=($r.StatusCode -eq 200); msg="reachable (HTTP $($r.StatusCode))"; required=$false }
    } catch {
        $c['remote_api'] = @{ ok=$false; msg="not reachable (DNS/tunnel may be propagating)"; required=$false }
    }

    # 13. Telegram configured
    if ($TG_TOKEN) {
        $c['telegram'] = @{ ok=$true; msg="token configured"; required=$false }
    } else {
        $c['telegram'] = @{ ok=$null; skip=$true; msg="not configured"; required=$false }
    }

    return $c
}

# -- Report generators ---------------------------------------------------------

function Build-CheckRows($checks) {
    $labels = @{
        'nodejs'      = 'Node.js'
        'db_service'  = 'Database Service (MariaDB)'
        'database'    = 'Database (packing_list_prod)'
        'env_file'    = 'Backend .env File'
        'pm2_api'     = 'API Process (PM2)'
        'pm2_monitor' = 'Monitoring Process (PM2)'
        'pm2_bot'     = 'Telegram Bot Process (PM2)'
        'api_health'  = 'API /health'
        'db_health'   = 'Database /health/db'
        'port_3001'   = 'Port 3001'
        'cloudflare'  = 'Cloudflare Tunnel'
        'remote_api'  = 'Remote API Domain'
        'telegram'    = 'Telegram Alert'
    }
    $sb = [System.Text.StringBuilder]::new()
    foreach ($key in $checks.Keys) {
        $ch    = $checks[$key]
        $label = if ($labels[$key]) { $labels[$key] } else { $key }
        if ($ch.skip -or $null -eq $ch.ok) {
            $badge = "<span class='badge skip'>SKIP</span>"
        } elseif ($ch.ok) {
            $badge = "<span class='badge ok'>OK</span>"
        } else {
            $badge = "<span class='badge fail'>FAIL</span>"
        }
        [void]$sb.AppendLine("    <div class='check'>$badge<span class='cname'>$label</span><span class='cmsg'>$($ch.msg)</span></div>")
    }
    return $sb.ToString()
}

function Save-HtmlReport($checks, $allOk) {
    $bannerClass = if ($allOk) { "success" } else { "failed" }
    $bannerText  = if ($allOk) { "ALL CHECKS PASSED" } else { "CHECKS FAILED" }
    $checkRows   = Build-CheckRows $checks

    $failedItems = $checks.Keys |
        Where-Object { $checks[$_].required -and $checks[$_].ok -eq $false } |
        ForEach-Object { $checks[$_].msg }

    $failedHtml = ""
    if (-not $allOk -and $failedItems) {
        $liItems = ($failedItems | ForEach-Object { "      <li>$_</li>" }) -join "`n"
        $failedHtml = "<div class='fail-box'><h2>What Failed</h2><ul>`n$liItems`n    </ul><p>Fix each item then double-click <b>check-status.bat</b> to re-run.</p></div>"
    }

    $nextClass = if ($allOk) { "next-ok" } else { "next-fail" }
    $nextTitle = if ($allOk) { "System is Healthy" } else { "Recovery Steps" }
    if ($allOk) {
        $nextBody = @"
    <ol>
      <li>Open app: <a href="https://packinglist.bakudanramen.com">https://packinglist.bakudanramen.com</a></li>
      <li>All processes running and DB reachable</li>
      <li>Run smoke test: open terminal, cd monitoring, node smoke_flow_full.js</li>
    </ol>
"@
    } else {
        $nextBody = @"
    <ol>
      <li>Fix the failed items listed above</li>
      <li>Double-click <b>check-status.bat</b> to re-run all checks</li>
      <li>For API issues: open terminal and run <code>pm2 logs packing-api</code></li>
      <li>For DB issues: check MariaDB service in Windows Services</li>
    </ol>
"@
    }

    $css = @'
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;background:#f3f4f6;padding:24px}
.card{max-width:740px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.12)}
.banner{padding:32px;text-align:center;color:#fff;font-size:30px;font-weight:bold;letter-spacing:2px}
.banner.success{background:#16a34a}.banner.failed{background:#dc2626}
.meta{padding:14px 24px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280}
.meta b{color:#374151}
.section{padding:20px 24px;border-bottom:1px solid #e5e7eb}
.section h2{font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;margin-bottom:14px}
.check{display:flex;align-items:center;padding:9px 0;border-bottom:1px solid #f3f4f6}
.check:last-child{border-bottom:none}
.badge{display:inline-block;width:52px;font-size:11px;font-weight:bold;padding:3px 6px;border-radius:4px;text-align:center;margin-right:14px;flex-shrink:0}
.badge.ok{background:#dcfce7;color:#16a34a}.badge.fail{background:#fee2e2;color:#dc2626}.badge.skip{background:#f3f4f6;color:#9ca3af}
.cname{font-size:14px;font-weight:500;min-width:220px;color:#374151}
.cmsg{font-size:13px;color:#6b7280}
.urls{padding:20px 24px;background:#eff6ff;border-bottom:1px solid #e5e7eb}
.urls h2{font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;color:#1d4ed8;margin-bottom:12px}
.url-row{padding:6px 0;font-size:14px}
.url-row a{color:#1d4ed8;text-decoration:none}.url-row a:hover{text-decoration:underline}
.url-label{font-weight:500;color:#374151;min-width:160px;display:inline-block}
.fail-box{padding:20px 24px;background:#fef2f2;border-top:2px solid #dc2626}
.fail-box h2{font-size:13px;font-weight:bold;text-transform:uppercase;color:#dc2626;margin-bottom:10px}
.fail-box ul{padding-left:20px;margin-bottom:10px}.fail-box li{padding:3px 0;font-size:14px;color:#374151}
.fail-box p{font-size:13px;color:#6b7280}
.next-section{padding:20px 24px}
.next-ok{background:#f0fdf4}.next-fail{background:#fef2f2}
.next-section h2{font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px}
.next-ok h2{color:#16a34a}.next-fail h2{color:#dc2626}
.next-section ol{padding-left:20px}.next-section li{padding:5px 0;font-size:14px;color:#374151}
.next-section a{color:#1d4ed8}.next-section code{background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:13px}
.footer{padding:12px 24px;background:#f9fafb;font-size:12px;color:#9ca3af;text-align:center}
'@

    $html = @"
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Packing List - Status Report</title>
<style>$css</style>
</head>
<body>
<div class="card">
  <div class="banner $bannerClass">$bannerText</div>
  <div class="meta">
    <b>PC:</b> $PC_NAME &nbsp;&nbsp;
    <b>Checked:</b> $CHECK_TIME &nbsp;&nbsp;
    <b>Version:</b> $APP_VERSION
  </div>
  <div class="section">
    <h2>System Checks</h2>
$checkRows  </div>
  <div class="urls">
    <h2>System URLs</h2>
    <div class="url-row"><span class="url-label">App</span><a href="https://packinglist.bakudanramen.com">https://packinglist.bakudanramen.com</a></div>
    <div class="url-row"><span class="url-label">API Health</span><a href="http://localhost:3001/health">http://localhost:3001/health</a></div>
    <div class="url-row"><span class="url-label">Full Health</span><a href="http://localhost:3001/health/full">http://localhost:3001/health/full</a></div>
    <div class="url-row"><span class="url-label">Public API</span><a href="https://api.bakudanramen.com/health">https://api.bakudanramen.com/health</a></div>
  </div>
$failedHtml
  <div class="next-section $nextClass">
    <h2>$nextTitle</h2>
$nextBody
  </div>
  <div class="footer">Generated by check-status.ps1 on $PC_NAME at $CHECK_TIME | Re-run anytime: check-status.bat</div>
</div>
</body>
</html>
"@
    New-Item -ItemType Directory -Force -Path $STATUS_DIR | Out-Null
    $html | Set-Content -Path "$STATUS_DIR\install-report.html" -Encoding UTF8
}

function Show-CheckResult($checks) {
    $nameMap = @{
        'nodejs'      = 'Node.js'
        'db_service'  = 'Database Service'
        'database'    = 'Database exists'
        'env_file'    = 'Backend .env'
        'pm2_api'     = 'packing-api (PM2)'
        'pm2_monitor' = 'packing-monitor (PM2)'
        'pm2_bot'     = 'packing-bot (PM2)'
        'api_health'  = 'API /health'
        'db_health'   = 'DB /health/db'
        'port_3001'   = 'Port 3001'
        'cloudflare'  = 'Cloudflare Tunnel'
        'remote_api'  = 'Remote API Domain'
        'telegram'    = 'Telegram'
    }
    foreach ($key in $checks.Keys) {
        $ch   = $checks[$key]
        $name = if ($nameMap[$key]) { $nameMap[$key] } else { $key }
        if ($ch.skip -or $null -eq $ch.ok) {
            Write-Skip ("{0,-28} {1}" -f $name, $ch.msg)
        } elseif ($ch.ok) {
            Write-Ok   ("{0,-28} {1}" -f $name, $ch.msg)
        } else {
            Write-Fail ("{0,-28} {1}" -f $name, $ch.msg)
        }
    }
}

function Show-FinalScreen($checks, $allOk) {
    $failedNames = @($checks.Keys | Where-Object { $checks[$_].required -and $checks[$_].ok -eq $false })

    Write-Host ""
    Write-Host ""
    if ($allOk) {
        Write-Host ("=" * 56) -ForegroundColor Green
        Write-Host ""
        Write-Host "           ALL CHECKS PASSED" -ForegroundColor Green
        Write-Host "    System is running normally." -ForegroundColor Green
        Write-Host ""
        Write-Host ("=" * 56) -ForegroundColor Green
    } else {
        Write-Host ("=" * 56) -ForegroundColor Red
        Write-Host ""
        Write-Host "           CHECKS FAILED" -ForegroundColor Red
        Write-Host "    Fix the items below then re-run." -ForegroundColor Red
        Write-Host ""
        Write-Host ("=" * 56) -ForegroundColor Red
        Write-Host ""
        Write-Host "  FAILED:" -ForegroundColor Red
        foreach ($name in $failedNames) {
            Write-Host "    - $name : $($checks[$name].msg)" -ForegroundColor Red
        }
    }

    Write-Host ""
    Write-Host "  System URL :" -ForegroundColor White
    Write-Host "    https://packinglist.bakudanramen.com" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Backend Health :" -ForegroundColor White
    Write-Host "    http://localhost:3001/health" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Status Report :" -ForegroundColor White
    Write-Host "    $STATUS_DIR\install-report.html" -ForegroundColor Cyan
    Write-Host "    (opening in browser...)" -ForegroundColor Gray
    Write-Host ""
    if (-not $allOk) {
        Write-Host "  Useful commands:" -ForegroundColor White
        Write-Host "    pm2 list                  - see all process statuses" -ForegroundColor Gray
        Write-Host "    pm2 logs packing-api      - API log output" -ForegroundColor Gray
        Write-Host "    pm2 restart packing-api   - restart the API" -ForegroundColor Gray
    }
    Write-Host ""
}

# ==============================================================================
#  MAIN
# ==============================================================================

New-Item -ItemType Directory -Force -Path $LOG_DIR | Out-Null
Start-Transcript -Path "$LOG_DIR\check-status.log" -Force | Out-Null

Clear-Host
Write-Header "Packing List - Health Check"
Write-Host ""
Write-Host "  Checking system status on $PC_NAME..." -ForegroundColor White
Write-Host "  Repo : $REPO_DIR" -ForegroundColor Gray
Write-Host "  Time : $CHECK_TIME" -ForegroundColor Gray
Write-Host ""

Write-Info "Running all health checks..."
Write-Host ""

$checks = Invoke-AllChecks

Show-CheckResult $checks

$allOk = -not ($checks.Values | Where-Object { $_.required -eq $true -and $_.ok -eq $false })

Save-HtmlReport $checks $allOk

# Open report in browser
Start-Process "$STATUS_DIR\install-report.html"

Show-FinalScreen $checks $allOk

Stop-Transcript | Out-Null

if ($allOk) { exit 0 } else { exit 1 }
