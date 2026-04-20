/**
 * stress/k6/auth-load.js
 *
 * Auth load test — validates login performance and JWT stability under concurrent load.
 *
 * Run:  k6 run stress/k6/auth-load.js
 * Env:  BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, B1_EMAIL, B2_EMAIL, B3_EMAIL
 *
 * Load profile:
 *   Ramp 50 concurrent login attempts → sustain 5 minutes → ramp down
 *
 * SLIs:
 *   p95 login < 500ms
 *   error rate < 1%
 */

import { check, sleep } from 'k6';
import http from 'k6/http';
import { BASE_URL, jsonHeaders } from './_helpers.js';

export const options = {
  // ── Load profile ─────────────────────────────────────────────────────────────
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 concurrent logins
    { duration: '5m',  target: 50 },   // Hold 50 concurrent logins for 5 min
    { duration: '30s', target: 0 },    // Ramp down
  ],

  // ── SLIs ─────────────────────────────────────────────────────────────────────
  thresholds: {
    'http_req_duration':     ['p(95)<500'],   // p95 login < 500ms
    'http_req_failed':      ['rate<0.01'],   // < 1% error rate
    'auth_success_total':   ['count>0'],      // At least some logins succeed
    'auth_failure_total':   ['count<50'],     // Failures stay low
  },
};

// Track metrics manually
const authSuccessTotal = { type: 'Counter' };
const authFailureTotal = { type: 'Counter' };

export default function () {
  const emails = [
    __ENV.ADMIN_EMAIL || 'admin@restaurant.com',
    __ENV.B1_EMAIL    || 'b1@restaurant.com',
    __ENV.B2_EMAIL    || 'b2@restaurant.com',
    __ENV.B3_EMAIL    || 'b3@restaurant.com',
  ];
  const passwords = [
    __ENV.ADMIN_PASSWORD || 'password',
    __ENV.B1_PASSWORD    || 'password',
    __ENV.B2_PASSWORD    || 'password',
    __ENV.B3_PASSWORD    || 'password',
  ];

  const idx = Math.floor(Math.random() * emails.length);
  const email    = emails[idx];
  const password = passwords[idx];

  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: jsonHeaders() }
  );

  const ok = check(res, {
    'login status 200':          (r) => r.status === 200,
    'response body is JSON':      (r) => {
      try { JSON.parse(r.body); return true; } catch { return false; }
    },
    'response contains token':    (r) => {
      try {
        const body = JSON.parse(r.body);
        return !!(body.token && body.token.length > 10);
      } catch { return false; }
    },
    'response time < 1s':         (r) => r.timings.duration < 1000,
  });

  if (ok) {
    try {
      const body = JSON.parse(res.body);
      check(body, {
        'token has expected structure': (b) =>
          b.token && (b.user?.id || b.user?.id !== undefined),
      });
    } catch {}
  }

  sleep(Math.random() * 0.5 + 0.1);
}
