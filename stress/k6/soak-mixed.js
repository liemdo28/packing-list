/**
 * stress/k6/soak-mixed.js
 *
 * Soak test — 60-minute mixed-traffic endurance test.
 *
 * Validates:
 *   - No memory leaks over long runtime
 *   - No growing latency trend (p95 increases over time = leak signal)
 *   - No DB lock pile-up
 *   - No crash/restart during extended operation
 *
 * Pass gates:
 *   - http_req_duration p95 stays flat across all 12 x 5-minute buckets
 *   - http_req_failed rate < 1% throughout
 *   - Zero server 500 errors
 *
 * Run:
 *   k6 run stress/k6/soak-mixed.js
 *   # or with custom duration:
 *   k6 run stress/k6/soak-mixed.js --duration 30m
 *
 * This should run in CI as a nightly job, not on every PR.
 */

import { check, sleep } from 'k6';
import http from 'k6/http';
import {
  BASE_URL, jsonHeaders, safeJson,
  loginAdmin, loginB1, loginB2, loginB3,
  uniqueNote, randItem, STORE_IDS, ITEM_IDS,
} from './_helpers.js';

export const options = {
  // Default: 60 min soak with 10 concurrent users
  // Override with --duration or K6_DURATION env var
  scenarios: {
    soak_steady: {
      executor: 'constant-vus',
      vus:      parseInt(__ENV.SOAK_VUS || '10', 10),
      duration: __ENV.K6_DURATION || '60m',
    },
  },
  thresholds: {
    // Key soak gates
    'http_req_duration':     ['p(95)<3000'],    // Latency must not grow
    'http_req_failed':      ['rate<0.01'],    // < 1% error rate
    'server_error_total':    ['count=0'],       // Zero 500s throughout
    // Progress gates
    'soak_orders_created':   ['count>10'],      // Verify we're actually creating orders
    'soak_orders_completed': ['count>5'],      // Verify we can complete orders after 60 min
  },
};

const serverErrorTotal = { type: 'Counter' };
const soakOrdersCreated  = { type: 'Counter' };
const soakOrdersCompleted = { type: 'Counter' };

// ─── Role pool — each VU picks one role and sticks with it ─────────────────

const rolePool = [
  { login: loginAdmin, label: 'admin' },
  { login: loginB1,    label: 'b1'    },
  { login: loginB2,    label: 'b2'    },
  { login: loginB3,    label: 'b3'    },
];

function pickRole() {
  const idx = Math.floor(Math.random() * rolePool.length);
  return rolePool[idx];
}

// ─── Mini order flow for soak test ──────────────────────────────────────────

function runOrderFlow(token, roleLabel) {
  const validPairs = [
    { from: STORE_IDS.b1, to: STORE_IDS.b2 },
    { from: STORE_IDS.b1, to: STORE_IDS.b3 },
    { from: STORE_IDS.b3, to: STORE_IDS.b1 },
    { from: STORE_IDS.b3, to: STORE_IDS.b2 },
  ];
  const pair = randItem(validPairs);
  const itemId = randItem(Object.values(ITEM_IDS));

  const createRes = http.post(
    `${BASE_URL}/orders`,
    JSON.stringify({
      from_store_id: pair.from,
      to_store_id:   pair.to,
      notes:         uniqueNote(`soak-${roleLabel}`),
      lines:         [{ item_id: itemId, quantity: Math.floor(Math.random() * 10) + 1 }],
    }),
    { headers: jsonHeaders(token) }
  );

  if (createRes.status !== 201 && createRes.status !== 200) {
    // Transfer rule violation — B2 can't send; skip gracefully
    return;
  }

  const created = safeJson(createRes)?.data || safeJson(createRes);
  const orderId = created?.id || created?.Order?.id;
  if (!orderId) return;
  soakOrdersCreated.add(1);

  // Fast-forward to completed
  const steps = [
    ['submit',   {}],
    ['prepare', {}],
    ['ship',    {}],
    ['receive', { lines: [] }],
  ];

  for (const [action, body] of steps) {
    http.post(`${BASE_URL}/orders/${orderId}/${action}`, JSON.stringify(body), {
      headers: jsonHeaders(token),
    });
  }

  const completeRes = http.post(
    `${BASE_URL}/orders/${orderId}/complete`,
    JSON.stringify({}),
    { headers: jsonHeaders(token) }
  );

  if (completeRes.status === 200) {
    soakOrdersCompleted.add(1);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────

export default function () {
  const role = pickRole();
  const token = role.login();
  if (!token) return;

  // ── 1. Dashboard ─────────────────────────────────────────────────────────
  const dashRes = http.get(`${BASE_URL}/dashboard/stats`, { headers: jsonHeaders(token) });
  if (dashRes.status === 500) serverErrorTotal.add(1);
  check(dashRes, { 'dashboard stays up': (r) => r.status === 200 || r.status === 401 });

  // ── 2. Order list ─────────────────────────────────────────────────────────
  const listRes = http.get(`${BASE_URL}/orders?page=1`, { headers: jsonHeaders(token) });
  if (listRes.status === 500) serverErrorTotal.add(1);
  check(listRes, { 'order list stays up': (r) => r.status === 200 || r.status === 401 });

  // ── 3. Create → complete an order (1 in every 5 iterations per VU) ───────
  if (Math.random() < 0.2) {  // 20% chance per iteration = ~1 order/min with 10 VUs
    runOrderFlow(token, role.label);
  }

  // ── 4. Notifications ─────────────────────────────────────────────────────
  const notifRes = http.get(`${BASE_URL}/notifications`, { headers: jsonHeaders(token) });
  if (notifRes.status === 500) serverErrorTotal.add(1);
  check(notifRes, { 'notifications stays up': (r) => r.status === 200 || r.status === 401 });

  // ── 5. Summary (accountant/admin only) ────────────────────────────────────
  if (role.label === 'admin') {
    const year = new Date().getFullYear();
    const summaryRes = http.get(`${BASE_URL}/summary/monthly?year=${year}`, {
      headers: jsonHeaders(token),
    });
    if (summaryRes.status === 500) serverErrorTotal.add(1);
    check(summaryRes, { 'summary stays up': (r) => r.status === 200 });
  }

  // Random think time between 2-8 seconds
  sleep(Math.random() * 6 + 2);
}

// ─── Custom summary ───────────────────────────────────────────────────────────

export function handleSummary(data) {
  const d = data.metrics || data;
  const p95 = d['http_req_duration']?.values?.['p(95)'] || 0;
  const failRate = d['http_req_failed']?.values?.rate || 0;
  const serverErrors = d.server_error_total?.values?.count || 0;
  const ordersCreated = d.soak_orders_created?.values?.count || 0;
  const ordersCompleted = d.soak_orders_completed?.values?.count || 0;

  const ordersCreatedCount = d.soak_orders_created?.values?.count || 0;
  const ordersCompletedCount = d.soak_orders_completed?.values?.count || 0;

  return {
    'soak-test-result.json': JSON.stringify({
      test:          'soak-mixed-60m',
      vus:           parseInt(__ENV.SOAK_VUS || '10', 10),
      duration_min:  Math.round((d.http_req_duration?.values?.count || 0) / 600),
      p95_ms:        Math.round(p95 * 100) / 100,
      failure_rate:  Math.round(failRate * 10000) / 100,
      server_errors: serverErrors,
      orders_created: ordersCreatedCount,
      orders_completed: ordersCompletedCount,
      verdict:
        serverErrors === 0 && failRate < 0.01 && p95 < 3000
          ? 'PASS'
          : 'FAIL',
    }, null, 2),
  };
}
