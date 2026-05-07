# Central PC Setup Runbook

> **Architecture:** Central PC/Laptop runs backend API + MySQL + monitoring daemon + Telegram bot.
> Frontend is hosted on Cloudflare Pages. API is exposed securely via Cloudflare Tunnel (no public IP needed, no port forwarding).

---

## Overview

```
Internet → Cloudflare Tunnel → localhost:3001 (packing-api via PM2)
                                     │
                               MySQL (local)
                               monitoring daemon (PM2)
                               Telegram bot (PM2)
```

---

## Step 1 — Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL
sudo apt install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql

# PM2 (global)
sudo npm install -g pm2

# Git
sudo apt install -y git

# Verify
node --version    # v20.x.x
npm --version     # 10.x.x
mysql --version   # 8.x.x
pm2 --version     # 5.x.x
```

---

## Step 2 — Clone Repository

```bash
cd /opt
sudo git clone https://github.com/liemdo28/packing-list.git
sudo chown -R $USER:$USER /opt/packing-list
cd /opt/packing-list
```

---

## Step 3 — Database Setup

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p <<'SQL'
CREATE DATABASE IF NOT EXISTS packing_list_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'packing_app'@'localhost' IDENTIFIED BY 'STRONG_DB_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON packing_list_prod.* TO 'packing_app'@'localhost';
FLUSH PRIVILEGES;
SQL
```

---

## Step 4 — Backend API Setup

```bash
cd /opt/packing-list/v2-react/server

# Install dependencies
npm install --production

# Create env file
cp .env.production.example .env
nano .env
```

Fill in `.env`:

```env
NODE_ENV=production
PORT=3001
CLIENT_URL=https://packinglist.bakudanramen.com

DB_DIALECT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=packing_list_prod
DB_USER=packing_app
DB_PASS=STRONG_DB_PASSWORD_HERE

JWT_SECRET=<64-char random hex — run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_EXPIRES_IN=7d

GOOGLE_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0
PRICING_SYNC_INTERVAL_MS=3600000
```

```bash
# Create log directory
mkdir -p /opt/packing-list/v2-react/server/logs

# Test startup (Ctrl+C to stop)
node src/index.js

# Expected output:
#   [+] DB connected
#   [+] Server running on port 3001
#   curl http://localhost:3001/health → {"status":"ok","db":{"status":"ok"},...}
```

---

## Step 5 — Seed Database

```bash
cd /opt/packing-list/v2-react/server

SEED_ADMIN_PASS="STRONG_ADMIN_PASSWORD" \
SEED_STORE_PASS="STRONG_STORE_PASSWORD" \
SEED_ACCT_PASS="STRONG_ACCT_PASSWORD" \
npm run seed:prod

# Expected output:
#   [+] Store B1
#   [+] Store B2
#   [+] Store B3
#   [+] User admin (admin)
#   [+] User user_b1 (b1)
#   [+] User user_b2 (b2)
#   [+] User user_b3 (b3)
#   [+] User accountant (accountant)
#   Done. Created: 8, Skipped: 0
```

---

## Step 6 — Monitoring Daemon Setup

```bash
cd /opt/packing-list/monitoring

npm install

cp .env.example .env
nano .env
```

Fill in monitoring `.env`:

```env
API_BASE_URL=https://api.bakudanramen.com
MEMORY_WARN_MB=400
MEMORY_CRIT_MB=700

DB_DIALECT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=packing_list_prod
DB_USER=packing_app
DB_PASS=STRONG_DB_PASSWORD_HERE

TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_ADMIN_CHAT_ID=your-chat-id

SMOKE_ADMIN_USERNAME=admin
SMOKE_ADMIN_PASSWORD=STRONG_ADMIN_PASSWORD
SMOKE_B1_USERNAME=user_b1
SMOKE_B1_PASSWORD=STRONG_STORE_PASSWORD
SMOKE_B2_USERNAME=user_b2
SMOKE_B2_PASSWORD=STRONG_STORE_PASSWORD

DISK_CHECK_PATH=/
DISK_WARN_PERCENT=80
DISK_CRIT_PERCENT=90
```

```bash
mkdir -p /opt/packing-list/monitoring/logs
```

---

## Step 7 — Telegram Bot Setup (optional)

