/**
 * k6 Stress Test — Restaurant Operation System
 * ===========================================
 *
 * Tests both Laravel (v1) and Node.js (v2) API endpoints.
 *
 * Prerequisites:
 *   1. Install k6: https://k6.io/docs/getting-started/installation/
 *      Windows:  choco install k6
 *      macOS:   brew install k6
 *      Linux:   sudo gpg -k
 *               sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
 *               echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
 *               sudo apt-get update && sudo apt-get install k6
 *
 *   2. Start both servers (see root README.md Section 11):
 *        v1-laravel: php artisan serve  (http://localhost:8000)
 *        v2-react:   node server/src/index.js  (http://localhost:3001)
 *
 *   3. Seed the database so test accounts exist.
 *
 * Usage:
 *   k6 run tests/k6-stress-test.js
 *
 * With environment overrides:
 *   K6_LARAVEL_URL=http://localhost:8000 \
 *   K6_NODE_URL=http://localhost:3001 \
 *   k6 run tests/k6-stress-test.js
 *
 * Options:
 *   K6_WEB_DASHBOARD=1  k6 run ...     # Opens browser dashboard
 *   K6_PROMETHEUS_PORT=9100 k6 run ...  # Exposes /metrics for Prometheus
 */

import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';

// ─── Config ───────────────────────────────────────────────────────────────────

const LARAVEL_URL = __ENV.K6_LARAVEL_URL || 'http://localhost:8000';
const NODE_URL     = __ENV.K6_NODE_URL     || 'http://localhost:3001';

const LARAVEL_TOKEN = __ENV.K6_LARAVEL_TOKEN || null; // CSRF session cookie
const ADMIN_TOKEN   = __ENV.ADMIN_TOKEN       || null; // JWT for Node.js API

// ─── Custom metrics ───────────────────────────────────────────────────────────

const http_req_duration    = new Trend('http_req_duration');
const http_req_failed       = new Rate('http_req_failed');
const orders_created_total  = new Counter('orders_created_total');
const orders_completed_total= new Counter('orders_completed_total');
const transition_errors     = new Counter('transition_errors');
const double_complete_attempt = new Counter('double_complete_attempt');

const active_orders_gauge   = new Gauge('active_orders');

// ─── Test options ─────────────────────────────────────────────────────────────

export const options = {
  // ── Load profile ──────────────────────────────────────────────────────────
  //
  // To run the concurrency test, use a very short duration with high VUs:
  //   k6 run ... --stage 10s:10   (10 VUs for 10 seconds)
  //
  // For a sustained load test:
  //   k6 run ... --stage 1m:50  --stage 4m:50  --stage 1m:0
  //
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m',  target: 10 },   // Hold 10 users for 1 min
    { duration: '30s', target: 0 },    // Ramp down
  ],

  // ── Thresholds (SLIs) ─────────────────────────────────────────────────────
  thresholds: {
    'http_req_duration':     ['p(95)<500'],   // 95% of requests < 500ms
    'http_req_failed':       ['rate<0.05'],   // < 5% error rate
    'orders_completed_total':['count>=1'],    // At least 1 order completes
  },
};

// ─── Helper: Laravel helpers ──────────────────────────────────────────────────

let LARAVEL_COOKIES = {};

function laravelGet(path) {
  const res = http.get(`${LARAVEL_URL}${path}`, { cookies: LARAVEL_COOKIES });
  http_req_duration.add(res.timings.duration);
  http_req_failed.add(res.status !== 200 && res.status !== 302);
  return res;
}

function laravelPost(path, body, headers = {}) {
  const res = http.post(`${LARAVEL_URL}${path}`, JSON.stringify(body), {
    cookies: LARAVEL_COOKIES,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...headers },
  });
  http_req_duration.add(res.timings.duration);
  http_req_failed.add(res.status < 200 || res.status >= 300);
  return res;
}

function laravelCSRF() {
  const res = http.get(`${LARAVEL_URL}/login`);
  // Extract CSRF token from the login form
  const match = res.body.match(/name="_token" value="([^"]+)"/) ||
                 res.body.match(/csrf-token" content="([^"]+)"/);
  if (match) return match[1];
  return null;
}

// ─── Helper: Node.js (v2) helpers ─────────────────────────────────────────────

function nodeGet(path) {
  const res = http.get(`${NODE_URL}/api${path}`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
  });
  http_req_duration.add(res.timings.duration);
  http_req_failed.add(res.status !== 200);
  return res;
}

