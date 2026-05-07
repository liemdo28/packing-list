#Requires -Version 5.1
<#
  Packing List System — Windows Installer
  Run via setup.bat (double-click) or: powershell -ExecutionPolicy Bypass -File setup.ps1
#>

$ErrorActionPreference = "Stop"
$REPO_DIR = $PSScriptRoot

# ── Helpers ───────────────────────────────────────────────────────

function Write-Header($msg) {
    Write-Host ""
    Write-Host ("=" * 50) -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host ("=" * 50) -ForegroundColor Cyan
}
function Write-Step($msg)  { Write-Host "`n  >> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)    { Write-Host "     [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg)  { Write-Host "     [!!] $msg" -ForegroundColor Yellow }
function Write-Info($msg)  { Write-Host "     $msg" -ForegroundColor Gray }

function Prompt-Value($label, $default = "") {
    if ($default) {
        $val = Read-Host "  $label [$default]"
        if (-not $val) { return $default }
        return $val
    }
    do { $val = Read-Host "  $label" } while (-not $val)
    return $val
}

function Prompt-Secret($label) {
    do {
        $secure = Read-Host "  $label" -AsSecureString
        $plain  = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
    } while (-not $plain)
    return $plain
}

function Prompt-Optional($label) {
    $val = Read-Host "  $label (Enter to skip)"
    return $val
}

function Run-MySQL($sql, $rootPass = "") {
    if ($rootPass) {
        $sql | & mysql -u root -p"$rootPass" 2>&1
    } else {
        $sql | & mysql -u root 2>&1
    }
}

function Refresh-Path {
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("PATH","User")
}

# ── Admin elevation ─────────────────────────────────────────────────

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
           ).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")

if (-not $isAdmin) {
    Write-Host "  Requesting Administrator privileges..." -ForegroundColor Yellow
    Start-Process powershell "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    Exit
}

# ── Banner ─────────────────────────────────────────────────────

Clear-Host
Write-Header "Packing List System - Windows Installer"
Write-Host ""
Write-Host "  This script will install and configure:" -ForegroundColor White
Write-Host "    - Node.js 20 LTS" -ForegroundColor Gray
Write-Host "    - MariaDB (MySQL-compatible database)" -ForegroundColor Gray
Write-Host "    - PM2 process manager (auto-start on reboot)" -ForegroundColor Gray
Write-Host "    - Cloudflare Tunnel (secure internet access, no port forwarding)" -ForegroundColor Gray
Write-Host "    - Packing List API + Monitoring + Telegram Bot" -ForegroundColor Gray
Write-Host ""
Write-Host "  You will be asked a few questions, then the install runs automatically." -ForegroundColor Yellow
Write-Host "  One step requires a browser login to Cloudflare." -ForegroundColor Yellow
Write-Host ""
Read-Host "  Press Enter to begin"

# ── Step 1: Collect all inputs upfront ───────────────────────────────────

Write-Header "Step 1 of 10 — Configuration"
Write-Host ""
Write-Host "  Set passwords for the database and app users." -ForegroundColor White
Write-Host "  These are created now — write them down somewhere safe." -ForegroundColor Yellow
Write-Host ""

$DB_PASS    = Prompt-Secret "Database password (for packing_app user)"
$ADMIN_PASS = Prompt-Secret "App admin password (login as 'admin')"
$STORE_PASS = Prompt-Secret "Store password (user_b1, user_b2, user_b3)"
$ACCT_PASS  = Prompt-Secret "Accountant password (login as 'accountant')"

Write-Host ""
Write-Host "  Telegram alerts (optional — press Enter to skip):" -ForegroundColor White
$TG_TOKEN   = Prompt-Optional "Telegram Bot Token (from @BotFather)"
$TG_CHAT_ID = ""
if ($TG_TOKEN) {
    $TG_CHAT_ID = Prompt-Optional "Telegram Admin Chat ID"
}

Write-Host ""
Write-Host "  Google Sheets pricing (optional — press Enter to skip):" -ForegroundColor White
$SHEET_URL = Prompt-Optional "Google Sheet CSV export URL"

Write-Host ""
Write-Host "  Generating JWT secret..." -ForegroundColor Gray

$rng   = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
$bytes = New-Object byte[] 64
$rng.GetBytes($bytes)
$JWT_SECRET = -join ($bytes | ForEach-Object { $_.ToString("x2") })

Write-Ok "Configuration collected. Starting automated install..."

# ── Step 2: Chocolatey ────────────────────────────────────────────

Write-Header "Step 2 of 10 — Package Manager (Chocolatey)"

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

# ── Step 3: Install packages ──────────────────────────────────────────

Write-Header "Step 3 of 10 — Installing Dependencies"
Write-Info "This may take 5-10 minutes..."

$packages = @("nodejs-lts", "git", "mariadb", "cloudflared")
foreach ($pkg in $packages) {
    Write-Info "Installing $pkg..."
    choco install $pkg -y --no-progress 2>&1 | Out-Null
}

Refresh-Path
Write-Ok "Node.js, Git, MariaDB, cloudflared installed"

