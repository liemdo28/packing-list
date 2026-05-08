/**
 * stress/k6/auth-load.js
 *
 * Auth load test — validates login performance and JWT stability under concurrent load.
 *
 * Run:  k6 run stress/k6/auth-load.js
 * Env:  BASE_URL, ADMIN_USER, ADMIN_PASSWORD, B1_USER, B2_USER, B3_USER
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
import { Counter } from 'k6/metrics';
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
    'http_req_duration': ['p(95)<500'],   // p95 login < 500ms
    'http_req_failed':   ['rate<0.01'],   // < 1% error rate
    'auth_success':      ['count>0'],     // At least some logins succeed
  },
};

const authSuccess = new Counter('auth_success');
const authFailure = new Counter('auth_failure');

export default function () {
  const users = [
    __ENV.ADMIN_USER || 'admin',
    __ENV.B1_USER    || 'user_b1',
    __ENV.B2_USER    || 'user_b2',
    __ENV.B3_USER    || 'user_b3',
  ];
  const passwords = [
    __ENV.ADMIN_PASSWORD || 'password',
    __ENV.B1_PASSWORD    || 'password',
    __ENV.B2_PASSWORD    || 'password',
    __ENV.B3_PASSWORD    || 'password',
  ];

  const idx      = Math.floor(Math.random() * users.length);
  const username = users[idx];
  const password = passwords[idx];

  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ username, password }),
    { headers: jsonHeaders() }
  );

  const ok = check(res, {
    'login status 200':       (r) => r.status === 200,
    'response body is JSON':  (r) => {
      try { JSON.parse(r.body); return true; } catch { return false; }
    },
    'response contains token': (r) => {
      try {
        const b = JSON.parse(r.body);
        const token = b.data?.token || b.token;
        return !!(token && token.length > 10);
      } catch { return false; }
    },
    'response time < 1s':     (r) => r.timings.duration < 1000,
  });

  if (ok) {
    authSuccess.add(1);
    try {
      const b = JSON.parse(res.body);
      const token = b.data?.token || b.token;
      const user  = b.data?.user  || b.user;
      check({ token, user }, {
        'token has expected structure': (d) => !!(d.token && d.user?.id),
      });
    } catch {}
  } else {
    authFailure.add(1);
  }

  sleep(Math.random() * 0.5 + 0.1);
}
