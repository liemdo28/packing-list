# Store Testing Runbook — bakudanramen.com

> **Purpose:** Step-by-step operator guide to deploy, seed, and verify the system before handing credentials to stores.
> **Rule:** Do NOT share any link or credential until every gate in the Pre-Launch Checklist is ticked.

---

## Production URL Structure

| Purpose | URL |
|---------|-----|
| **Frontend (app)** | `https://packinglist.bakudanramen.com` |
| **Backend API** | `https://api.bakudanramen.com/api` |
| **Health check** | `https://api.bakudanramen.com/health` |
| **Admin pricing** | `https://packinglist.bakudanramen.com/admin/pricing` |
| **Cloudflare Pages (origin)** | `https://packing-list-1.pages.dev` |

---

## DNS Records Required

At your DNS provider (external — not Cloudflare-managed):

### Frontend (already submitted to Cloudflare — pending propagation)

| Type | Name | Target | TTL |
|------|------|--------|-----|
| CNAME | `packinglist` | `packing-list-1.pages.dev` | 300 |

> This is the CNAME shown in your Cloudflare Pages dashboard.
> Status will change from **Inactive** to **Active** once propagated (up to 24 h).

### Backend API (add once your origin server has a public IP)

| Type | Name | Target | TTL |
|------|------|--------|-----|
| A | `api` | `<your-server-public-IP>` | 300 |

> After the A record propagates, run: `sudo certbot --nginx -d api.bakudanramen.com`
> The nginx config is at `docs/nginx.conf` in this repo.

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

### Step 1 — GitHub Variables (already configured ✅)

In the GitHub repo → **Settings → Secrets and variables → Actions → Variables**:

| Variable name              | Value |
|----------------------------|-------|
| `VITE_API_BASE_URL`        | `https://api.bakudanramen.com/api` |
| `VITE_APP_URL`             | `https://packinglist.bakudanramen.com` |
| `CLOUDFLARE_PAGES_PROJECT` | `packing-list-1` |

In **Secrets** (not variables):

| Secret name               | Value |
|---------------------------|-------|
| `CLOUDFLARE_API_TOKEN`    | From Cloudflare → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID`   | From Cloudflare → top-right account switcher |

Push to `master` → CI deploys to Cloudflare Pages project `packing-list-1` automatically.

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
CLIENT_URL=https://packinglist.bakudanramen.com

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

### Step 4 — Nginx + SSL for API (api.bakudanramen.com)

> Full config is at `docs/nginx.conf` in this repo.

```bash
# Install nginx and certbot
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx

# Deploy nginx config
sudo cp /opt/packing-list/docs/nginx.conf \
        /etc/nginx/sites-available/api.bakudanramen.com
sudo ln -s /etc/nginx/sites-available/api.bakudanramen.com \
           /etc/nginx/sites-enabled/api.bakudanramen.com
sudo nginx -t          # verify config syntax
sudo systemctl reload nginx

# Issue SSL cert (requires the A record for api.bakudanramen.com to already resolve)
sudo certbot --nginx -d api.bakudanramen.com
# Certbot auto-rewrites the nginx config with the cert paths and sets up auto-renewal

# Verify
curl https://api.bakudanramen.com/health
# Expected: {"status":"ok","db":{"status":"ok"},...}
```

---

### Step 5 — DNS Records

At your **external DNS provider** (since bakudanramen.com is not Cloudflare-managed):

| Type  | Name          | Target / Value                    | TTL |
|-------|---------------|-----------------------------------|-----|
| CNAME | `packinglist` | `packing-list-1.pages.dev`        | 300 |
| A     | `api`         | `<your-server-public-IP>`         | 300 |

The CNAME record for `packinglist` was already submitted to Cloudflare and is pending DNS propagation.
Add the `A` record for `api` pointing to your backend server IP.

After DNS propagates (test with `dig api.bakudanramen.com +short`):

```bash
curl https://api.bakudanramen.com/health
# Expected: {"status":"ok","db":{"status":"ok"},...}
```

---

### Step 6 — Pricing Sync (optional before testing)

If you want items and prices synced from the Google Sheet before testers start:

```bash
# Via the Admin Pricing Dashboard in the app:
# Login as admin → Pricing Admin (sidebar) → "Sync from Google Sheets"

# Or via API:
curl -X POST https://api.bakudanramen.com/api/admin/pricing/sync \
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

- [ ] `https://api.bakudanramen.com/health` → `{"status":"ok","db":{"status":"ok"}}`
- [ ] `https://packinglist.bakudanramen.com` loads the login screen
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
Application URL:  https://packinglist.bakudanramen.com

─────────────────────────────────────────────────────
ADMIN
  URL:      https://packinglist.bakudanramen.com
  Username: admin
  Password: [SEED_ADMIN_PASS you used in Step 3]
  Role:     Full system access

─────────────────────────────────────────────────────
BRANCH 1 (Main Store)
  URL:      https://packinglist.bakudanramen.com
  Username: user_b1
  Password: [SEED_STORE_PASS you used in Step 3]
  Role:     Create and ship orders from B1

─────────────────────────────────────────────────────
BRANCH 2 (South Store)
  URL:      https://packinglist.bakudanramen.com
  Username: user_b2
  Password: [SEED_STORE_PASS you used in Step 3]
  Role:     Receive and confirm orders at B2

─────────────────────────────────────────────────────
BRANCH 3 (North Store)
  URL:      https://packinglist.bakudanramen.com
  Username: user_b3
  Password: [SEED_STORE_PASS you used in Step 3]
  Role:     Create and ship orders from B3

─────────────────────────────────────────────────────
ACCOUNTANT / FINANCE
  URL:      https://packinglist.bakudanramen.com
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
