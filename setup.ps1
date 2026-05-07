#Requires -Version 5.1
<#
  Packing List System - Windows Installer
  Run via setup.bat (double-click) or:
    powershell -ExecutionPolicy Bypass -File setup.ps1
#>

$ErrorActionPreference = "Stop"

$REPO_DIR     = $PSScriptRoot
$STATUS_DIR   = "C:\PackingList"
$LOG_DIR      = "$STATUS_DIR\logs"
$PC_NAME      = $env:COMPUTERNAME
$INSTALL_TIME = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
$APP_VERSION  = "1.0.0"

# Script-scope variables set during Step 1
$script:DB_PASS    = ""
$script:ADMIN_PASS = ""
$script:STORE_PASS = ""
$script:ACCT_PASS  = ""
$script:TG_TOKEN   = ""
$script:TG_CHAT_ID = ""
$script:SHEET_URL  = ""
$script:JWT_SECRET = ""

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

function Prompt-Secret($label) {
    do {
        $secure = Read-Host "  $label" -AsSecureString
        $plain  = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
    } while (-not $plain)
    return $plain
}
function Prompt-Optional($label) { return (Read-Host "  $label (Enter to skip)") }
function Prompt-Value($label, $default = "") {
    if ($default) {
        $val = Read-Host "  $label [$default]"
        if (-not $val) { return $default }
        return $val
    }
    do { $val = Read-Host "  $label" } while (-not $val)
    return $val
}

function Run-MySQL($sql, $rootPass = "") {
    if ($rootPass) { $sql | & mysql -u root -p"$rootPass" 2>&1 }
    else           { $sql | & mysql -u root 2>&1 }
}

function Refresh-Path {
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("PATH","User")
}

function Write-EnvFile($path, $lines) {
    $lines | Set-Content -Path $path -Encoding UTF8
}

# -- Health checks -------------------------------------------------------------

function Get-PM2Procs {
    try {
        $raw = & pm2 jlist 2>$null
        if ($raw) { return ($raw | ConvertFrom-Json) }
    } catch {}
    return @()
}

