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

## Architecture Summary

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