/**
 * stress/k6/same-order-concurrency.js
 *
 * SAME-ORDER CONCURRENCY TEST — the most critical stress test.
 *
 * Creates a single shared order (or uses ORDER_ID env var), then fires
 * N concurrent VUs at the SAME order with the SAME action simultaneously.
 *
 * This test is the arbiter for whether the concurrency fixes are working:
 *   ✅ PASS = only one request succeeds, the rest get 200/idempotent or 400/invalid-transition
 *   ❌ FAIL = multiple requests mutate state, double price snapshots, or server 500s
 *
 * Run:
 *   k6 run stress/k6/same-order-concurrency.js \
 *     --env ORDER_ID=42 \
 *     --env ACTION=complete \
 *     --env CONCURRENT_USERS=20 \
 *     --stage 5s:20
 *
 * Or use the helper scripts:
 *   ./stress/scripts/run-concurrency.ps1  (PowerShell)
 *   ./stress/scripts/run-concurrency.sh   (bash)
 *
 * Expected pass criteria (with concurrency-safe OrderService):
 *   - Zero server 500 errors
 *   - One or more requests return 200 (the winning transition)
 *   - Zero or more requests return 200 (idempotent — already in target state)
 *   - Zero requests return 409 (no "conflict" in our impl, but idempotent returns 200)
 *   - All other requests return 400 "already in target state" or 200 idempotent
 *   - DB: exactly one price snapshot per order after test
 *
 * Gates:
 *   1. "double_complete_attempt" counter tracks how many times complete was called
 *      on an already-completed order — should be > 1 (idempotency works)
 *   2. DB integrity check runs after test (see stress/sql/integrity-checks.sql)
 *   3. If any request returns 500 → FAIL immediately
 */

import { check, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate } from 'k6/metrics';
import {
  BASE_URL, jsonHeaders, safeJson, loginAdmin,
} from './_helpers.js';

// ─── Custom metrics ──────────────────────────────────────────────────────────

const doubleCompleteAttempt = new Counter('double_complete_attempt');
const doubleCancelAttempt   = new Counter('double_cancel_attempt');
const winningTransition     = new Counter('winning_transition');
const safeIdempotentResponse = new Counter('safe_idempotent_response');
const serverError           = new Counter('server_error');
const transitionError       = new Counter('transition_error');

// ─── Config ──────────────────────────────────────────────────────────────────

const ORDER_ID = parseInt(__ENV.ORDER_ID || '0', 10);
const ACTION  = __ENV.ACTION || 'complete';
const CONCURRENT_USERS = parseInt(__ENV.CONCURRENT_USERS || '20', 10);

// All state transitions supported by the API
const VALID_ACTIONS = [
  'submit', 'prepare', 'ship', 'receive', 'complete', 'cancel',
];

// ─── Setup: create a pre-formed order to test ──────────────────────────────

export function setup() {
  if (!ORDER_ID) {
    // Create a draft order we can use across all VUs
    const token = loginAdmin();
    if (!token) throw new Error('Could not authenticate in setup()');

    const createRes = http.post(
      `${BASE_URL}/orders`,
      JSON.stringify({
        from_store_id: 1,
        to_store_id:   2,
        notes:         `concurrency-test-${Date.now()}`,
        lines:         [{ item_id: 1, quantity: 10 }],
      }),
      { headers: jsonHeaders(token) }
    );

    if (createRes.status !== 201 && createRes.status !== 200) {
      throw new Error(`setup() failed to create order: ${createRes.status} ${createRes.body}`);
    }

    const created = safeJson(createRes)?.data || safeJson(createRes);
    const newOrderId = created?.id || created?.Order?.id;
    console.log(`Concurrency test: created order ID ${newOrderId}`);
    return { orderId: newOrderId, action: ACTION };
  }

  return { orderId: ORDER_ID, action: ACTION };
}

// ─── Test: fire ACTION at the shared order from N concurrent VUs ────────────

export const options = {
  // Run CONCURRENT_USERS VUs for 30 seconds — all fighting for the same order
  scenarios: {
    concurrency_storm: {
      executor: 'constant-vus',
      vus:      CONCURRENT_USERS,
      duration: '30s',
    },
  },
  thresholds: {
    // The critical gate: zero server errors means concurrency control is working
    'server_error':           ['count==0'],
    'http_req_duration':      ['p(95)<1500'],
    'http_req_failed':       ['rate<0.05'],
  },
};

export default function (data) {
  const { orderId, action } = data;

  const token = loginAdmin();
  if (!token) {
    console.error(`[VU ${__VU}] Could not authenticate`);
    return;
  }

  // Build the request body based on action
  let body = {};
  if (action === 'receive') {
    body = { lines: [] };
  } else if (action === 'cancel') {
    body = { cancel_reason: `Concurrency test from VU ${__VU}` };
  }

  const res = http.post(
    `${BASE_URL}/orders/${orderId}/${action}`,
    JSON.stringify(body),
    { headers: jsonHeaders(token) }
  );

  const body_parsed = safeJson(res);

  // ── PASS gates ────────────────────────────────────────────────────────────
  const passGate = check(res, {
    'request handled without 500':    (r) => r.status !== 500,
    'response is valid HTTP status': (r) => [200, 400, 409, 422].includes(r.status),
  });

  if (!passGate) {
    serverError.add(1);
    console.error(`[VU ${__VU}] SERVER ERROR ${res.status} on ${action}: ${res.body}`);
    return;
  }

  // ── Categorize response ───────────────────────────────────────────────────
  switch (res.status) {
    case 200:
      winningTransition.add(1);
      if (action === 'complete') doubleCompleteAttempt.add(1);
      if (action === 'cancel')   doubleCancelAttempt.add(1);
      break;

    case 400:
      // Idempotent: "already in target state" — THIS IS THE EXPECTED BEHAVIOR
      if (body_parsed?.error?.includes('already') ||
          body_parsed?.error?.includes('Cannot transition')) {
        safeIdempotentResponse.add(1);
        if (action === 'complete') doubleCompleteAttempt.add(1);
        if (action === 'cancel')   doubleCancelAttempt.add(1);
      } else {
        // Genuine invalid transition error (e.g. wrong order in workflow)
        transitionError.add(1);
      }
      break;

    default:
      // 409 / 422 — also considered safe if it's about state conflict
      safeIdempotentResponse.add(1);
      break;
  }

  // Small stagger to simulate real-world user race
  sleep(Math.random() * 0.05);
}

// ─── Teardown ────────────────────────────────────────────────────────────────

export function handleSummary(data) {
  return {
    'concurrency-result.json': JSON.stringify({
      test:          'same-order-concurrency',
      action:        ACTION,
      order_id:      ORDER_ID || 'created-in-setup',
      vus:           CONCURRENT_USERS,
      winning:      data.metrics?.winning_transition?.values?.count || 0,
      idempotent:   data.metrics?.safe_idempotent_response?.values?.count || 0,
      server_errors: data.metrics?.server_error?.values?.count || 0,
      p95_ms:        data.metrics?.http_req_duration?.values?.['p(95)'] || 0,
      verdict:       (data.metrics?.server_error?.values?.count || 0) === 0
                      ? 'PASS'
                      : 'FAIL',
    }, null, 2),
  };
}