function Invoke-AllChecks($DbPass, $TgToken, $TgChatId, $HasBot) {
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
    if ($DbPass) {
        try {
            $res = "SHOW DATABASES LIKE 'packing_list_prod';" | & mysql -u packing_app -p"$DbPass" 2>$null
            $c['database'] = @{ ok=($res -match 'packing_list_prod'); msg="packing_list_prod exists"; required=$true }
        } catch {
            $c['database'] = @{ ok=$false; msg="cannot connect as packing_app"; required=$true }
        }
    } else {
        $c['database'] = @{ ok=$null; skip=$true; msg="checked via API /health/db instead"; required=$false }
    }

    # 4. Backend .env
    $envPath = Join-Path $REPO_DIR "v2-react\server\.env"
    $c['env_file'] = @{ ok=(Test-Path $envPath); msg=if(Test-Path $envPath){".env present"}else{".env missing at $envPath"}; required=$true }

    # 5-7. PM2 processes
    $pm2 = Get-PM2Procs

    $apiProc   = $pm2 | Where-Object { $_.name -eq 'packing-api' }
    $apiOnline = $apiProc -and ($apiProc | Select-Object -ExpandProperty pm2_env).status -eq 'online'
    $c['pm2_api'] = @{ ok=[bool]$apiOnline; msg=if($apiOnline){"online"}else{"not running - check: pm2 logs packing-api"}; required=$true }

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
        $c['remote_api'] = @{ ok=$false; msg="not reachable (DNS/tunnel may still be propagating)"; required=$false }
    }

    # 13. Telegram configured
    if ($TgToken) {
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
    $bannerText  = if ($allOk) { "INSTALL SUCCESS" } else { "INSTALL FAILED" }
    $checkRows   = Build-CheckRows $checks

    $failedItems = $checks.Keys |
        Where-Object { $checks[$_].required -and $checks[$_].ok -eq $false } |
        ForEach-Object { $checks[$_].msg }

    $failedHtml = ""
    if (-not $allOk -and $failedItems) {
        $liItems = ($failedItems | ForEach-Object { "      <li>$_</li>" }) -join "`n"
        $failedHtml = "<div class='fail-box'><h2>What Failed</h2><ul>`n$liItems`n    </ul><p>Fix each item then run <b>check-status.bat</b>.</p></div>"
    }

    $nextClass = if ($allOk) { "next-ok" } else { "next-fail" }
    $nextTitle = if ($allOk) { "Admin Next Steps" } else { "Recovery Steps" }
    if ($allOk) {
        $nextBody = @"
    <ol>
      <li>Open app: <a href="https://packinglist.bakudanramen.com">https://packinglist.bakudanramen.com</a></li>
      <li>Login with admin account</li>
      <li>Go to Pricing Admin and sync prices from Google Sheets</li>
      <li>Run smoke test: open terminal, cd monitoring, node smoke_flow_full.js</li>
      <li>Confirm Telegram alert received</li>
      <li>Share store credentials only after all checks pass</li>
    </ol>
"@
    } else {
        $nextBody = @"
    <ol>
      <li>Fix the failed items listed above</li>
      <li>Double-click <b>check-status.bat</b> to re-run all checks</li>
      <li>For API issues: open terminal and run <code>pm2 logs packing-api</code></li>
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
<title>Packing List - Install Report</title>
<style>$css</style>
</head>
<body>
<div class="card">
  <div class="banner $bannerClass">$bannerText</div>
  <div class="meta">
    <b>PC:</b> $PC_NAME &nbsp;&nbsp;
    <b>Time:</b> $INSTALL_TIME &nbsp;&nbsp;
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
  <div class="footer">Generated by setup.ps1 on $PC_NAME at $INSTALL_TIME | Re-run anytime: check-status.bat</div>
</div>
</body>
</html>
"@
    $html | Set-Content -Path "$STATUS_DIR\install-report.html" -Encoding UTF8
}

function Save-StatusJson($checks, $allOk) {
    $checksObj = @{}
    foreach ($key in $checks.Keys) {
        $checksObj[$key] = @{ ok = $checks[$key].ok; msg = $checks[$key].msg }
    }
    [ordered]@{
        installTime = $INSTALL_TIME
        pcName      = $PC_NAME
        version     = $APP_VERSION
        success     = $allOk
        repoDir     = $REPO_DIR
        hasTelegram = [bool]$script:TG_TOKEN
        hasBot      = ($script:TG_TOKEN -and (Test-Path (Join-Path $REPO_DIR "telegram\index.js")))
        checks      = $checksObj
    } | ConvertTo-Json -Depth 5 | Set-Content "$STATUS_DIR\install-status.json" -Encoding UTF8
}

function Save-Config {
    [ordered]@{
        repoDir     = $REPO_DIR
        hasTelegram = [bool]$script:TG_TOKEN
        hasBot      = ($script:TG_TOKEN -and (Test-Path (Join-Path $REPO_DIR "telegram\index.js")))
        installTime = $INSTALL_TIME
    } | ConvertTo-Json | Set-Content "$STATUS_DIR\config.json" -Encoding UTF8
}

function Create-Shortcuts {
    try {
        $desktop  = [System.Environment]::GetFolderPath("Desktop")
        $reportUrl = "file:///$($STATUS_DIR.Replace('\','/'))/install-report.html"

        @("[InternetShortcut]", "URL=https://packinglist.bakudanramen.com") |
            Set-Content "$desktop\Packing List App.url" -Encoding ASCII

        @("[InternetShortcut]", "URL=http://localhost:3001/health") |
            Set-Content "$desktop\Packing List Health.url" -Encoding ASCII

        @("[InternetShortcut]", "URL=$reportUrl") |
            Set-Content "$desktop\Packing List Install Report.url" -Encoding ASCII

        Write-Ok "Desktop shortcuts created (3)"
    } catch {
        Write-Warn "Could not create shortcuts: $_"
    }
}

function Send-TelegramResult($allOk, $checks) {
    if (-not $script:TG_TOKEN -or -not $script:TG_CHAT_ID) { return }
    try {
        if ($allOk) {
            $msg = "[Packing List] Setup SUCCESS on $PC_NAME. All health checks passed. System is ready."
        } else {
            $failed = ($checks.Keys |
                Where-Object { $checks[$_].required -and $checks[$_].ok -eq $false } |
                ForEach-Object { $_ }) -join ", "
            $msg = "[Packing List] Setup on $PC_NAME has FAILURES: $failed. Check install-report.html."
        }
        $body = @{ chat_id = $script:TG_CHAT_ID; text = $msg } | ConvertTo-Json
        Invoke-RestMethod "https://api.telegram.org/bot$($script:TG_TOKEN)/sendMessage" `
            -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
        Write-Ok "Telegram alert sent to admin"
    } catch {
        Write-Warn "Telegram alert failed (token/chat-id may be wrong): $_"
    }
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
        Write-Host "           INSTALL SUCCESS" -ForegroundColor Green
        Write-Host "    System is installed and ready to use." -ForegroundColor Green
        Write-Host ""
        Write-Host ("=" * 56) -ForegroundColor Green
    } else {
        Write-Host ("=" * 56) -ForegroundColor Red
        Write-Host ""
        Write-Host "           INSTALL FAILED" -ForegroundColor Red
        Write-Host "    System is NOT ready. Fix the items below." -ForegroundColor Red
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
    Write-Host "  Install Report :" -ForegroundColor White
    Write-Host "    $STATUS_DIR\install-report.html" -ForegroundColor Cyan
    Write-Host "    (also opening in browser...)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Admin next steps:" -ForegroundColor White
    Write-Host "    1. Open app at https://packinglist.bakudanramen.com" -ForegroundColor Gray
    Write-Host "    2. Login with admin account" -ForegroundColor Gray
    Write-Host "    3. Run smoke test: cd monitoring && node smoke_flow_full.js" -ForegroundColor Gray
    Write-Host "    4. Confirm Telegram alert received" -ForegroundColor Gray
    Write-Host "    5. Share store credentials ONLY after all checks pass" -ForegroundColor Gray
    Write-Host ""
    if (-not $allOk) {
        Write-Host "  To re-check after fixing: double-click check-status.bat" -ForegroundColor Yellow
    }
    Write-Host ""
}

# ==============================================================================
#  MAIN INSTALL SEQUENCE
# ==============================================================================

# -- Logging -------------------------------------------------------------------

New-Item -ItemType Directory -Force -Path $LOG_DIR | Out-Null
Start-Transcript -Path "$LOG_DIR\setup.log" -Force | Out-Null

# -- Admin elevation -----------------------------------------------------------

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
           ).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")

if (-not $isAdmin) {
    Write-Host "  Requesting Administrator privileges..." -ForegroundColor Yellow
    Start-Process powershell "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    Stop-Transcript | Out-Null
    Exit
}

# -- Banner --------------------------------------------------------------------

Clear-Host
Write-Header "Packing List System - Windows Installer"
Write-Host ""
Write-Host "  This script will install and configure:" -ForegroundColor White
Write-Host "    - Node.js 20 LTS" -ForegroundColor Gray
Write-Host "    - MariaDB (MySQL-compatible database)" -ForegroundColor Gray
Write-Host "    - PM2 process manager (auto-start on reboot)" -ForegroundColor Gray
Write-Host "    - Cloudflare Tunnel (no port forwarding needed)" -ForegroundColor Gray
Write-Host "    - API + Monitoring + Telegram Bot" -ForegroundColor Gray
Write-Host ""
Write-Host "  Status report will be saved to: $STATUS_DIR" -ForegroundColor Yellow
Write-Host "  Log file: $LOG_DIR\setup.log" -ForegroundColor Gray
Write-Host ""
Read-Host "  Press Enter to begin"

# -- Step 1: Collect inputs ----------------------------------------------------

Write-Header "Step 1 of 11 - Configuration"
Write-Host ""
Write-Host "  Set passwords - write these down somewhere safe." -ForegroundColor Yellow
Write-Host ""

$script:DB_PASS    = Prompt-Secret "Database password (for packing_app user)"
$script:ADMIN_PASS = Prompt-Secret "App admin password (login as 'admin')"
$script:STORE_PASS = Prompt-Secret "Store password (user_b1, user_b2, user_b3)"
$script:ACCT_PASS  = Prompt-Secret "Accountant password (login as 'accountant')"

Write-Host ""
Write-Host "  Telegram alerts (optional):" -ForegroundColor White
$script:TG_TOKEN   = Prompt-Optional "Telegram Bot Token (from @BotFather)"
$script:TG_CHAT_ID = ""
if ($script:TG_TOKEN) {
    $script:TG_CHAT_ID = Prompt-Optional "Telegram Admin Chat ID"
}

Write-Host ""
Write-Host "  Google Sheets pricing (optional):" -ForegroundColor White
$script:SHEET_URL = Prompt-Optional "Google Sheet CSV export URL"

Write-Host ""
Write-Info "Generating JWT secret..."
$rng   = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
$bytes = New-Object byte[] 64
$rng.GetBytes($bytes)
$script:JWT_SECRET = -join ($bytes | ForEach-Object { $_.ToString("x2") })

Write-Ok "Configuration collected. Starting automated install..."

# -- Step 2: Chocolatey --------------------------------------------------------

Write-Header "Step 2 of 11 - Package Manager (Chocolatey)"

if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Info "Installing Chocolatey..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Refresh-Path
    Write-Ok "Chocolatey installed"
} else {
    Write-Ok "Chocolatey already installed"
}

# -- Step 3: Install packages --------------------------------------------------

Write-Header "Step 3 of 11 - Installing Dependencies"
Write-Info "This may take 5-10 minutes..."

foreach ($pkg in @("nodejs-lts", "git", "mariadb", "cloudflared")) {
    Write-Info "Installing $pkg..."
    choco install $pkg -y --no-progress 2>&1 | Out-Null
}

Refresh-Path
Write-Ok "Node.js, Git, MariaDB, cloudflared installed"

# -- Step 4: PM2 ---------------------------------------------------------------

Write-Header "Step 4 of 11 - PM2 Process Manager"
npm install -g pm2 pm2-windows-service --silent 2>&1 | Out-Null
Refresh-Path
Write-Ok "PM2 installed"

# -- Step 5: Database ----------------------------------------------------------

Write-Header "Step 5 of 11 - Database Setup"

$svcName = if (Get-Service "MariaDB" -ErrorAction SilentlyContinue) { "MariaDB" } else { "MySQL" }
Start-Service $svcName -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

$dbSql = @"
CREATE DATABASE IF NOT EXISTS packing_list_prod
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'packing_app'@'localhost' IDENTIFIED BY '$($script:DB_PASS)';
GRANT ALL PRIVILEGES ON packing_list_prod.* TO 'packing_app'@'localhost';
FLUSH PRIVILEGES;
"@

try {
    Run-MySQL $dbSql
    Write-Ok "Database packing_list_prod and user packing_app created"
} catch {
    Write-Warn "Retrying with root password prompt..."
    $ROOT_PASS = Prompt-Secret "MariaDB root password"
    Run-MySQL $dbSql $ROOT_PASS
    Write-Ok "Database setup complete"
}

# -- Step 6: .env files --------------------------------------------------------

Write-Header "Step 6 of 11 - Configuration Files"

New-Item -ItemType Directory -Force -Path $STATUS_DIR | Out-Null

Write-EnvFile (Join-Path $REPO_DIR "v2-react\server\.env") @(
    "NODE_ENV=production"
    "PORT=3001"
    "CLIENT_URL=https://packinglist.bakudanramen.com"
    ""
    "DB_DIALECT=mysql"
    "DB_HOST=127.0.0.1"
    "DB_PORT=3306"
    "DB_NAME=packing_list_prod"
    "DB_USER=packing_app"
    "DB_PASS=$($script:DB_PASS)"
    ""
    "JWT_SECRET=$($script:JWT_SECRET)"
    "JWT_EXPIRES_IN=7d"
    ""
    "GOOGLE_SHEET_CSV_URL=$($script:SHEET_URL)"
    "PRICING_SYNC_INTERVAL_MS=3600000"
)

Write-EnvFile (Join-Path $REPO_DIR "monitoring\.env") @(
    "API_BASE_URL=https://api.bakudanramen.com"
    "MEMORY_WARN_MB=400"
    "MEMORY_CRIT_MB=700"
    ""
    "DB_DIALECT=mysql"
    "DB_HOST=127.0.0.1"
    "DB_PORT=3306"
    "DB_NAME=packing_list_prod"
    "DB_USER=packing_app"
    "DB_PASS=$($script:DB_PASS)"
    ""
    "TELEGRAM_BOT_TOKEN=$($script:TG_TOKEN)"
    "TELEGRAM_ADMIN_CHAT_ID=$($script:TG_CHAT_ID)"
    ""
    "SMOKE_ADMIN_USERNAME=admin"
    "SMOKE_ADMIN_PASSWORD=$($script:ADMIN_PASS)"
    "SMOKE_B1_USERNAME=user_b1"
    "SMOKE_B1_PASSWORD=$($script:STORE_PASS)"
    "SMOKE_B2_USERNAME=user_b2"
    "SMOKE_B2_PASSWORD=$($script:STORE_PASS)"
    ""
    "DISK_CHECK_PATH=C:/"
    "DISK_WARN_PERCENT=80"
    "DISK_CRIT_PERCENT=90"
)

if ($script:TG_TOKEN) {
    Write-EnvFile (Join-Path $REPO_DIR "telegram\.env") @(
        "TELEGRAM_BOT_TOKEN=$($script:TG_TOKEN)"
        "API_BASE_URL=https://api.bakudanramen.com/api"
    )
}

Write-Ok ".env files created"

# -- Step 7: npm install -------------------------------------------------------

Write-Header "Step 7 of 11 - Installing npm Dependencies"

Push-Location "$REPO_DIR\v2-react\server"
Write-Info "API dependencies..."
npm install --production --silent 2>&1 | Out-Null
Pop-Location

Push-Location "$REPO_DIR\monitoring"
Write-Info "Monitoring dependencies..."
npm install --silent 2>&1 | Out-Null
Pop-Location

if ($script:TG_TOKEN -and (Test-Path "$REPO_DIR\telegram\package.json")) {
    Push-Location "$REPO_DIR\telegram"
    Write-Info "Telegram bot dependencies..."
    npm install --silent 2>&1 | Out-Null
    Pop-Location
}
Write-Ok "npm dependencies installed"

# -- Step 8: Cloudflare Tunnel -------------------------------------------------

Write-Header "Step 8 of 11 - Cloudflare Tunnel"

$cfDir   = Join-Path $env:USERPROFILE ".cloudflared"
$certPem = Join-Path $cfDir "cert.pem"

if (Test-Path $certPem) {
    Write-Ok "Cloudflare cert already exists - skipping login"
} else {
    Write-Host ""
    Write-Host "  A browser will open - log in with your Cloudflare account" -ForegroundColor Yellow
    Write-Host "  and select the bakudanramen.com zone." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "  Press Enter to open the browser"
    cloudflared tunnel login
}

Write-Info "Checking for existing tunnel 'packing-api'..."
$tunnelListOut = cloudflared tunnel list 2>&1 | Out-String
$existingMatch = [regex]::Match($tunnelListOut, "([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s+packing-api")

if ($existingMatch.Success) {
    $TUNNEL_UUID = $existingMatch.Groups[1].Value
    Write-Ok "Reusing existing tunnel UUID: $TUNNEL_UUID"
} else {
    Write-Info "Creating tunnel 'packing-api'..."
    $tunnelOutput = cloudflared tunnel create packing-api 2>&1 | Out-String
    $uuidMatch    = [regex]::Match($tunnelOutput, "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
    if ($uuidMatch.Success) {
        $TUNNEL_UUID = $uuidMatch.Value
        Write-Ok "Tunnel UUID: $TUNNEL_UUID"
    } else {
        Write-Warn "Could not auto-detect UUID. Output was:"
        Write-Host $tunnelOutput -ForegroundColor Gray
        $TUNNEL_UUID = Prompt-Value "Enter the tunnel UUID shown above"
    }
}

$cfCredFile = Join-Path $cfDir "$TUNNEL_UUID.json"
New-Item -ItemType Directory -Force -Path $cfDir | Out-Null

@(
    "tunnel: $TUNNEL_UUID"
    "credentials-file: $cfCredFile"
    ""
    "ingress:"
    "  - hostname: api.bakudanramen.com"
    "    path: /health"
    "    service: http://localhost:3001"
    "  - hostname: api.bakudanramen.com"
    "    path: /health/db"
    "    service: http://localhost:3001"
    "  - hostname: api.bakudanramen.com"
    "    path: /health/full"
    "    service: http://localhost:3001"
    "  - hostname: api.bakudanramen.com"
    "    path: /api"
    "    service: http://localhost:3001"
    "  - service: http_status:404"
) | Set-Content -Path (Join-Path $cfDir "config.yml") -Encoding UTF8

Write-Info "Registering DNS CNAME..."
$ErrorActionPreference = "SilentlyContinue"
cloudflared tunnel route dns packing-api api.bakudanramen.com *>$null
$ErrorActionPreference = "Stop"

$cfSvc = Get-Service "cloudflared" -ErrorAction SilentlyContinue
if ($cfSvc) {
    Write-Ok "cloudflared service already installed - restarting"
    Restart-Service cloudflared -ErrorAction SilentlyContinue
} else {
    cloudflared service install
}
Write-Ok "Cloudflare Tunnel configured"

# -- Step 9: Start PM2 ---------------------------------------------------------

Write-Header "Step 9 of 11 - Starting Services"

$apiDir = Join-Path $REPO_DIR "v2-react\server"
$monDir = Join-Path $REPO_DIR "monitoring"
$botDir = Join-Path $REPO_DIR "telegram"
$apiJs  = $apiDir.Replace('\', '\\')
$monJs  = $monDir.Replace('\', '\\')
$botJs  = $botDir.Replace('\', '\\')

$jsLines = [System.Collections.Generic.List[string]]::new()
$jsLines.Add("module.exports = {")
$jsLines.Add("  apps: [")
$jsLines.Add("    { name: 'packing-api', cwd: '$apiJs', script: 'src/index.js',")
$jsLines.Add("      instances: 1, autorestart: true, watch: false, max_memory_restart: '512M',")
$jsLines.Add("      env: { NODE_ENV: 'production', PORT: '3001' } },")
$jsLines.Add("    { name: 'packing-monitor', cwd: '$monJs', script: 'index.js',")
$jsLines.Add("      instances: 1, autorestart: true, watch: false, max_memory_restart: '256M',")
$jsLines.Add("      env: { NODE_ENV: 'production' } },")

if ($script:TG_TOKEN -and (Test-Path (Join-Path $botDir "index.js"))) {
    $jsLines.Add("    { name: 'packing-bot', cwd: '$botJs', script: 'index.js',")
    $jsLines.Add("      instances: 1, autorestart: true, watch: false, max_memory_restart: '256M',")
    $jsLines.Add("      env: { NODE_ENV: 'production' } },")
}
$jsLines.Add("  ],")
$jsLines.Add("}; ")
$jsLines | Set-Content -Path (Join-Path $REPO_DIR "ecosystem.windows.js") -Encoding UTF8

Push-Location $REPO_DIR
pm2 start ecosystem.windows.js
pm2 save
Pop-Location

Write-Info "Registering PM2 as Windows startup service..."
pm2-service-install -n PM2 --unattended 2>&1 | Out-Null
Write-Ok "PM2 services running and registered for auto-start"

# -- Step 10: Seed Database (after API is up and tables exist) -----------------

Write-Header "Step 10 of 11 - Seeding Database"
Write-Info "Waiting for API to start and create database tables..."

$apiReady = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 3
    try {
        $h = Invoke-RestMethod "http://localhost:3001/health" -TimeoutSec 5 -ErrorAction Stop
        if ($h.status -eq 'ok') { $apiReady = $true; break }
    } catch {}
    Write-Info "  waiting... ($([int](($i+1)*3))s)"
}

if ($apiReady) {
    Write-Ok "API is up - running seeder"
    $env:SEED_ADMIN_PASS = $script:ADMIN_PASS
    $env:SEED_STORE_PASS = $script:STORE_PASS
    $env:SEED_ACCT_PASS  = $script:ACCT_PASS
    Push-Location "$REPO_DIR\v2-react\server"
    $seedOut = node src/seeders/seed-prod.js 2>&1 | Out-String
    $seedExit = $LASTEXITCODE
    Pop-Location
    if ($seedExit -eq 0) {
        Write-Ok "Stores and users created"
    } else {
        Write-Warn "Seeder exited with code $seedExit - output:"
        Write-Host $seedOut -ForegroundColor Gray
        Write-Warn "You can re-run manually: cd $REPO_DIR\v2-react\server && node src/seeders/seed-prod.js"
    }
} else {
    Write-Warn "API did not respond after 45s - skipping seeder"
    Write-Warn "After fixing the API, run: cd $REPO_DIR\v2-react\server && node src/seeders/seed-prod.js"
}

# -- Step 11: Verification & Report -------------------------------------------

Write-Header "Step 11 of 11 - Verification and Install Report"
Write-Info "Running all health checks..."
Write-Host ""

Start-Sleep -Seconds 8

$hasBot = $script:TG_TOKEN -and (Test-Path (Join-Path $REPO_DIR "telegram\index.js"))
$checks = Invoke-AllChecks -DbPass $script:DB_PASS -TgToken $script:TG_TOKEN `
                           -TgChatId $script:TG_CHAT_ID -HasBot $hasBot

Show-CheckResult $checks

$allOk = -not ($checks.Values | Where-Object { $_.required -eq $true -and $_.ok -eq $false })

# Save files
Save-StatusJson $checks $allOk
Save-HtmlReport $checks $allOk
Save-Config
Create-Shortcuts
Send-TelegramResult $allOk $checks

# Open HTML report in default browser
Start-Process "$STATUS_DIR\install-report.html"

Show-FinalScreen $checks $allOk

Stop-Transcript | Out-Null

if ($allOk) { exit 0 } else { exit 1 }
