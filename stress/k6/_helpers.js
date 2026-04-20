/**
 * stress/k6/_helpers.js
 *
 * Shared helper functions for k6 stress test scripts.
 * Import this from every test script to keep auth and request logic DRY.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

// ─── Base config (read from env, fall back to defaults) ──────────────────────

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api';
export const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@restaurant.com';
export const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'password';
export const B1_EMAIL = __ENV.B1_EMAIL || 'b1@restaurant.com';
export const B1_PASSWORD = __ENV.B1_PASSWORD || 'password';
export const B2_EMAIL = __ENV.B2_EMAIL || 'b2@restaurant.com';
export const B2_PASSWORD = __ENV.B2_PASSWORD || 'password';
export const B3_EMAIL = __ENV.B3_EMAIL || 'b3@restaurant.com';
export const B3_PASSWORD = __ENV.B3_PASSWORD || 'password';

// Store IDs (adjust to match seeded data)
export const STORE_IDS = {
  b1: parseInt(__ENV.STORE_ID_B1 || '1', 10),
  b2: parseInt(__ENV.STORE_ID_B2 || '2', 10),
  b3: parseInt(__ENV.STORE_ID_B3 || '3', 10),
};

// Test item IDs (adjust to match seeded items)
export const ITEM_IDS = {
  item1: parseInt(__ENV.ITEM_ID_1 || '1', 10),
  item2: parseInt(__ENV.ITEM_ID_2 || '2', 10),
  item3: parseInt(__ENV.ITEM_ID_3 || '3', 10),
};

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

export function jsonHeaders(token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return { headers };
}

export function get(url, token = null) {
  const res = http.get(`${BASE_URL}${url}`, { headers: jsonHeaders(token) });
  return res;
}

export function post(url, body = {}, token = null) {
  const res = http.post(
    `${BASE_URL}${url}`,
    JSON.stringify(body),
    { headers: jsonHeaders(token) }
  );
  return res;
}

export function put(url, body = {}, token = null) {
  const res = http.put(
    `${BASE_URL}${url}`,
    JSON.stringify(body),
    { headers: jsonHeaders(token) }
  );
  return res;
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/**
 * Login and return the JWT token string.
 * Caches per-VU token to avoid re-authenticating on every request.
 */
const _vuTokens = {};

export function login(email, password) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: jsonHeaders() }
  );

  check(res, {
    [`login ok for ${email}`]: (r) => r.status === 200,
    'login returns token': (r) => {
      try { return !!JSON.parse(r.body).token; } catch { return false; }
    },
  });

  let body;
  try {
    body = JSON.parse(res.body);
  } catch {
    return null;
  }

  // Cache per VU to avoid re-auth on every iteration
  const vu = __VU ? String(__VU) : 'default';
  if (body.token) _vuTokens[vu] = body.token;
  return body.token || null;
}

/**
 * Get the cached token for the current VU.
 * Returns null if login() hasn't been called yet.
 */
export function getToken() {
  const vu = __VU ? String(__VU) : 'default';
  return _vuTokens[vu] || null;
}

/**
 * Login as admin and return token. Cached per VU.
 */
export function loginAdmin() { return login(ADMIN_EMAIL, ADMIN_PASSWORD); }
export function loginB1()    { return login(B1_EMAIL, B1_PASSWORD); }
export function loginB2()    { return login(B2_EMAIL, B2_PASSWORD); }
export function loginB3()    { return login(B3_EMAIL, B3_PASSWORD); }

// ─── JSON helpers ─────────────────────────────────────────────────────────────

export function safeJson(res) {
  try { return JSON.parse(res.body); } catch { return null; }
}

/**
 * Follow a URL in the response Location header.
 * Useful for Laravel session-based redirects.
 */
export function followRedirect(res, token = null) {
  const location = res.headers['Location'] || res.headers['location'];
  if (!location) return res;
  return http.get(location, { headers: jsonHeaders(token), redirects: 0 });
}

// ─── Convenience ───────────────────────────────────────────────────────────────

export function pause(min = 0.2, max = 1.0) {
  sleep(Math.random() * (max - min) + min);
}

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a unique note suffix to prevent false-negative uniqueness violations
 * when multiple VUs create orders simultaneously.
 */
export function uniqueNote(prefix = 'stress') {
  return `${prefix}-${Date.now()}-VU${__VU || 0}`;
}