# Production Deployment Checklist
## Packing List Server v2.0

**Date:** 2026-05-08  
**Status:** Ready for Production Deployment

---

## Pre-Deployment Checklist

### 1. Infrastructure Requirements

- [ ] Windows Server/PC with static IP
- [ ] Node.js 20+ installed
- [ ] MySQL 8.0+ database accessible
- [ ] Cloudflare account (if using tunnel)
- [ ] Telegram Bot Token created

### 2. Pre-Deployment Steps

1. Clone repository to production machine
2. Run `setup-production.bat`
3. Configure all `C:\PackingList\config\*.env` files
4. Verify database connectivity
5. Test launcher scripts

---

## Runtime Verification Script

Run this on the production machine:

### Step 1: Run Setup
```batch
setup-production.bat
```

**Expected Output:**
```
========================================================
   PACKING LIST SERVER - PRODUCTION SETUP
========================================================

[1/7] Checking prerequisites...
        Node.js: v20.x.x [OK]
        npm: x.x.x [OK]
        PM2 installed [OK]

[2/7] Creating directories...
        Created: C:\PackingList
        ...

[7/7] Generating install report...
        Created: C:\PackingList\install-report.html
```

### Step 2: Configure Environment
Edit `C:\PackingList\config\backend.env`:
```
NODE_ENV=production
PORT=3001
DB_HOST=your-db-host
DB_PORT=3306
DB_NAME=packing_list
DB_USER=root
DB_PASS=your-secure-password
JWT_SECRET=generate-a-secure-random-string
CORS_ORIGIN=https://your-domain.com
CLIENT_URL=https://your-domain.com
```

### Step 3: Start Server
```batch
Start-PackingList.bat
```

**Expected Output:**
```
========================================================
   PACKING LIST SERVER - STARTING
========================================================

[1/5] Stopping existing services...
        Stopped existing services

[2/5] Starting Backend API...
        Backend starting on port 3001...

[3/5] Starting Monitoring Service...
        Monitoring service started

[4/5] Starting Telegram Bot...
        Telegram bot started

[5/5] Waiting for services to start...
        API ready

========================================================
   HEALTH CHECK
========================================================
        [OK] Backend API is responding
        [OK] Database connection is healthy
        [OK] Port 3001 is listening

========================================================
   STARTUP REPORT
========================================================
   GREEN: Packing List Server is running and ready.
```

### Step 4: Check Status
```batch
Check-Status.bat
```

**Expected Output:**
```
========================================================
   PACKING LIST SERVER - STATUS CHECK
========================================================

[CHECK 1/9] Backend Process...
        [OK] Backend process is running

[CHECK 2/9] Monitoring Process...
        [OK] Monitoring process is running

[CHECK 5/9] Port 3001 Listening...
        [OK] Port 3001 is listening

[CHECK 6/9] API /health Endpoint...
        [OK] /health endpoint responding

[CHECK 7/9] Database Connection...
        [OK] Database connection healthy

========================================================
   GREEN: Packing List Server is running and ready.
```

---

## Health Endpoint Verification

Open in browser or curl:

### /health
```json
{
  "status": "ok",
  "timestamp": "2026-05-08T...",
  "db": { "status": "ok", "latencyMs": 5 },
  "uptime": 120,
  "version": "2.0.0"
}
```

### /api/health
```json
{
  "status": "ok",
  "timestamp": "2026-05-08T...",
  "db": { "status": "ok", "latencyMs": 5 },
  "uptime": 120,
  "version": "2.0.0"
}
```

### /health/db
```json
{
  "status": "ok",
  "latencyMs": 3
}
```

### /health/full
```json
{
  "status": "ok",
  "timestamp": "2026-05-08T...",
  "uptime": 120,
  "env": "production",
  "db": { "status": "ok", "latencyMs": 5 },
  "memory": {
    "heapUsedMB": 45,
    "heapTotalMB": 128,
    "rssMB": 89
  }
}
```

---

## Log Files Verification

Check these log files in `C:\PackingList\logs\`:

| Log File | Content | Expected |
|----------|---------|----------|
| `backend.log` | API server output | Server started, routes loaded |
| `monitoring.log` | Health check logs | Periodic health checks |
| `telegram.log` | Bot activity | Bot started, commands received |
| `launcher.log` | Launcher script output | All start/stop events |
| `tunnel.log` | Cloudflare tunnel | Connected message |

---

## Store Workflow Test

### B1 Store (Requester)
1. Login as B1 user
2. Navigate to Orders
3. Create Order → Select items → Add quantity
4. Submit order
5. **Verify:** Telegram notification received by B3

### B3 Store (Supplier)
1. Login as B3 user
2. View notification bell (red badge = unread)
3. Open notification → Go to order
4. Accept order
5. Adjust quantities (if needed)
6. Mark as Ready to Ship
7. **Verify:** Telegram notification received by B1

### B1 Store (Confirm Receipt)
1. View notification → Go to order
2. Mark as Received
3. **Verify:** Notification to B2/Accountant

### Accountant
1. Login as Accountant
2. Navigate to Reports/Summary
3. Filter by: Today / This Week / This Month / This Year
4. Verify completed orders listed
5. Export/Generate Invoice
6. **Verify:** Pricing matches order-time snapshot

---

## Failure Handling Test

### Simulate Backend Crash
1. Run `taskkill /F /IM node.exe` (simulate crash)
2. Check `Check-Status.bat` - should show RED
3. Telegram alert should be sent
4. Run `Start-PackingList.bat` - should recover

### Simulate Database Failure
1. Stop MySQL service
2. Check `Check-Status.bat` - DB check should FAIL
3. Restart MySQL
4. Check again - should recover

### Simulate Reboot
1. Restart Windows
2. PM2/Startup task should auto-start services
3. Wait 30 seconds
4. Run `Check-Status.bat`
5. Should show GREEN

---

## Notification Verification

Test these notification scenarios:

| Event | Notification Sent To | Expected |
|-------|---------------------|----------|
| Order Created | B1 (requester) | "Order #PL-xxx created" |
| Order Submitted | B3 (supplier) | "New order from B1" |
| Order Accepted | B1 (requester) | "Order accepted" |
| Order Rejected | B1 (requester) | "Order rejected: [reason]" |
| Order Shipped | B1 (requester) | "Order shipped" |
| Order Received | B2/Accountant | "Order received" |
| Discrepancy | B3 + Admin | "Quantity mismatch" |

---

## Final Sign-Off

### Infrastructure
- [ ] Server meets hardware requirements
- [ ] Network/firewall configured
- [ ] Domain DNS configured
- [ ] SSL certificate installed

### Deployment
- [ ] `setup-production.bat` runs successfully
- [ ] All config files updated
- [ ] `Start-PackingList.bat` shows GREEN
- [ ] All health endpoints return 200

### Functionality
- [ ] Login works for all roles
- [ ] Order creation/submission works
- [ ] Supplier workflow works
- [ ] Notifications received
- [ ] Accounting reports work

### Operations
- [ ] Reboot auto-recovery works
- [ ] Backup scheduled
- [ ] Monitoring alerts functional
- [ ] Log rotation configured

### Sign-Off
```
Tested By: ________________
Date: ________________
Signature: ________________
```

---

## Contact & Support

For issues, check:
1. `C:\PackingList\logs\` for error details
2. GitHub Issues: https://github.com/liemdo28/packing-list/issues
3. Status Report: `C:\PackingList\status-report.html`
