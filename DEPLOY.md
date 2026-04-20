# Restaurant Operation System — Deployment Guide

> **Target Architecture**
> - Frontend → Cloudflare Pages (global edge delivery)
> - Backend → 1 centralized origin server
> - Database → 1 managed MySQL/PostgreSQL, same region as backend
> - API routing → `api.` subdomain via Cloudflare Tunnel (no public IP exposure)
> - All users share the same database, same backend

---

## Prerequisites

You need:

- [Cloudflare account](https://dash.cloudflare.com/)
- Domain registered (or transferred) on Cloudflare
- A server/VPS for the backend (or managed cloud DB + compute)
- GitHub repo connected to Cloudflare Pages

---

## Phase 1 — Frontend: Cloudflare Pages

### 1.1 Connect GitHub repo to Cloudflare Pages

1. Go to **Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git**
2. Select your repo (`packing-list`)
3. Configure build:

| Field | Value |
|---|---|
| **Project name** | `packing-list` |
| **Production branch** | `master` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

Build config for v2-react/client (`wrangler.jsonc` is optional for advanced):

```toml
# v2-react/client/wrangler.toml  (optional — for Workers proxy if needed)
name = "packing-list-assets"
compatibility_date = "2024-01-01"
pages_build_output_dir = "./dist"
```

4. Add environment variable:
   ```
   NODE_VERSION = 20
   ```
5. Deploy

### 1.2 Custom domain

In Cloudflare Pages → your project → **Custom domains**:
- Add `app.yourdomain.com` → point to Cloudflare Pages
- Cloudflare auto-provisions SSL

---

## Phase 2 — Backend: Origin Server Setup

### 2.1 Server requirements

- **OS**: Ubuntu 22.04 LTS (recommended)
- **RAM**: 2 GB minimum
- **Docker** installed (recommended for easy deploy)
- Or bare Node.js 20 + MySQL if not using Docker

### 2.2 Clone & prepare backend

```bash
# On your origin server
cd /opt
git clone https://github.com/your-org/packing-list.git
cd packing-list/v2-react/server

# Install dependencies
npm install --production

# Copy production env
cp .env.example .env
# Edit .env with real credentials (see .env.production.example)
```

### 2.3 Database setup

On your managed MySQL (e.g., MySQL on a cloud VM, Cloudflare D1 is NOT recommended for this app):

```sql
CREATE DATABASE packing_list_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'packing_app'@'%' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON packing_list_prod.* TO 'packing_app'@'%';
FLUSH PRIVILEGES;
```

Run migrations:
```bash
npm run migrate
# or: npx sequelize-cli db:migrate
npm run seed      # seed test accounts
```

### 2.4 Environment variables for production

See `.env.production.example` in this repo for all required variables.

Critical ones:
```env
NODE_ENV=production
PORT=3001
APP_URL=https://app.yourdomain.com
API_BASE_URL=https://api.yourdomain.com

DB_HOST=your-db-host
DB_PORT=3306
DB_NAME=packing_list_prod
DB_USER=packing_app
DB_PASSWORD=...       # strong password, not in git
DB_SSL=true           # if using managed DB with SSL

JWT_SECRET=...        # 64+ char random string
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://app.yourdomain.com
```

### 2.5 Start backend

**Option A — Docker (recommended)**

```bash
# v2-react/server/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3001
CMD ["node", "src/index.js"]
```

```bash
cd /opt/packing-list/v2-react/server
docker build -t packing-list-api .
docker run -d --name packing-api \
  -p 127.0.0.1:3001:3001 \
  --env-file .env \
  --restart unless-stopped \
  packing-list-api
```

**Option B — PM2 (no Docker)**

```bash
npm install -g pm2
pm2 start src/index.js --name packing-api --env production
pm2 save
pm2 startup   # follow instructions to auto-start on boot
```

Test locally:
```bash
curl http://localhost:3001/api/health
# Expected: {"ok":true,"timestamp":"..."}
```

---

## Phase 3 — Cloudflare Tunnel (API Exposure)

### 3.1 Why Tunnel?

**Do NOT expose your backend server public IP directly.**
Cloudflare Tunnel creates an outbound connection from your server to Cloudflare, so:

- No open inbound ports on your server firewall
- All traffic routes through Cloudflare's DDoS protection + WAF
- `api.yourdomain.com` resolves to Cloudflare edge, not your server IP

### 3.2 Install cloudflared

```bash
# On your origin server
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
cloudflared --version
```

### 3.3 Create tunnel

```bash
cloudflared tunnel create packing-list-prod
# Output: Tunnel ID printed, credentials saved to ~/.cloudflared/

# Create DNS record (do this in Cloudflare Dashboard OR via CLI):
cloudflared tunnel route dns packing-list-prod api.yourdomain.com

# Or route to the full domain:
cloudflared tunnel route dns packing-list-prod api.yourdomain.com
```

### 3.4 Configure tunnel

```bash
# On your origin server
mkdir -p ~/.cloudflared/
nano ~/.cloudflared/config.yml
```

```yaml
# ~/.cloudflared/config.yml
tunnel: <TUNNEL_ID>          # from step above
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:3001
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

Test & start:
```bash
cloudflared tunnel run packing-list-prod
# Should say: Connection established
```

### 3.5 Auto-start tunnel on boot (systemd)

```bash
sudo nano /etc/systemd/system/cloudflared.service
```

```ini
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/cloudflared tunnel run --config /root/.cloudflared/config.yml packing-list-prod
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

---

## Phase 4 — DNS Configuration

In **Cloudflare Dashboard → your domain → DNS**:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `app` | `<cloudflare-pages-ip>` | CDN ✅ |
| CNAME | `api` | `<tunnel-id>.trycloudflare.com` | DNS only ⚠️ |
| A | `@` | `<your-origin-server-ip>` | DNS only |

> **Important:** `api` record should be DNS-only (grey cloud), NOT proxied, because the Tunnel handles routing.
> Wait 5 min after DNS change before testing.

Test:
```bash
curl https://api.yourdomain.com/api/health
# Expected: {"ok":true,...}
```

---

## Phase 5 — Frontend: Connect to Production API

### 5.1 Update client environment

In `v2-react/client/.env` (or set in Cloudflare Pages dashboard):

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_APP_URL=https://app.yourdomain.com
```

Rebuild:
```bash
npm run build
# Cloudflare Pages auto-rebuilds on git push to master
```

Or trigger deploy manually in Cloudflare Pages dashboard.

### 5.2 API base URL in code

The client API calls are configured via `v2-react/client/src/api/client.js`:

```javascript
// VITE_API_BASE_URL is set as baseURL in axios instance
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  ...
});
```

**No changes to code needed** — just set the env variable.

---

## Phase 6 — Production Security Checklist

### 6.1 Must-have

- [ ] HTTPS enforced (Cloudflare provides free SSL, set "Always use HTTPS" in dashboard)
- [ ] Backend NOT directly accessible via public IP (Cloudflare Tunnel only)
- [ ] DB user has least privilege (app user cannot DROP DATABASE)
- [ ] `JWT_SECRET` is random, 64+ chars, stored in env only
- [ ] CORS set to `https://app.yourdomain.com` only
- [ ] `.env` NOT in git
- [ ] No `DEBUG=true` in production
- [ ] Cloudflare WAF enabled on `api.yourdomain.com`

