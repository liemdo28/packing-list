require('dotenv').config(); // must be first — loads .env before any other module reads process.env

const { sequelize } = require('./models');
const { createApp } = require('./app');
const { ensureSyncTables, runSync, getLastSync } = require('./services/priceSyncService');

const app = createApp();
const PORT = process.env.PORT || 3001;

// ── Pricing scheduler ─────────────────────────────────────────────────────────
// Runs an automatic sync if more than SYNC_INTERVAL_MS has passed since the last
// successful sync. Checked every hour; does not require an external cron library.
const SYNC_INTERVAL_MS = parseInt(process.env.PRICING_SYNC_INTERVAL_MS || String(24 * 60 * 60 * 1000), 10);

async function scheduledSyncCheck() {
  try {
    const last = await getLastSync();
    const lastTime = last?.completed_at ? new Date(last.completed_at).getTime() : 0;
    const elapsed = Date.now() - lastTime;
    if (elapsed >= SYNC_INTERVAL_MS) {
      console.log('[price-sync] Scheduled sync starting (elapsed:', Math.round(elapsed / 3600000), 'h)');
      await runSync({ triggeredBy: 'scheduled' });
    }
  } catch (err) {
    console.error('[price-sync] Scheduled sync check failed:', err.message);
  }
}

// Start server
async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    if (process.argv.includes('--migrate')) {
      await sequelize.sync({ alter: true });
      console.log('Database migrated');
      process.exit(0);
    }

    await sequelize.sync();
    await ensureSyncTables();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    // Run an initial check shortly after startup, then every hour
    setTimeout(scheduledSyncCheck, 15_000);
    setInterval(scheduledSyncCheck, 60 * 60 * 1000);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