# ── Step 4: PM2 ──────────────────────────────────────────────────

Write-Header "Step 4 of 10 — PM2 Process Manager"

npm install -g pm2 pm2-windows-service --silent 2>&1 | Out-Null
Refresh-Path
Write-Ok "PM2 installed"

# ── Step 5: Database setup ─────────────────────────────────────────

Write-Header "Step 5 of 10 — Database Setup"

$svcName = if (Get-Service "MariaDB" -ErrorAction SilentlyContinue) { "MariaDB" } else { "MySQL" }
Start-Service $svcName -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

$dbSetupSql = @"
CREATE DATABASE IF NOT EXISTS packing_list_prod
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'packing_app'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON packing_list_prod.* TO 'packing_app'@'localhost';
FLUSH PRIVILEGES;
"@

try {
    Run-MySQL $dbSetupSql
    Write-Ok "Database 'packing_list_prod' and user 'packing_app' created"
} catch {
    Write-Warn "Could not connect to MariaDB with empty root password."
    Write-Warn "If you set a root password during install, enter it now:"
    $ROOT_PASS = Prompt-Secret "MariaDB root password"
    Run-MySQL $dbSetupSql $ROOT_PASS
    Write-Ok "Database setup complete"
}

# ── Step 6: Create .env files ────────────────────────────────────────

Write-Header "Step 6 of 10 — Configuration Files"

@"
NODE_ENV=production
PORT=3001
CLIENT_URL=https://packinglist.bakudanramen.com

DB_DIALECT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=packing_list_prod
DB_USER=packing_app
DB_PASS=$DB_PASS

JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

GOOGLE_SHEET_CSV_URL=$SHEET_URL
PRICING_SYNC_INTERVAL_MS=3600000
"@ | Out-File "$REPO_DIR\v2-react\server\.env" -Encoding UTF8

@"
API_BASE_URL=https://api.bakudanramen.com
MEMORY_WARN_MB=400
MEMORY_CRIT_MB=700

DB_DIALECT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=packing_list_prod
DB_USER=packing_app
DB_PASS=$DB_PASS

TELEGRAM_BOT_TOKEN=$TG_TOKEN
TELEGRAM_ADMIN_CHAT_ID=$TG_CHAT_ID

SMOKE_ADMIN_USERNAME=admin
SMOKE_ADMIN_PASSWORD=$ADMIN_PASS
SMOKE_B1_USERNAME=user_b1
SMOKE_B1_PASSWORD=$STORE_PASS
SMOKE_B2_USERNAME=user_b2
SMOKE_B2_PASSWORD=$STORE_PASS

DISK_CHECK_PATH=C:\
DISK_WARN_PERCENT=80
DISK_CRIT_PERCENT=90
"@ | Out-File "$REPO_DIR\monitoring\.env" -Encoding UTF8

if ($TG_TOKEN) {
    @"
TELEGRAM_BOT_TOKEN=$TG_TOKEN
API_BASE_URL=https://api.bakudanramen.com/api
"@ | Out-File "$REPO_DIR\telegram\.env" -Encoding UTF8
}

Write-Ok ".env files created"

# ── Step 7: npm install ────────────────────────────────────────────

Write-Header "Step 7 of 10 — Installing npm Dependencies"

Push-Location "$REPO_DIR\v2-react\server"
Write-Info "Installing API dependencies..."
npm install --production --silent 2>&1 | Out-Null
Pop-Location

Push-Location "$REPO_DIR\monitoring"
Write-Info "Installing monitoring dependencies..."
npm install --silent 2>&1 | Out-Null
Pop-Location

if ($TG_TOKEN -and (Test-Path "$REPO_DIR\telegram\package.json")) {
    Push-Location "$REPO_DIR\telegram"
    Write-Info "Installing Telegram bot dependencies..."
    npm install --silent 2>&1 | Out-Null
    Pop-Location
}

Write-Ok "npm dependencies installed"

# ── Step 8: Seed database ──────────────────────────────────────────

Write-Header "Step 8 of 10 — Seeding Database"

$env:SEED_ADMIN_PASS = $ADMIN_PASS
$env:SEED_STORE_PASS = $STORE_PASS
$env:SEED_ACCT_PASS  = $ACCT_PASS

Push-Location "$REPO_DIR\v2-react\server"
node src/seeders/seed-prod.js
Pop-Location

Write-Ok "Stores and users created"

# ── Step 9: Cloudflare Tunnel ────────────────────────────────────────

Write-Header "Step 9 of 10 — Cloudflare Tunnel"
Write-Host ""
Write-Host "  This step exposes your API to the internet via Cloudflare Tunnel." -ForegroundColor White
Write-Host "  No port forwarding or public IP needed." -ForegroundColor Gray
Write-Host ""
Write-Host "  A browser will open — log in with your Cloudflare account" -ForegroundColor Yellow
Write-Host "  and select the 'bakudanramen.com' zone." -ForegroundColor Yellow
Write-Host ""
Read-Host "  Press Enter to open the browser"

cloudflared tunnel login