### 6.2 DNS / Cloudflare settings

- [ ] "Always use HTTPS" enabled
- [ ] Minimum TLS version: 1.2
- [ ] Bot Fight Mode enabled (optional, adjust as needed)
- [ ] Rate limiting on API routes if needed

### 6.3 Server hardening (origin)

```bash
# Disable password auth, use SSH keys only
# Firewall: only allow port 22 (SSH) and block all else
sudo ufw default deny incoming
sudo ufw allow 22/tcp
sudo ufw allow from 127.0.0.1 to any port 3001  # only Cloudflare IPs can reach your app
# Note: Cloudflare Tunnel traffic comes from Cloudflare IPs
# Use Cloudflare Access for additional protection if needed
```

---

## Phase 7 — Go-Live Checklist

### Pre-launch

- [ ] `https://app.yourdomain.com` loads frontend ✅
- [ ] `https://api.yourdomain.com/api/health` returns `{"ok":true}` ✅
- [ ] Login with `admin@restaurant.com` / `password` works ✅
- [ ] Create order, check database — order persisted ✅
- [ ] CORS only allows `app.yourdomain.com`
- [ ] `.env` file does NOT exist in git
- [ ] DB backup runs daily
- [ ] Cloudflare Tunnel service running (`systemctl status cloudflared`)

### Post-launch monitoring

- [ ] Cloudflare Analytics shows traffic on both domains
- [ ] No 5xx errors in Cloudflare Dashboard
- [ ] Backend logs show no errors
- [ ] DB disk usage < 80%

---

## Phase 8 — Updating the App

