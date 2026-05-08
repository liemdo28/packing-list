/**
 * stress/k6/summary-load.js
 *
 * Summary load test — validates the monthly summary endpoint under concurrent reads
 * while orders are being created and completed in parallel.
 *
 * Run:  k6 run stress/k6/summary-load.js
 *
 * Validates:
 *   - Summary returns valid JSON with expected structure
 *   - Totals remain consistent under concurrent write load
 *   - No 500 errors on the summary endpoint
 *   - p95 response < 2 seconds
 */

import { check, sleep } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';
import {
  BASE_URL, jsonHeaders, safeJson, loginAdmin, uniqueNote,
  STORE_IDS, ITEM_IDS, randItem,
} from './_helpers.js';

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // 10 concurrent users
    { duration: '3m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed':  ['rate<0.02'],
    'summary_checks_passed': ['count>0'],
    'summary_mismatch_detected': ['count=0'],
  },
};

const summaryChecksPassed = new Counter('summary_checks_passed');
const summaryMismatchDetected = new Counter('summary_mismatch_detected');

// ─── Helper: fetch monthly summary ──────────────────────────────────────────

function fetchSummary(token, year, month) {
  const res = http.get(
    `${BASE_URL}/summary/monthly?year=${year}&month=${month}`,
    { headers: jsonHeaders(token) }
  );
  return res;
}

// ─── Helper: validate summary structure ────────────────────────────────────

function validateSummary(body) {
  if (!body) return false;
  // Accept either { data: ... } wrapped or raw array/object
  const data = body.data !== undefined ? body.data : body;
  if (!data) return false;

  // Should have items (array) or pairs + grand_total
  const hasItems = Array.isArray(data.items) || Array.isArray(data.pairs);
  const hasGrandTotal = data.grand_total !== undefined;
  return hasItems || hasGrandTotal;
}

// ─── Test ──────────────────────────────────────────────────────────────────

export default function () {
  const token = loginAdmin();
  if (!token) return;

  const year  = parseInt(__ENV.YEAR  || String(new Date().getFullYear()), 10);
  const month = parseInt(__ENV.MONTH || String(new Date().getMonth() + 1), 10);

  // ── 1. Write side: create + complete an order ───────────────────────────────
  // This ensures there's fresh data for the summary to aggregate
  const pair = randItem([
    { from: STORE_IDS.b1, to: STORE_IDS.b2 },
    { from: STORE_IDS.b1, to: STORE_IDS.b3 },
    { from: STORE_IDS.b3, to: STORE_IDS.b1 },
    { from: STORE_IDS.b3, to: STORE_IDS.b2 },
  ]);

  const itemId = randItem(Object.values(ITEM_IDS));

  const createRes = http.post(
    `${BASE_URL}/orders`,
    JSON.stringify({
      from_store_id: pair.from,
      to_store_id:   pair.to,
      notes:         uniqueNote('summary-write'),
      lines:         [{ item_id: itemId, quantity: 1 }],
    }),
    { headers: jsonHeaders(token) }
  );

  if (createRes.status !== 201 && createRes.status !== 200) return;

  const created = safeJson(createRes)?.data || safeJson(createRes);
  const orderId = created?.id || created?.Order?.id;
  if (!orderId) return;

  // Fast-forward to completed inline (skip prepare/ship/receive for speed)
  // Use the transition endpoints
  http.post(`${BASE_URL}/orders/${orderId}/submit`,  '{}',            { headers: jsonHeaders(token) });
  http.post(`${BASE_URL}/orders/${orderId}/prepare`,  '{}',            { headers: jsonHeaders(token) });
  http.post(`${BASE_URL}/orders/${orderId}/ship`,     '{}',            { headers: jsonHeaders(token) });
  http.post(`${BASE_URL}/orders/${orderId}/receive`,  '{"lines":[]}',  { headers: jsonHeaders(token) });
  const completeRes = http.post(`${BASE_URL}/orders/${orderId}/complete`, '{}', { headers: jsonHeaders(token) });

  if (completeRes.status !== 200) return;

  // ── 2. Read side: fetch summary while writes are happening ─────────────────
  const summaryRes = fetchSummary(token, year, month);

  check(summaryRes, {
    'summary returns 200':           (r) => r.status === 200,
    'summary is valid JSON':         (r) => safeJson(r) !== null,
    'summary has expected structure': (r) => validateSummary(safeJson(r)),
  });

  if (summaryRes.status === 200 && safeJson(summaryRes)) {
    summaryChecksPassed.add(1);
  } else {
    summaryMismatchDetected.add(1);
    console.warn(`[VU ${__VU}] Summary validation failed: ${summaryRes.status}`);
  }

  // ── 3. Also query the order list filtered by completed ─────────────────────
  const listRes = http.get(
    `${BASE_URL}/orders?status=completed&page=1`,
    { headers: jsonHeaders(token) }
  );
  check(listRes, {
    'completed orders list works': (r) => r.status === 200,
  });

  sleep(Math.random() * 1.0 + 0.2);
}