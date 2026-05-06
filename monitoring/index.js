require('dotenv').config();

const cron = require('node-cron');
const { checkHealth }   = require('./health_check');
const { watchdog }      = require('./db_watchdog');
const { checkDisk }     = require('./disk_check');
const { runSmokeFlow }  = require('./smoke_flow');
const { runBackup }     = require('./backup');
const { verifyBackup }  = require('./backup_verify');
const { info }          = require('./alert');

console.log('[monitoring] Starting production monitoring daemon...');

// Every 5 minutes — health endpoint + DB watchdog
cron.schedule('*/5 * * * *', async () => {
  await checkHealth();
  await watchdog();
});

// Every 15 minutes — smoke flow
cron.schedule('*/15 * * * *', async () => {
  await runSmokeFlow();
});

// Every 15 minutes — disk check
cron.schedule('*/15 * * * *', async () => {
  await checkDisk();
});

// Daily at 02:00 — backup
cron.schedule('0 2 * * *', async () => {
  console.log('[monitoring] Running daily backup...');
  await runBackup();
});

// Weekly Sunday at 03:00 — backup verification
cron.schedule('0 3 * * 0', async () => {
  console.log('[monitoring] Running weekly backup verification...');
  await verifyBackup();
});

// Startup — immediate checks
(async () => {
  await info('Monitoring daemon started');
  await checkHealth();
  await watchdog();
  await checkDisk();
})();

process.on('uncaughtException',  err => console.error('[monitoring] Uncaught:', err));
process.on('unhandledRejection', err => console.error('[monitoring] Unhandled rejection:', err));
