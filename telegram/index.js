require('dotenv').config();

const { ensureTables } = require('./ai/session');
const { createBot }    = require('./bot');

async function start() {
  try {
    await ensureTables();
    console.log('[telegram] Session tables ready');

    createBot();
  } catch (err) {
    console.error('[telegram] Startup failed:', err.message);
    process.exit(1);
  }
}

start();

process.on('uncaughtException',  err => console.error('[telegram] Uncaught:', err));
process.on('unhandledRejection', err => console.error('[telegram] Rejection:', err));
