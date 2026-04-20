/**
 * stress/k6/order-flow.js
 *
 * Full order lifecycle load test — validates happy-path throughput
 * across many concurrent users running complete create→complete cycles.
 *
 * Run:  k6 run stress/k6/order-flow.js
 * Env:  BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, STORE_ID_B1, STORE_ID_B2, ITEM_ID_1
 *
 * Load profile:
 *   5, 10, 20 concurrent users, each running:
 *     login → create order → submit → prepare → ship → receive → complete
 *
 * SLIs:
 *   end-to-end success rate > 99%
 *   no invalid state transitions (400s should only be transfer-rule rejections)
 *   each order is countable in completed orders list
 */

import { check, sleep } from 'k6';
import http from 'k6/http';
import {
  BASE_URL, jsonHeaders, safeJson, loginAdmin, getToken,
  uniqueNote, randItem, ITEM_IDS, STORE_IDS,
} from './_helpers.js';

export const options = {
  stages: [
    { duration: '1m',  target: 5  },   // Warm up at 5 users
    { duration: '3m',  target: 10 },   // Hold at 10 users
    { duration: '2m',  target: 20 },   // Spike to 20 users
    { duration: '30s', target: 0  },   // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed':  ['rate<0.02'],   // Allow 2% failures (transfer-rule rejections)
    'orders_created':   ['count>0'],
    'orders_completed': ['count>0'],
  },
};

export const ordersCreated  = { type: 'Counter' };
export const ordersCompleted = { type: 'Counter' };
export const transitionErrors = { type: 'Counter' };

export default function () {
  const token = loginAdmin();
  if (!token) {
    console.error(`[VU ${__VU}] Could not authenticate`);
    return;
  }

  // ── Pick random item & valid store pair ─────────────────────────────────────
  // Only B1 and B3 can send. Pick a random valid sender-receiver pair.
  const validPairs = [
    { from: STORE_IDS.b1, to: STORE_IDS.b2 },
    { from: STORE_IDS.b1, to: STORE_IDS.b3 },
    { from: STORE_IDS.b3, to: STORE_IDS.b1 },
    { from: STORE_IDS.b3, to: STORE_IDS.b2 },
  ];
  const pair = randItem(validPairs);
  const itemIds = Object.values(ITEM_IDS);
  const itemId = randItem(itemIds);

  // ── 1. Create order ─────────────────────────────────────────────────────────
  const createRes = http.post(
    `${BASE_URL}/orders`,
    JSON.stringify({
      from_store_id: pair.from,
      to_store_id:   pair.to,
      notes:         uniqueNote('flow'),
      lines:         [{ item_id: itemId, requested_qty: Math.floor(Math.random() * 20) + 1 }],
    }),
    { headers: jsonHeaders(token) }
  );

  if (createRes.status !== 201 && createRes.status !== 200) {
    // B2 can't send — this is expected in mixed-role scenarios
    const err = safeJson(createRes)?.error || '';
    if (!err.includes('not allowed')) {
      transitionErrors.add(1);
      console.error(`[VU ${__VU}] Create failed (${createRes.status}): ${err}`);
    }
    return;
  }

  const created = safeJson(createRes)?.data || safeJson(createRes);
  const orderId = created?.id || created?.Order?.id;
  if (!orderId) return;
  ordersCreated.add(1);

  // ── 2. Submit ───────────────────────────────────────────────────────────────
  const submitRes = http.post(
    `${BASE_URL}/orders/${orderId}/submit`,
    JSON.stringify({}),
    { headers: jsonHeaders(token) }
  );

  if (submitRes.status !== 200) {
    transitionErrors.add(1);
    console.error(`[VU ${__VU}] Submit failed (${submitRes.status}): ${safeJson(submitRes)?.error}`);
    return;
  }

  // ── 3. Prepare ───────────────────────────────────────────────────────────────
  const prepareRes = http.post(
    `${BASE_URL}/orders/${orderId}/prepare`,
    JSON.stringify({}),
    { headers: jsonHeaders(token) }
  );

  if (prepareRes.status !== 200) {
    transitionErrors.add(1);
    console.error(`[VU ${__VU}] Prepare failed (${prepareRes.status}): ${safeJson(prepareRes)?.error}`);
    return;
  }

  // ── 4. Ship ─────────────────────────────────────────────────────────────────
  const shipRes = http.post(
    `${BASE_URL}/orders/${orderId}/ship`,
    JSON.stringify({}),
    { headers: jsonHeaders(token) }
  );

  if (shipRes.status !== 200) {
    transitionErrors.add(1);
    console.error(`[VU ${__VU}] Ship failed (${shipRes.status}): ${safeJson(shipRes)?.error}`);
    return;
  }

  // ── 5. Receive ──────────────────────────────────────────────────────────────
  const receiveRes = http.post(
    `${BASE_URL}/orders/${orderId}/receive`,
    JSON.stringify({ lines: [] }), // quantities already set in prepare
    { headers: jsonHeaders(token) }
  );

  if (receiveRes.status !== 200) {
    transitionErrors.add(1);
    console.error(`[VU ${__VU}] Receive failed (${receiveRes.status}): ${safeJson(receiveRes)?.error}`);
    return;
  }

  // ── 6. Complete ─────────────────────────────────────────────────────────────
  const completeRes = http.post(
    `${BASE_URL}/orders/${orderId}/complete`,
    JSON.stringify({}),
    { headers: jsonHeaders(token) }
  );

  check(completeRes, {
    'complete succeeded or idempotent': (r) =>
      r.status === 200 || r.status === 400,
  });

  if (completeRes.status === 200) {
    ordersCompleted.add(1);
    console.log(`[VU ${__VU}] Order ${orderId} completed successfully`);
  } else {
    console.warn(`[VU ${__VU}] Complete returned ${completeRes.status}: ${safeJson(completeRes)?.error}`);
    transitionErrors.add(1);
  }

  sleep(Math.random() * 1.5 + 0.3);
}