```bash
cd /opt/packing-list/telegram

npm install

cp .env.example .env 2>/dev/null || touch .env
nano .env
```

Fill in telegram `.env`:

```env
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
API_BASE_URL=https://api.bakudanramen.com/api
ANTHROPIC_API_KEY=your-anthropic-api-key
```

```bash
mkdir -p /opt/packing-list/telegram/logs
```

---

## Step 8 — Cloudflare Tunnel Setup

```bash
# Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb \
  -o /tmp/cloudflared.deb
sudo dpkg -i /tmp/cloudflared.deb

# Authenticate (opens browser)
cloudflared tunnel login

# Create tunnel (one-time)
cloudflared tunnel create packing-api
# Note the UUID printed

# Copy and edit config
mkdir -p ~/.cloudflared
cp /opt/packing-list/docs/cloudflared.yml ~/.cloudflared/config.yml
nano ~/.cloudflared/config.yml
# Replace <TUNNEL-UUID> with the UUID from the step above

# Create DNS CNAME in Cloudflare automatically
cloudflared tunnel route dns packing-api api.bakudanramen.com

# Test the tunnel
cloudflared tunnel run packing-api
# In another terminal: curl https://api.bakudanramen.com/health

# Install as systemd service (auto-start on reboot)
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

## Step 9 — Start All Services with PM2

```bash
cd /opt/packing-list

# Start all services
pm2 start ecosystem.config.js

# Save process list (survives reboots)
pm2 save

# Configure PM2 auto-start on boot
pm2 startup
# Follow the printed command (e.g.: sudo env PATH=... pm2 startup systemd -u ubuntu --hp /home/ubuntu)

# Verify all running
pm2 list
# Expected: packing-api, packing-monitor, packing-bot — all online
```

---

## Step 10 — Verify End-to-End

```bash
# 1. API health
curl https://api.bakudanramen.com/health
# → {"status":"ok","db":{"status":"ok"},...}

# 2. Full health (memory + uptime)
curl https://api.bakudanramen.com/health/full
# → {"status":"ok","memory":{"heapUsedMB":...},...}

# 3. Frontend (open in browser)
#    https://packinglist.bakudanramen.com
#    Should show login screen

# 4. Full smoke test
cd /opt/packing-list/monitoring
node smoke_flow_full.js
# → [smoke-full] OK — PL-XXXXXXXX-NNN completed in XXXXms

# 5. PM2 logs
pm2 logs packing-api --lines 20
pm2 logs packing-monitor --lines 20
```

---

## Daily Operations

| Task | Command |
|------|---------|
| View all services | `pm2 list` |
| Restart API | `pm2 restart packing-api` |
| Restart monitor | `pm2 restart packing-monitor` |
| View API logs | `pm2 logs packing-api` |
| View monitor logs | `pm2 logs packing-monitor` |
| Pull latest code | `cd /opt/packing-list && git pull origin master` |
| After code update | `pm2 restart packing-api` |
| Check tunnel status | `sudo systemctl status cloudflared` |
| Restart tunnel | `sudo systemctl restart cloudflared` |
| Manual backup | `cd /opt/packing-list/monitoring && node -e "require('./backup').runBackup()"` |
| Run smoke test | `cd /opt/packing-list/monitoring && node smoke_flow_full.js` |

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| `https://api.bakudanramen.com/health` times out | `sudo systemctl status cloudflared` — tunnel may be down |
| API returns 503 | `pm2 logs packing-api` — check DB connection |
| Login returns 500 | MySQL running? `sudo systemctl status mysql` |
| No Telegram alerts | Check `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ADMIN_CHAT_ID` in monitoring `.env`; send `/start` to the bot first |
| High memory alert | `pm2 restart packing-api` — PM2 will also auto-restart at 512 MB |
| Frontend shows old data | Clear Cloudflare cache or do a hard refresh |
| PM2 not starting on reboot | Re-run `pm2 startup` and follow the printed command |

---

## Backup Location

Backups are written to `monitoring/backups/` (configured in `monitoring/.env` as `BACKUP_DIR`).
Weekly verification runs every Sunday at 03:00.
Move backups to external storage or cloud periodically.

---

*Do not share any credential or URL until the Pre-Launch Checklist in STORE_TESTING.md is complete.*
