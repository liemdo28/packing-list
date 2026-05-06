/**
 * smoke_flow_full.js — Full order-workflow smoke test
 *
 * Covers every status transition for a B1→B2 order:
 *   draft → submitted → processing → ready_to_ship
 *   → in_transit → received_pending_confirmation → completed
 *
 * Also verifies:
 *   - Price snapshot written on COMPLETED (unit_price on order lines)
 *   - Dashboard stats endpoint reachable
 *   - Pricing admin status endpoint reachable (admin only)
 *
 * Env vars (same .env as monitoring/index.js):
 *   API_BASE_URL          e.g. https://api.yourdomain.com
 *   SMOKE_ADMIN_USERNAME  admin account
 *   SMOKE_ADMIN_PASSWORD
 *   SMOKE_B1_USERNAME     b1 store account
 *   SMOKE_B1_PASSWORD
 *   SMOKE_B2_USERNAME     b2 store account
 *   SMOKE_B2_PASSWORD
 */

require('dotenv').config();

const axios   = require('axios');
const { alert, info } = require('./alert');

const BASE    = (process.env.API_BASE_URL || '').replace(/\/$/, '');
const TIMEOUT = 20_000;

// ── helpers ──────────────────────────────────────────────────────────────────

async function api(method, path, data, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    const res = await axios({ method, url: `${BASE}${path}`, data, headers, timeout: TIMEOUT });
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    const body   = JSON.stringify(err.response?.data || {});
    throw new Error(`${method.toUpperCase()} ${path} → HTTP ${status}: ${body}`);
  }
}

async function login(username, password) {
  const res = await api('post', '/api/auth/login', { username, password });
  const token = res.data?.token || res.token;
  if (!token) throw new Error('Login returned no token');
  return token;
}

async function transition(orderId, status, token) {
  return api('patch', `/api/orders/${orderId}/status`, { status }, token);
}

// ── main flow ─────────────────────────────────────────────────────────────────

async function runFullSmokeFlow() {
  const start   = Date.now();
  let adminToken, b1Token, b2Token;
  let orderId, orderNumber;

  // Step 1 — Login all three accounts ─────────────────────────────────────────
  try {
    [adminToken, b1Token, b2Token] = await Promise.all([
      login(process.env.SMOKE_ADMIN_USERNAME, process.env.SMOKE_ADMIN_PASSWORD),
      login(process.env.SMOKE_B1_USERNAME    || 'user_b1', process.env.SMOKE_B1_PASSWORD || process.env.SMOKE_ADMIN_PASSWORD),
      login(process.env.SMOKE_B2_USERNAME    || 'user_b2', process.env.SMOKE_B2_PASSWORD || process.env.SMOKE_ADMIN_PASSWORD),
    ]);
  } catch (err) {
    await alert({ severity: 'CRITICAL', module: 'Smoke Full', error: 'Login failed', reason: err.message, action: 'Check auth service and DB connection' });
    return false;
  }

  // Step 2 — Dashboard reachable ───────────────────────────────────────────────
  try {
    await api('get', '/api/dashboard/stats', null, adminToken);
  } catch (err) {
    await alert({ severity: 'HIGH', module: 'Smoke Full', error: 'Dashboard stats failed', reason: err.message });
    return false;
  }

  // Step 3 — Pricing admin status reachable ────────────────────────────────────
  try {
    await api('get', '/api/admin/pricing/sync/status', null, adminToken);
  } catch (err) {
    await alert({ severity: 'WARNING', module: 'Smoke Full', error: 'Pricing admin status failed', reason: err.message, action: 'Check admin pricing routes' });
    // Non-fatal — continue workflow test
  }

  // Step 4 — Fetch stores to get B1 / B2 IDs ───────────────────────────────────
  let fromStoreId, toStoreId, firstItemId;
  try {
    const storesRes = await api('get', '/api/stores', null, adminToken);
    const stores    = storesRes.data || storesRes;
    const b1 = stores.find(s => s.code === 'B1');
    const b2 = stores.find(s => s.code === 'B2');
    if (!b1 || !b2) throw new Error(`Missing stores — found: ${stores.map(s => s.code).join(', ')}`);
    fromStoreId = b1.id;
    toStoreId   = b2.id;

    const itemsRes = await api('get', '/api/items?limit=1&active=true', null, adminToken);
    firstItemId = (itemsRes.data || itemsRes)[0]?.id;
    if (!firstItemId) throw new Error('No active items found');
  } catch (err) {
    await alert({ severity: 'HIGH', module: 'Smoke Full', error: 'Store/item lookup failed', reason: err.message });
    return false;
  }

  // Step 5 — Create draft order (as B1) ────────────────────────────────────────
  try {
    const res = await api('post', '/api/orders', {
      from_store_id: fromStoreId,
      to_store_id:   toStoreId,
      notes:         '[smoke-test] automated verification order',
      lines: [{ item_id: firstItemId, quantity: 1 }],
    }, b1Token);
    orderId     = res.data?.id || res.id;
    orderNumber = res.data?.order_number || res.order_number;
    if (!orderId) throw new Error('No order id in response');
  } catch (err) {
    await alert({ severity: 'HIGH', module: 'Smoke Full', error: 'Create order failed', reason: err.message });
    return false;
  }

  // Steps 6-11 — State machine transitions ─────────────────────────────────────
  const steps = [
    { status: 'submitted',                     token: b1Token,    actor: 'b1' },
    { status: 'processing',                    token: b1Token,    actor: 'b1' },
    { status: 'ready_to_ship',                 token: b1Token,    actor: 'b1' },
    { status: 'in_transit',                    token: b1Token,    actor: 'b1' },
    { status: 'received_pending_confirmation', token: b2Token,    actor: 'b2' },
    { status: 'completed',                     token: b2Token,    actor: 'b2' },
  ];

  for (const step of steps) {
    try {
      await transition(orderId, step.status, step.token);
    } catch (err) {
      await alert({
        severity: 'HIGH',
        module:   'Smoke Full',
        error:    `Order transition failed: ${step.status}`,
        entityId: orderNumber,
        reason:   err.message,
        action:   `Check order state machine for transition to '${step.status}'`,
      });
      // Attempt cleanup
      try { await transition(orderId, 'cancelled', adminToken); } catch (_) {}
      return false;
    }
  }

  // Step 12 — Verify price snapshot was written ─────────────────────────────────
  try {
    const res   = await api('get', `/api/orders/${orderId}`, null, adminToken);
    const order = res.data || res;
    const lines = order.lines || [];
    const snapped = lines.every(l => l.unit_price != null);
    if (!snapped) {
      await alert({
        severity: 'WARNING',
        module:   'Smoke Full',
        error:    'Price snapshot missing after COMPLETED',
        entityId: orderNumber,
        reason:   `Lines without unit_price: ${lines.filter(l => l.unit_price == null).length}`,
        action:   'Check orderService._snapshotPrices and price_master data',
      });
    }
  } catch (err) {
    await alert({ severity: 'WARNING', module: 'Smoke Full', error: 'Could not verify price snapshot', reason: err.message });
  }

  const ms = Date.now() - start;
  console.log(`[smoke-full] OK — ${orderNumber} completed in ${ms}ms`);
  return true;
}

module.exports = { runFullSmokeFlow };

// Allow direct execution: node smoke_flow_full.js
if (require.main === module) {
  runFullSmokeFlow()
    .then(ok => process.exit(ok ? 0 : 1))
    .catch(err => { console.error(err); process.exit(1); });
}
