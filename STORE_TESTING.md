# Store Testing Runbook

> **Purpose:** Step-by-step operator guide to deploy, seed, and verify the system before handing credentials to stores.
> **Rule:** Do NOT share any link or credential until every gate in the Pre-Launch Checklist is ticked.

---

## Accounts for Store Testing

| Username    | Role        | Store | What they can do |
|-------------|-------------|-------|------------------|
| `admin`     | admin       | —     | Full access: users, stores, pricing, audit |
| `user_b1`   | b1          | B1    | Create & ship orders from B1 |
| `user_b2`   | b2          | B2    | Receive & confirm orders at B2 |
| `user_b3`   | b3          | B3    | Create & ship orders from B3 |
| `accountant`| accountant  | —     | Pricing admin, summary, invoices, audit logs |

> Passwords are set by the operator when running `npm run seed:prod` (see Step 3 below).
> Never use `password` as a production password.

---

## Operator Deployment Steps

### Step 1 — GitHub Variables (do once)

In the GitHub repo → **Settings → Secrets and variables → Actions → Variables**:

| Variable name        | Value |
|----------------------|-------|
| `VITE_API_BASE_URL`  | `https://api.yourdomain.com/api` |
| `VITE_APP_URL`       | `https://app.yourdomain.com` |

In **Secrets** (not variables):

| Secret name               | Value |
|---------------------------|-------|
| `CLOUDFLARE_API_TOKEN`    | From Cloudflare → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID`   | From Cloudflare → top-right account switcher |

Push to `master` → the `Deploy Frontend to Cloudflare Pages` workflow triggers automatically.

---

### Step 2 — Backend Server Setup

On the origin server (Ubuntu 22.04 recommended):

```bash
# 1. Clone repo
cd /opt
git clone https://github.com/liemdo28/packing-list.git
cd packing-list/v2-react/server

# 2. Install dependencies
npm install --production

# 3. Create .env from template
cp .env.production.example .env
nano .env   # fill in real DB credentials, JWT_SECRET, CLIENT_URL

# 4. Start with PM2
npm install -g pm2
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup    # follow the printed command to auto-start on reboot

# 5. Verify
curl http://localhost:3001/health
# Expected: {"status":"ok","db":{"status":"ok",...}}
```

Critical `.env` values to fill:

```env
NODE_ENV=production
PORT=3001
CLIENT_URL=https://app.yourdomain.com

DB_DIALECT=mysql          # or postgres for Supabase
DB_HOST=your-db-host
DB_PORT=3306
DB_NAME=packing_list_prod
DB_USER=packing_app
DB_PASS=STRONG_PASSWORD_HERE

JWT_SECRET=64_CHAR_RANDOM_HEX   # node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_EXPIRES_IN=7d
```

---

### Step 3 — Database & Seed

```bash
cd /opt/packing-list/v2-react/server

# Tables are auto-created by sequelize.sync() on first start.
# Verify tables exist:
#   mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME -e "SHOW TABLES;"

# Seed stores and users (idempotent — safe to re-run):
SEED_ADMIN_PASS="STRONG_ADMIN_PASSWORD" \
SEED_STORE_PASS="STRONG_STORE_PASSWORD" \
SEED_ACCT_PASS="STRONG_ACCT_PASSWORD" \
npm run seed:prod

# Output shows:
#   [+] Store B1
#   [+] Store B2
#   [+] Store B3
#   [+] User admin (admin)
#   [+] User user_b1 (b1)
#   ...
#   Done. Created: 8, Skipped: 0
```

> If you re-run the seeder after stores/users already exist, it prints `[=] … (exists)` and does NOT reset passwords. This is intentional.

---

### Step 4 — Cloudflare Tunnel (API routing)

```bash
# On origin server — install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
  -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# Authenticate (opens browser for your Cloudflare account)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create packing-list-prod
# Note the Tunnel ID printed

# Route your api subdomain through it
cloudflared tunnel route dns packing-list-prod api.yourdomain.com

# Write config
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml <<EOF
tunnel: YOUR_TUNNEL_ID
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
EOF

# Run as systemd service so it survives reboots
cloudflared service install
systemctl enable cloudflared
systemctl start cloudflared
systemctl status cloudflared   # should show "active (running)"
```

---

### Step 5 — DNS Records

In **Cloudflare Dashboard → your domain → DNS**:

| Type  | Name  | Content                              | Proxy status |
|-------|-------|--------------------------------------|-------------|
| CNAME | `app` | `packing-list.pages.dev` (or your Pages URL) | Proxied ✅ |
| CNAME | `api` | `YOUR_TUNNEL_ID.cfargotunnel.com`    | Proxied ✅  |

Wait 1–2 min, then:

```bash
curl https://api.yourdomain.com/health
# Expected: {"status":"ok","db":{"status":"ok"},...}
```

---

### Step 6 — Pricing Sync (optional before testing)

If you want items and prices synced from the Google Sheet before testers start:

```bash
# Via the Admin Pricing Dashboard in the app:
# Login as admin → Pricing Admin (sidebar) → "Sync from Google Sheets"

# Or via API:
curl -X POST https://api.yourdomain.com/api/admin/pricing/sync \
  -H "Authorization: Bearer YOUR_ADMIN_JWT"
```

---

### Step 7 — Monitoring Setup

```bash
cd /opt/packing-list/monitoring
npm install

cp .env.example .env
nano .env  # fill in API_BASE_URL, DB creds, TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID,
           # SMOKE_ADMIN_USERNAME, SMOKE_ADMIN_PASSWORD,
           # SMOKE_B1_USERNAME, SMOKE_B1_PASSWORD,
           # SMOKE_B2_USERNAME, SMOKE_B2_PASSWORD

