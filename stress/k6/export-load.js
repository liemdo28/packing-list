/**
 * stress/k6/export-load.js
 *
 * Export load test — validates Excel and PDF export stability under concurrent load.
 *
 * Run:  k6 run stress/k6/export-load.js
 *
 * Validates:
 *   - Server stays responsive during multiple concurrent export requests
 *   - No timeout or 500 errors on export endpoints
 *   - p95 export response < 10s (anything >10s = candidate for async queue)
 *
 * Note: this test does not verify the file content, only the API response stability.
 * Content validation should be done in integration tests.
 */

import { check, sleep } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';
import {
  BASE_URL, jsonHeaders, safeJson, loginAdmin, loginAccountant,
  STORE_IDS,
} from './_helpers.js';

export const options = {
  // 5-20 concurrent export requests
  stages: [
    { duration: '30s', target: 5  },
    { duration: '2m',  target: 15 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<10000'],   // Exports are heavy; 10s is reasonable
    'http_req_failed':  ['rate<0.05'],      // < 5% errors
    'export_success_total': ['count>0'],
  },
};

const exportSuccessTotal = new Counter('export_success_total');

export default function () {
  const token = loginAccountant() || loginAdmin();
  if (!token) return;

  const year  = parseInt(__ENV.YEAR  || String(new Date().getFullYear()), 10);
  const month = parseInt(__ENV.MONTH || String(new Date().getMonth() + 1), 10);

  // ── Excel summary export ───────────────────────────────────────────────────
  const excelRes = http.get(
    `${BASE_URL}/export/summary/excel?year=${year}&month=${month}`,
    { headers: jsonHeaders(token) }
  );

  check(excelRes, {
    'excel export returns 200':         (r) => r.status === 200,
    'excel export returns non-empty body': (r) => r.body && r.body.length > 100,
    'excel content-type is spreadsheet': (r) =>
      r.headers['Content-Type']?.includes('spreadsheet') ||
      r.headers['Content-Type']?.includes('excel') ||
      r.headers['Content-Type']?.includes('octet-stream'),
  });

  if (excelRes.status === 200) exportSuccessTotal.add(1);

  // ── PDF summary export ────────────────────────────────────────────────────
  const pdfRes = http.get(
    `${BASE_URL}/export/summary/pdf?year=${year}&month=${month}`,
    { headers: jsonHeaders(token) }
  );

  check(pdfRes, {
    'pdf export returns 200 or 302 (redirect)': (r) => r.status === 200 || r.status === 302,
  });

  if (pdfRes.status === 200) exportSuccessTotal.add(1);

  // ── Pair summary export ───────────────────────────────────────────────────
  const pairRes = http.get(
    `${BASE_URL}/summary/pair/B1/B2?year=${year}&month=${month}`,
    { headers: jsonHeaders(token) }
  );

  check(pairRes, {
    'pair summary returns 200': (r) => r.status === 200,
  });

  // ── Yearly export ─────────────────────────────────────────────────────────
  const yearlyRes = http.get(
    `${BASE_URL}/summary/yearly?year=${year}`,
    { headers: jsonHeaders(token) }
  );

  check(yearlyRes, {
    'yearly summary returns 200': (r) => r.status === 200,
  });

  sleep(Math.random() * 2 + 0.5);
}