Write-Host ""
Write-Info "Creating tunnel 'packing-api'..."
$tunnelOutput = cloudflared tunnel create packing-api 2>&1 | Out-String
$uuidMatch    = [regex]::Match($tunnelOutput, "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")

if ($uuidMatch.Success) {
    $TUNNEL_UUID = $uuidMatch.Value
    Write-Ok "Tunnel created: $TUNNEL_UUID"
} else {
    Write-Warn "Could not auto-detect UUID from output:"
    Write-Host $tunnelOutput -ForegroundColor Gray
    $TUNNEL_UUID = Prompt-Value "Enter the tunnel UUID shown above"
}

$cfDir = "$env:USERPROFILE\.cloudflared"
New-Item -ItemType Directory -Force -Path $cfDir | Out-Null

@"
tunnel: $TUNNEL_UUID
credentials-file: $cfDir\$TUNNEL_UUID.json

ingress:
  - hostname: api.bakudanramen.com
    path: /health
    service: http://localhost:3001

  - hostname: api.bakudanramen.com
    path: /health/db
    service: http://localhost:3001

  - hostname: api.bakudanramen.com
    path: /health/full
    service: http://localhost:3001

  - hostname: api.bakudanramen.com
    path: /api
    service: http://localhost:3001

  - service: http_status:404
"@ | Out-File "$cfDir\config.yml" -Encoding UTF8

Write-Info "Registering api.bakudanramen.com DNS route..."
cloudflared tunnel route dns packing-api api.bakudanramen.com

Write-Info "Installing cloudflared as Windows service..."
cloudflared service install
Write-Ok "Cloudflare Tunnel configured and installed as service"

# ── Step 10: Start PM2 services ───────────────────────────────────────

Write-Header "Step 10 of 10 — Starting Services"

$apiDir = "$REPO_DIR\v2-react\server"
$monDir = "$REPO_DIR\monitoring"
$botDir = "$REPO_DIR\telegram"

$ecosystemContent = @"
module.exports = {
  apps: [
    {
      name: 'packing-api',
      cwd:  '$($apiDir -replace "\\","\\\\")',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production', PORT: '3001' },
    },
    {
      name: 'packing-monitor',
      cwd:  '$($monDir -replace "\\","\\\\")',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: { NODE_ENV: 'production' },
    },
"@

if ($TG_TOKEN -and (Test-Path "$botDir\index.js")) {
    $ecosystemContent += @"
    {
      name: 'packing-bot',
      cwd:  '$($botDir -replace "\\","\\\\")',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: { NODE_ENV: 'production' },
    },
"@
}

$ecosystemContent += @"
  ],
};
"@

$ecosystemContent | Out-File "$REPO_DIR\ecosystem.windows.js" -Encoding UTF8

Push-Location $REPO_DIR
pm2 start ecosystem.windows.js
pm2 save
Pop-Location

Write-Info "Registering PM2 as Windows startup service..."
pm2-service-install -n PM2 --unattended 2>&1 | Out-Null
Write-Ok "PM2 configured to start on Windows boot"

# ── Verify ──────────────────────────────────────────────────────

Write-Host ""
Write-Info "Waiting for API to start..."
Start-Sleep -Seconds 6

$apiOk = $false
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 10
    if ($health.status -eq "ok") {
        $apiOk = $true
        Write-Ok "API health check: OK (DB: $($health.db.status))"
    } else {
        Write-Warn "API responded but status: $($health.status)"
    }
} catch {
    Write-Warn "API not responding yet — check logs: pm2 logs packing-api"
}

# ── Done ─────────────────────────────────────────────────────────

Write-Host ""
Write-Header "Installation Complete"
Write-Host ""
if ($apiOk) {
    Write-Host "  Everything is running!" -ForegroundColor Green
} else {
    Write-Host "  Install finished. Check pm2 logs if API isn't responding yet." -ForegroundColor Yellow
}
Write-Host ""
Write-Host "  Local API:  http://localhost:3001/health" -ForegroundColor White
Write-Host "  Public API: https://api.bakudanramen.com/health" -ForegroundColor White
Write-Host "  Frontend:   https://packinglist.bakudanramen.com" -ForegroundColor White
Write-Host ""
Write-Host "  Users created:" -ForegroundColor White
Write-Host "    admin / $ADMIN_PASS" -ForegroundColor Gray
Write-Host "    user_b1, user_b2, user_b3 / $STORE_PASS" -ForegroundColor Gray
Write-Host "    accountant / $ACCT_PASS" -ForegroundColor Gray
Write-Host ""
Write-Host "  Useful commands (open a new terminal):" -ForegroundColor White
Write-Host "    pm2 list                     - show all services" -ForegroundColor Gray
Write-Host "    pm2 logs packing-api         - API logs" -ForegroundColor Gray
Write-Host "    pm2 restart packing-api      - restart API" -ForegroundColor Gray
Write-Host ""
Write-Host "  Smoke test:" -ForegroundColor White
Write-Host "    cd $REPO_DIR\monitoring" -ForegroundColor Gray
Write-Host "    node smoke_flow_full.js" -ForegroundColor Gray
Write-Host ""
Read-Host "  Press Enter to close"