# Start monitoring daemon
pm2 start index.js --name packing-monitor
pm2 save
```

Monitoring schedule:
- **Every 5 min** — health endpoint + DB watchdog
- **Every 15 min** — quick smoke flow (login, dashboard, orders list)
- **Every 2 hours** — full order workflow smoke (draft → completed, checks price snapshot)
- **Daily 02:00** — database backup

---

## Pre-Launch Checklist

Run this from top to bottom. Share credentials only after all boxes are ticked.

### Infrastructure

- [ ] `https://api.yourdomain.com/health` → `{"status":"ok","db":{"status":"ok"}}`
- [ ] `https://app.yourdomain.com` loads the login screen
- [ ] Cloudflare Tunnel running: `systemctl status cloudflared` → active
- [ ] PM2 processes running: `pm2 list` shows `packing-api` and `packing-monitor` online

### Login & Auth

- [ ] Login as `admin` works
- [ ] Login as `user_b1` works
- [ ] Login as `user_b2` works
- [ ] Login as `user_b3` works
- [ ] Login as `accountant` works
- [ ] Wrong password returns 401 (not 500)

### Dashboard

- [ ] Admin dashboard loads with order counts
- [ ] B1 dashboard shows only B1-scope orders
- [ ] B2 dashboard shows only B2-scope orders

### Full Order Workflow (manual run before sharing)

Execute this once manually to confirm end-to-end flow:

1. Login as `user_b1`
2. Create order: B1 → B2, add at least 2 items
3. Submit order
4. Mark as Processing
5. Mark as Ready to Ship
6. Mark as In Transit

7. Login as `user_b2`
8. Mark as Received Pending Confirmation
9. Mark as Completed

10. Login as `admin` → open the order
    - [ ] `total_amount` is non-zero
    - [ ] Each order line has `unit_price` set (price snapshot confirmed)

### Pricing

- [ ] Login as `admin` → Pricing Admin → shows sync status
- [ ] Manual sync runs without error
- [ ] Missing prices list is empty (or known items)

### Automated Smoke Test

```bash
cd /opt/packing-list/monitoring
node smoke_flow_full.js
# Expected: [smoke-full] OK — PL-XXXXXXXX-NNN completed in XXXXms
```

- [ ] Full smoke test exits 0

### Monitoring Alerts

- [ ] Telegram bot sends a test message (start monitoring daemon and check Telegram)
- [ ] Monitoring daemon runs: `pm2 logs packing-monitor` shows `[health] ok`

### Security

- [ ] CORS blocks requests from unauthorized origins
- [ ] `.env` is not in git: `git log --all --full-history -- "**/.env"`
- [ ] `JWT_SECRET` is ≥ 64 chars random hex
- [ ] Server firewall: only port 22 open, port 3001 only on localhost

---

## Store Credentials Sheet

> Fill in your actual domain and passwords before distributing.
> Send each row to the relevant person only — do not CC all stores.

```
Application URL:  https://app.YOURDOMAIN.com

─────────────────────────────────────────────────────
ADMIN
  URL:      https://app.YOURDOMAIN.com
  Username: admin
  Password: [SEED_ADMIN_PASS you used in Step 3]
  Role:     Full system access

─────────────────────────────────────────────────────
BRANCH 1 (Main Store)
  URL:      https://app.YOURDOMAIN.com
  Username: user_b1
  Password: [SEED_STORE_PASS you used in Step 3]
  Role:     Create and ship orders from B1

─────────────────────────────────────────────────────
BRANCH 2 (South Store)
  URL:      https://app.YOURDOMAIN.com
  Username: user_b2
  Password: [SEED_STORE_PASS you used in Step 3]
  Role:     Receive and confirm orders at B2

─────────────────────────────────────────────────────
BRANCH 3 (North Store)
  URL:      https://app.YOURDOMAIN.com
  Username: user_b3
  Password: [SEED_STORE_PASS you used in Step 3]
  Role:     Create and ship orders from B3

─────────────────────────────────────────────────────
ACCOUNTANT / FINANCE
  URL:      https://app.YOURDOMAIN.com
  Username: accountant
  Password: [SEED_ACCT_PASS you used in Step 3]
  Role:     Pricing admin, summary reports, invoices
```

---

## Workflow Reference for Testers

```
B1 Creates order ──► Submit ──► Processing ──► Ready to Ship ──► In Transit
                                                                       │
                                                                       ▼
                                                               B2 Receives
                                                                       │
                                                                       ▼
                                                      B2 Confirms ──► Completed
                                                                  (price snapshot
                                                                   written here)
```

Transfer rules:
- B1 → B2 ✅
- B1 → B3 ✅
- B3 → B1 ✅
- B3 → B2 ✅
- B2 → anywhere ❌ (B2 is receive-only)

---

## Troubleshooting Quick Reference

| Symptom | Check |
|---------|-------|
| Frontend loads but API calls fail with CORS | `CLIENT_URL` in server `.env` must match the frontend URL exactly (no trailing slash) |
| Login returns 500 | DB not connected — check `pm2 logs packing-api` and verify DB credentials |
| Tunnel shows 502 | Backend process down — `pm2 restart packing-api` |
| Price snapshot missing after Completed | Run pricing sync from Admin → Pricing Admin before testing |
| Smoke test fails at transition step | Check order state machine — run `pm2 logs packing-api` to see the error |
| Telegram alerts not arriving | Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ADMIN_CHAT_ID` in monitoring `.env`; send `/start` to the bot first |

---

*Do not share any credential or URL until the Pre-Launch Checklist is complete.*