### Frontend (auto on git push to master)

```bash
git push origin master
# → Cloudflare Pages auto-rebuilds and deploys
```

### Backend (on origin server)

```bash
cd /opt/packing-list/v2-react/server

# Pull latest
git pull

# Install new deps
npm install --production

# Run migrations (if any)
npm run migrate

# Restart service
# Docker:
docker restart packing-api
# PM2:
pm2 restart packing-api
```

---

## Alternative: 100% Free Tier (Supabase + Render + Cloudflare Tunnel)

> Use this path if you don't want to pay for a VPS or managed DB.
> Everything below is free, no credit card required.

### Architecture

```
Users (any location)
     │
     ▼
app.yourdomain.com          ← Cloudflare Pages (free)
     │
     │ AJAX
     ▼
api.yourdomain.com          ← Cloudflare Tunnel (free)
     │
     ▼
Render.com (Node.js server) ← Backend (free tier)
     │
     ▼
Supabase (PostgreSQL)       ← Database (500MB free)
```

---

### Step A — Supabase: Create PostgreSQL Database

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Name: `packing-list-prod`
3. Save the **Database password** (shown once only)
4. Go to **Project Settings → Connection String → URI**
5. Copy the **Connection URI** — looks like:
   ```
   postgres://postgres:PASSWORD@db.XXXXXXX.supabase.co:5432/postgres
   ```

You don't need to create tables — the app's `sequelize.sync()` creates them automatically on first start.

---

### Step B — Render.com: Deploy Backend

#### B1. Push your code to GitHub (if not already)

```bash
cd packing-list
git push origin master
```

#### B2. Create a Web Service on Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo (`packing-list`)
3. Configure:

| Field | Value |
|---|---|
| **Name** | `packing-list-api` |
| **Region** | Singapore (closest to Vietnam) |
| **Branch** | `master` |
| **Root Directory** | `v2-react/server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

#### B3. Add Environment Variables

In Render dashboard → your Web Service → **Environment**:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `DB_DIALECT` | `postgres` |
| `DB_HOST` | `db.YOUR_PROJECT_ID.supabase.co` |
| `DB_PORT` | `5432` |
| `DB_NAME` | `postgres` |
| `DB_USER` | `postgres` |
| `DB_PASS` | `<your Supabase DB password>` |
| `CLIENT_URL` | `https://app.yourdomain.com` |
| `JWT_SECRET` | `<64-char random string>` |
| `JWT_EXPIRES_IN` | `7d` |

> To get `DB_HOST`: Supabase → Project Settings → Connection String → Host

#### B4. Wait for first deploy

Render will:
1. `npm install` dependencies
2. Start the server
3. Run `sequelize.sync()` — creates all tables automatically

Check logs: **Render Dashboard → your service → Logs**

---

### Step C — Cloudflare Tunnel (free API routing)

Render's free tier gives a random URL like `packing-list-api.onrender.com`.
**Do not expose this directly** — use Cloudflare Tunnel instead.

#### C1. Install cloudflared on a local machine

You need one always-on machine to run the tunnel. Options:
- An old laptop at home (must be on 24/7)
- A second Render Free instance with cloudflared
- A $5/month Raspberry Pi at home

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
cloudflared --version
```

#### C2. Create tunnel

```bash
cloudflared tunnel create packing-list-prod
# Output: Tunnel ID = xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

#### C3. Point tunnel to your Render URL

```bash
cloudflared tunnel route dns packing-list-prod api.yourdomain.com
```

#### C4. Write tunnel config

On the machine running cloudflared:

```bash
nano ~/.cloudflared/config.yml
```

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: api.yourdomain.com
    service: https://packing-list-api.onrender.com
    originRequest:
      noTLSVerify: true
  - service: http_status:404

logLevel: info
protocol: auto
```

#### C5. Run tunnel

```bash
cloudflared tunnel run packing-list-prod
```

To keep it running in background (systemd):

```bash
sudo nano /etc/systemd/system/cloudflared.service
```

```ini
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
ExecStart=/usr/local/bin/cloudflared tunnel run --config /root/.cloudflared/config.yml packing-list-prod
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

#### C6. DNS on Cloudflare Dashboard

| Type | Name | Content | Proxy |
|---|---|---|---|
| CNAME | `api` | `xxx.tunnel.trycloudflare.com` | DNS only (grey) |

