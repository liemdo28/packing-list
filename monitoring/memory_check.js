require('dotenv').config();

const axios  = require('axios');
const { alert } = require('./alert');

const FULL_URL     = process.env.API_HEALTH_FULL_URL
                  || `${(process.env.API_BASE_URL || '').replace(/\/$/, '')}/health/full`;
const HEAP_WARN_MB = parseInt(process.env.MEMORY_WARN_MB  || '400', 10);
const HEAP_CRIT_MB = parseInt(process.env.MEMORY_CRIT_MB  || '700', 10);
const TIMEOUT_MS   = 8_000;

async function checkMemory() {
  try {
    const res  = await axios.get(FULL_URL, { timeout: TIMEOUT_MS });
    const mem  = res.data?.memory;
    if (!mem) return; // endpoint not available yet

    const heap = mem.heapUsedMB;

    if (heap >= HEAP_CRIT_MB) {
      await alert({
        severity: 'CRITICAL',
        module:   'Memory',
        error:    `Heap usage critical: ${heap} MB`,
        reason:   `Threshold: ${HEAP_CRIT_MB} MB`,
        action:   'Restart packing-api with: pm2 restart packing-api',
      });
    } else if (heap >= HEAP_WARN_MB) {
      await alert({
        severity: 'WARNING',
        module:   'Memory',
        error:    `Heap usage high: ${heap} MB`,
        reason:   `Threshold: ${HEAP_WARN_MB} MB`,
        action:   'Monitor; restart if sustained above threshold',
      });
    } else {
      console.log(`[memory] ok — heap ${heap} MB / rss ${mem.rssMB} MB`);
    }
  } catch (err) {
    // /health/full unreachable → health_check will cover the outage alert
    console.warn('[memory] /health/full unreachable:', err.message);
  }
}

module.exports = { checkMemory };