function nodePost(path, body) {
  const res = http.post(`${NODE_URL}/api${path}`, JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ADMIN_TOKEN}` },
  });
  http_req_duration.add(res.timings.duration);
  http_req_failed.add(res.status < 200 || res.status >= 300);
  return res;
}

// ─── Test: Get CSRF + Login (Laravel) ─────────────────────────────────────────

export function setup() {
  const csrf = laravelCSRF();

  // Login as admin
  const loginRes = laravelPost('/api/login', {
    _token: csrf,
    email: 'admin@restaurant.com',
    password: 'password',
  });

  // Laravel sets session cookie; k6 auto-manages cookies if we reuse the same jar
  LARAVEL_COOKIES = loginRes.cookies;

  // Login Node.js (get JWT) — if ADMIN_TOKEN not set via env
  let nodeToken = ADMIN_TOKEN;
  if (!nodeToken) {
    const nodeLogin = http.post(`${NODE_URL}/api/auth/login`, JSON.stringify({
      email: 'admin@restaurant.com',
      password: 'password',
    }));
    if (nodeLogin.status === 200) {
      const body = JSON.parse(nodeLogin.body);
      nodeToken = body.token;
    }
  }

  return { csrf, nodeToken };
}

// ─── Test VUs ──────────────────────────────────────────────────────────────────

export default function (data) {
  const { nodeToken } = data;

  // Re-acquire cookies (k6 resets cookies between iterations by default for each VU)
  // Store them in a module-level var so each VU keeps its own session
  LARAVEL_COOKIES = data._laravelCookies || {};

  // ─── Group 1: Read operations (high frequency) ─────────────────────────────
  group('Read Operations', () => {
    // Dashboard
    check(laravelGet('/dashboard'), {
      'dashboard loads': (r) => r.status === 200,
    });

    // Order list
    check(laravelGet('/orders'), {
      'order list loads': (r) => r.status === 200,
    });

    // API: List orders (Node)
    if (nodeToken) {
      check(nodeGet('/orders'), {
        'api: orders list': (r) => r.status === 200,
      });
    }
  });

  // ─── Group 2: Order creation (medium frequency) ─────────────────────────────
  group('Order Creation', () => {
    // Laravel: create order
    // Note: requires a valid session; in stress test without full browser flow
    // this may return 419. For true order creation test, use the API below.
    const apiRes = laravelGet('/api/orders?page=1');
    const hasOrders = apiRes.status === 200;
    if (hasOrders) {
      active_orders_gauge.add(1);
    }
  });

  // ─── Group 3: Concurrent state transition — CRITICAL TEST ─────────────────
  /**
   * CONCURRENCY TEST: Same order — multiple users trying to complete simultaneously.
   *
   * Expected outcome (with proper locking + idempotency):
   *   - Only ONE transition succeeds.
   *   - The other(s) return 200 (idempotent) or 409 (invalid transition).
   *   - The order ends up in exactly ONE final state.
   *
   * Run this specific test at high concurrency:
   *   k6 run tests/k6-stress-test.js \
   *     --stage 5s:20 \
   *     --env CONCURRENCY_TEST=1 \
   *     --env ORDER_ID=123
   */
  if (__ENV.CONCURRENCY_TEST === '1' && __ENV.ORDER_ID) {
    group('Concurrency: Double Complete', () => {
      // With idempotency guards, calling complete on an already-completed
      // order should return 200, not 409 and not corrupt data.
      const orderId = parseInt(__ENV.ORDER_ID, 10);

      const res = laravelPost(`/api/orders/${orderId}/complete`, {});
      check(res, {
        'double-complete handled safely': (r) =>
          r.status === 200 || r.status === 302, // 200 = idempotent, 302 = redirect to page
        'no server error': (r) => r.status !== 500,
      });

      if (res.status === 200) {
        double_complete_attempt.add(1);
      }
    });
  }

  // ─── Group 4: Node.js API state transitions ─────────────────────────────────
  if (nodeToken) {
    group('Node.js: Order Lifecycle', () => {
      // 1. Create order
      const createRes = nodePost('/orders', {
        from_store_id: 1, // B1
        to_store_id:   2, // B2
        notes:         'Stress test order',
        lines:         [{ item_id: 1, quantity: 10 }],
      });

      if (createRes.status === 201) {
        orders_created_total.add(1);
        const body = JSON.parse(createRes.body);
        const orderId = body.data?.id || body.data?.Order?.id;

        if (orderId) {
          // 2. Submit
          check(nodePost(`/orders/${orderId}/submit`, {}), {
            'submit succeeded': (r) => r.status === 200,
          });

          // 3. Prepare
          check(nodePost(`/orders/${orderId}/prepare`, {}), {
            'prepare succeeded': (r) => r.status === 200,
          });

          // 4. Ship
          check(nodePost(`/orders/${orderId}/ship`, {}), {
            'ship succeeded': (r) => r.status === 200,
          });

          // 5. Receive
          check(nodePost(`/orders/${orderId}/receive`, {
            lines: [{ id: 1, received_quantity: 10 }],
          }), {
            'receive succeeded': (r) => r.status === 200,
          });

          // 6. Complete (with idempotency, calling this twice from 2 VUs is safe)
          const completeRes = nodePost(`/orders/${orderId}/complete`, {});
          check(completeRes, {
            'complete succeeded': (r) => r.status === 200,
            'no double-complete error': (r) => r.status !== 409,
          });

          if (completeRes.status === 200) {
            orders_completed_total.add(1);
          } else if (completeRes.status === 400 && completeRes.body.includes('already')) {
            // Idempotent — already completed, this is the expected behavior
            orders_completed_total.add(1);
          }
        }
      } else if (createRes.status === 400 && createRes.body.includes('not allowed')) {
        // Transfer not allowed (B2 can't send) — skip, not an error
        transition_errors.add(1);
      }
    });
  }

  // ─── Group 5: Export (heavy — test async queue need) ────────────────────────
  group('Export (Heavy)', () => {
    // Laravel: summary export
    check(laravelGet('/summary?year=2026&month=3'), {
      'summary loads': (r) => r.status === 200,
    });
  });

  sleep(Math.random() * 2 + 0.5); // Simulate realistic think time (0.5–2.5s)
}

// ─── Teardown ─────────────────────────────────────────────────────────────────

export function handleSummary(data) {
  // Return custom summary data
  return {
    custom_data: {
      total_created:  data.metrics?.orders_created_total?.values?.count || 0,
      total_completed:data.metrics?.orders_completed_total?.values?.count || 0,
      double_complete: data.metrics?.double_complete_attempt?.values?.count || 0,
      errors:          data.metrics?.transition_errors?.values?.count || 0,
      avg_duration_ms: data.metrics?.http_req_duration?.values?.avg || 0,
      p95_duration_ms: data.metrics?.http_req_duration?.values?.['p(95)'] || 0,
    },
  };
}