Wait 5 min, then test:
```bash
curl https://api.yourdomain.com/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

### Step D — Update Frontend API URL

1. Go to **Cloudflare Pages → packing-list project → Settings → Environment Variables**
2. Add:
   ```
   VITE_API_BASE_URL = https://api.yourdomain.com/api
   ```
3. Redeploy (Settings → Deployments → Retry latest)

Or update `v2-react/client/.env.production` locally:
```
VITE_API_BASE_URL=https://api.yourdomain.com/api
```
Then `git push` → auto-rebuild.

---

### Step E — Run First Migration / Seed

The app runs `sequelize.sync()` on first start — this creates all tables.

To seed test data, the easiest way is to call the seed endpoint manually, or use the Render shell:

1. **Render Dashboard → your service → Shell**
2. Run:
   ```bash
   node src/seeders/seed.js
   ```

Or add a one-time seed script in the Build Command.

**Recommended:** Create a free endpoint to trigger seeding:

```bash
# Create a temporary script: v2-react/server/src/seed-trigger.js
# Add route to seed, call it once via curl, then delete the route
curl -X POST https://api.yourdomain.com/api/admin/seed -H "Authorization: Bearer <admin_token>"
```

Or run directly:
```bash
curl -X POST http://localhost:3001/api/admin/seed \
  -H "Authorization: Bearer <your_jwt_token>"
```

---

### Free Tier Limits — What to Watch

| Service | Limit | Mitigation |
|---|---|---|
| **Render** | Cold start 30s after 15min idle | Keep alive ping via cron job |
| **Supabase** | 500MB DB | Monitor usage; delete old invoices/audit logs |
| **Cloudflare Tunnel** | Needs always-on machine | Raspberry Pi or 2nd free Render instance |

**Keep-alive ping (prevents Render sleep):**
Create a free cron job (e.g., UptimeRobot) to ping:
```
https://api.yourdomain.com/health
```
every 10 minutes. This keeps the container warm.

---

### Troubleshooting

**Render: "Build failed"**
→ Check logs. Usually missing env vars or wrong root directory.

**Supabase: "Connection refused"**
→ Check `DB_HOST` and password in Render env vars.
→ Supabase needs IP whitelist: go to **Supabase → Project Settings → Database → Network → Allow all** (or add Render's IP range).

**Tunnel: "502 Bad Gateway"**
→ Render free tier may sleep. Ping `https://packing-list-api.onrender.com/health` to wake it.
→ Or the tunnel is pointing to wrong URL — double-check the Render service URL.

**CORS error after deploy**
→ Make sure `CLIENT_URL` in Render env matches exactly: `https://app.yourdomain.com` (no trailing slash).

---

*Document version: 1.1 — added 100% free tier path (Supabase + Render + Cloudflare Tunnel)*

```
User at Kitchen A
    │
    ▼
https://app.yourdomain.com        ← Cloudflare Pages (global edge)
    │
    │ AJAX call
    ▼
https://api.yourdomain.com        ← Cloudflare Tunnel
    │
    ▼
Cloudflare Edge ──────────── Tunnel (outbound only, port 443)
    │                              │
    │                         Your Origin Server (VM/VPS)
    │                              │
    │                         Node.js API (:3001)
    │                              │
    │                         MySQL Managed DB
    │                         (same region as server)
    │
User at Kitchen B ───────────────┘
```

---

## Troubleshooting

### API returns 403
Check CORS origin in backend env — must be `https://app.yourdomain.com` (no trailing slash).

### Login returns 401
Verify `JWT_SECRET` in backend .env matches what client expects. Check network tab for token being sent.

### Tunnel disconnects
```bash
sudo systemctl restart cloudflared
sudo journalctl -u cloudflared -f
```

### DB connection fails
Test from origin server:
```bash
mysql -h $DB_HOST -u packing_app -p
SHOW DATABASES;
```
Check that `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` are correct in `.env`.

---

## File Structure Reference

```
packing-list/
├── DEPLOY.md                          ← This file
├── .env.production.server.example      ← Backend env template
├── .env.production.client.example      ← Frontend env template
├── .github/
│   └── workflows/
│       └── cloudflare-pages.yml        ← Auto-deploy frontend
├── v2-react/
│   ├── client/
│   │   ├── wrangler.toml               ← (optional, Cloudflare Workers config)
│   │   └── .env.production             ← NOT in git (ask for from DevOps)
│   └── server/
│       └── .env.production            ← NOT in git (ask for from DevOps)
└── stress/                             ← Load test scripts (dev only)
```

---

*Document version: 1.0 — for Restaurant Operation System deployment.*