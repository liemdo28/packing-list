require('dotenv').config();

const axios = require('axios');
const { alert } = require('./alert');

const HEALTH_URL      = process.env.API_HEALTH_URL || `${process.env.API_BASE_URL}/health`;
const FAIL_THRESHOLD  = 2;
const TIMEOUT_MS      = 10_000;

let consecutiveFails = 0;

async function checkHealth() {
  try {
    const start = Date.now();
    const res   = await axios.get(HEALTH_URL, { timeout: TIMEOUT_MS });
    const ms    = Date.now() - start;
    const data  = res.data;

    consecutiveFails = 0;

    if (data.status !== 'ok' || data.db?.status !== 'ok') {
      await alert({
        severity: 'HIGH',
        module:   'Health Check',
        error:    `Health endpoint degraded — status: ${data.status}, db: ${data.db?.status}`,
        endpoint: `GET ${HEALTH_URL}`,
        reason:   `DB latency: ${data.db?.latencyMs}ms`,
        action:   'Check DB connection and backend logs',
      });
      return;
    }

    if (data.db?.latencyMs > 500) {
      await alert({
        severity: 'WARNING',
        module:   'Health Check',
        error:    `DB response slow: ${data.db.latencyMs}ms`,
        endpoint: `GET ${HEALTH_URL}`,
        reason:   'DB query latency above 500ms threshold',
        action:   'Monitor DB load; consider restarting if sustained',
      });
    }

    console.log(`[health] ok — ${ms}ms — db ${data.db?.latencyMs}ms`);
  } catch (err) {
    consecutiveFails++;
    console.error(`[health] FAIL #${consecutiveFails}: ${err.message}`);

    if (consecutiveFails >= FAIL_THRESHOLD) {
      await alert({
        severity: 'CRITICAL',
        module:   'Health Check',
        error:    `API unreachable (${consecutiveFails} consecutive failures)`,
        endpoint: `GET ${HEALTH_URL}`,
        reason:   err.message,
        action:   'Check if backend process is running and Cloudflare Tunnel is active',
      });
    }
  }
}

module.exports = { checkHealth };
