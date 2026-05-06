require('dotenv').config();

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const { alert, info } = require('./alert');

const BACKUP_DIR      = process.env.BACKUP_DIR      || './backups';
const KEEP_DAYS       = parseInt(process.env.BACKUP_KEEP_DAYS || '30');
const MYSQLDUMP_PATH  = process.env.MYSQLDUMP_PATH  || 'mysqldump';

const DB_HOST = process.env.DB_HOST     || '127.0.0.1';
const DB_PORT = process.env.DB_PORT     || '3306';
const DB_NAME = process.env.DB_NAME     || 'packing_list';
const DB_USER = process.env.DB_USER     || 'root';
const DB_PASS = process.env.DB_PASSWORD || '';

function dateTag() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function pruneOldBackups() {
  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  const files  = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sql.gz') || f.endsWith('.sql'));
  for (const f of files) {
    const full = path.join(BACKUP_DIR, f);
    if (fs.statSync(full).mtimeMs < cutoff) {
      fs.unlinkSync(full);
      console.log(`[backup] pruned old backup: ${f}`);
    }
  }
}

async function runBackup() {
  ensureDir(BACKUP_DIR);
  const tag      = dateTag();
  const filename = `${DB_NAME}_${tag}.sql`;
  const outPath  = path.join(BACKUP_DIR, filename);

  const passEnv = DB_PASS ? `MYSQL_PWD="${DB_PASS}"` : '';

  try {
    const cmd = `${passEnv} ${MYSQLDUMP_PATH} -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} --single-transaction --quick --lock-tables=false ${DB_NAME} > "${outPath}"`;
    execSync(cmd, { shell: true });

    const sizeMb = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
    pruneOldBackups();

    await info(`Backup completed: ${filename} (${sizeMb}MB) — keeping ${KEEP_DAYS} days`);
    console.log(`[backup] ${filename} ${sizeMb}MB`);
    return { file: outPath, sizeMb: parseFloat(sizeMb) };
  } catch (err) {
    await alert({
      severity: 'CRITICAL',
      module:   'Backup',
      error:    'Daily backup FAILED',
      reason:   err.message,
      action:   'Check mysqldump is in PATH, DB credentials, and disk space',
    });
    throw err;
  }
}

module.exports = { runBackup };
