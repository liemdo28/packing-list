require('dotenv').config();

const { exec } = require('child_process');
const { checkDbHealth } = require('./db_health');
const { alert, info } = require('./alert');

const FAIL_THRESHOLD    = parseInt(process.env.DB_FAIL_THRESHOLD || '3');
const RESTART_COMMAND   = process.env.DB_RESTART_COMMAND || 'net stop mysql80 && net start mysql80';
const RESTART_WAIT_MS   = 12_000;

let consecutiveFails    = 0;
let restartInProgress   = false;

function execRestart() {
  return new Promise((resolve, reject) => {
    exec(RESTART_COMMAND, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

async function watchdog() {
  if (restartInProgress) return;

  const result = await checkDbHealth();

  if (result.ok) {
    if (consecutiveFails > 0) {
      await info(`DB recovered after ${consecutiveFails} failure(s)`);
    }
    consecutiveFails = 0;
    return;
  }

  consecutiveFails++;
  console.error(`[watchdog] DB fail #${consecutiveFails}`);

  if (consecutiveFails >= FAIL_THRESHOLD) {
    restartInProgress = true;
    await alert({
      severity: 'CRITICAL',
      module:   'DB Watchdog',
      error:    `DB unreachable for ${consecutiveFails} consecutive checks — attempting auto-restart`,
      action:   RESTART_COMMAND,
    });

    try {
      await execRestart();
      await new Promise(r => setTimeout(r, RESTART_WAIT_MS));

      const after = await checkDbHealth();
      if (after.ok) {
        await info(`DB auto-restart succeeded after ${consecutiveFails} failures`);
        consecutiveFails = 0;
      } else {
        await alert({
          severity: 'CRITICAL',
          module:   'DB Watchdog',
          error:    'DB restart FAILED — manual intervention required',
          reason:   'DB still unreachable after restart attempt',
          action:   'Log into the server immediately and investigate MySQL/Postgres service',
        });
      }
    } catch (err) {
      await alert({
        severity: 'CRITICAL',
        module:   'DB Watchdog',
        error:    'DB restart command failed',
        reason:   err.message,
        action:   'Manual restart required — check service permissions and DB_RESTART_COMMAND env var',
      });
    } finally {
      restartInProgress = false;
    }
  }
}

module.exports = { watchdog };
