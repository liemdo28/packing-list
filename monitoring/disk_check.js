require('dotenv').config();

const { execSync } = require('child_process');
const path  = require('path');
const { alert } = require('./alert');

const DISK_PATH     = process.env.DISK_CHECK_PATH || 'C:';
const WARN_PCT      = parseInt(process.env.DISK_WARN_PERCENT     || '80');
const CRITICAL_PCT  = parseInt(process.env.DISK_CRITICAL_PERCENT || '95');

function getDiskUsage(drivePath) {
  try {
    if (process.platform === 'win32') {
      // wmic logicaldisk where DeviceID="C:" get FreeSpace,Size /format:csv
      const drive = drivePath.replace(':', '').toUpperCase() + ':';
      const out = execSync(
        `wmic logicaldisk where "DeviceID='${drive}'" get FreeSpace,Size /format:csv`,
        { encoding: 'utf8' }
      );
      const lines = out.trim().split('\n').filter(l => l.includes(','));
      if (!lines[1]) throw new Error('wmic output unexpected');
      const [, free, total] = lines[1].trim().split(',');
      return { free: parseInt(free), total: parseInt(total) };
    } else {
      // Linux/Mac: df -B1 /
      const out = execSync(`df -B1 ${drivePath}`, { encoding: 'utf8' });
      const lines = out.trim().split('\n');
      const parts = lines[1].split(/\s+/);
      const total = parseInt(parts[1]);
      const used  = parseInt(parts[2]);
      return { free: total - used, total };
    }
  } catch (err) {
    throw new Error(`Disk check failed: ${err.message}`);
  }
}

async function checkDisk() {
  try {
    const { free, total } = getDiskUsage(DISK_PATH);
    const usedPct = Math.round(((total - free) / total) * 100);
    const freeMb  = Math.round(free / 1024 / 1024);

    console.log(`[disk] ${DISK_PATH} — ${usedPct}% used, ${freeMb}MB free`);

    if (usedPct >= CRITICAL_PCT) {
      await alert({
        severity: 'CRITICAL',
        module:   'Disk Monitor',
        error:    `Disk critically full: ${usedPct}% used (${freeMb}MB free)`,
        reason:   `Drive ${DISK_PATH} above ${CRITICAL_PCT}% threshold`,
        action:   'Free disk space immediately — check DB data folder, logs, and temp files',
      });
    } else if (usedPct >= WARN_PCT) {
      await alert({
        severity: 'WARNING',
        module:   'Disk Monitor',
        error:    `Disk filling up: ${usedPct}% used (${freeMb}MB free)`,
        reason:   `Drive ${DISK_PATH} above ${WARN_PCT}% threshold`,
        action:   'Review disk usage — clean old logs and backups',
      });
    }

    return { usedPct, freeMb };
  } catch (err) {
    console.error(`[disk] check error: ${err.message}`);
    return { error: err.message };
  }
}

module.exports = { checkDisk };
