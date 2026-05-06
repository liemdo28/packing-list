require('dotenv').config();

const axios   = require('axios');
const { alert, info } = require('./alert');

const BASE    = process.env.API_BASE_URL;
const TIMEOUT = 15_000;

// Error grouping: suppress repeated same-error alerts within 5 min
const errorGroups = new Map();

function shouldSend(key) {
  const now = Date.now();
  const last = errorGroups.get(key);
  if (!last || now - last.firstSeen > 5 * 60_000) {
    errorGroups.set(key, { firstSeen: now, count: 1 });
    return true;
  }
  last.count++;
  errorGroups.set(key, last);
  if (last.count % 5 === 0) return true; // re-alert every 5th occurrence
  return false;
}

async function apiCall(method, path, data, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios({ method, url: `${BASE}${path}`, data, headers, timeout: TIMEOUT });
  return res.data;
}

async function runSmokeFlow() {
  const start = Date.now();

  try {
    // Step 1: Login
    let token;
    try {
      const loginRes = await apiCall('post', '/api/auth/login', {
        username: process.env.SMOKE_ADMIN_USERNAME,
        password: process.env.SMOKE_ADMIN_PASSWORD,
      });
      token = loginRes.data?.token;
      if (!token) throw new Error('No token in login response');
    } catch (err) {
      const key = 'smoke:login';
      if (shouldSend(key)) {
        await alert({
          severity: 'HIGH',
          module:   'Smoke Flow',
          error:    'Login step failed',
          endpoint: 'POST /api/auth/login',
          reason:   err.message,
          action:   'Check backend is running and DB is connected',
        });
      }
      return;
    }

    // Step 2: /api/dashboard reachable
    try {
      await apiCall('get', '/api/dashboard', null, token);
    } catch (err) {
      const key = 'smoke:dashboard';
      if (shouldSend(key)) {
        await alert({
          severity: 'HIGH',
          module:   'Smoke Flow',
          error:    'Dashboard endpoint failed',
          endpoint: 'GET /api/dashboard',
          reason:   err.message,
          action:   'Check dashboard controller and DB query',
        });
      }
      return;
    }

    // Step 3: Order list reachable
    try {
      await apiCall('get', '/api/orders?limit=1', null, token);
    } catch (err) {
      const key = 'smoke:orders';
      if (shouldSend(key)) {
        await alert({
          severity: 'HIGH',
          module:   'Smoke Flow',
          error:    'Orders endpoint failed',
          endpoint: 'GET /api/orders',
          reason:   err.message,
          action:   'Check order controller and orders table',
        });
      }
      return;
    }

    const ms = Date.now() - start;
    console.log(`[smoke] ok — ${ms}ms`);
  } catch (err) {
    await alert({
      severity: 'HIGH',
      module:   'Smoke Flow',
      error:    `Unexpected smoke flow error: ${err.message}`,
      action:   'Check monitoring logs for stack trace',
    });
  }
}

module.exports = { runSmokeFlow };
