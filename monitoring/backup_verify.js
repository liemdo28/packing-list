require('dotenv').config();

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const mysql2 = require('mysql2/promise');
const { alert, info } = require('./alert');

const BACKUP_DIR  = process.env.BACKUP_DIR  || './backups';
const DB_HOST     = process.env.DB_HOST     || '127.0.0.1';
const DB_PORT     = process.env.DB_PORT     || '3306';
const DB_USER     = process.env.DB_USER     || 'root';
const DB_PASS     = process.env.DB_PASSWORD || '';
const DB_PROD     = process.env.DB_NAME     || 'packing_list';
const DB_TEST     = `${DB_PROD}_verify_tmp`;

const TABLES_TO_CHECK = ['users', 'stores', 'orders', 'order_lines', 'items'];

function latestBackupFile() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql'))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  if (!files.length) throw new Error('No backup files found');
  return path.join(BACKUP_DIR, files[0].name);
}

async function verifyBackup() {
  let conn;
  const backupFile = latestBackupFile();
  const passFlag   = DB_PASS ? `-p"${DB_PASS}"` : '';
  const connOpts   = { host: DB_HOST, port: parseInt(DB_PORT), user: DB_USER, password: DB_PASS };

  try {
    conn = await mysql2.createConnection(connOpts);

    // Create temp DB
    await conn.query(`DROP DATABASE IF EXISTS \`${DB_TEST}\``);
    await conn.query(`CREATE DATABASE \`${DB_TEST}\``);
    await conn.end();

    // Restore backup into temp DB
    execSync(
      `mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} ${passFlag} ${DB_TEST} < "${backupFile}"`,
      { shell: true }
    );

    // Connect to test DB and check row counts
    conn = await mysql2.createConnection({ ...connOpts, database: DB_TEST });
    const prodConn = await mysql2.createConnection({ ...connOpts, database: DB_PROD });

    const results = [];
    for (const table of TABLES_TO_CHECK) {
      const [[testRow]]  = await conn.query(`SELECT COUNT(*) AS c FROM \`${table}\``);
      const [[prodRow]]  = await prodConn.query(`SELECT COUNT(*) AS c FROM \`${table}\``);
      const match = testRow.c === prodRow.c;
      results.push({ table, backup: testRow.c, prod: prodRow.c, match });
    }

    await prodConn.end();

    // Drop temp DB
    await conn.query(`DROP DATABASE \`${DB_TEST}\``);

    const failed = results.filter(r => !r.match);
    const summary = results.map(r => `${r.table}: ${r.backup}/${r.prod}`).join(', ');

    if (failed.length > 0) {
      await alert({
        severity: 'HIGH',
        module:   'Backup Verify',
        error:    `Backup integrity mismatch on ${failed.length} table(s)`,
        reason:   failed.map(r => `${r.table}: backup=${r.backup} prod=${r.prod}`).join('; '),
        action:   'Run backup again and investigate if discrepancy persists',
      });
    } else {
      await info(`Backup verified OK — ${summary}`);
      console.log(`[backup_verify] ok — ${summary}`);
    }

    return results;
  } catch (err) {
    await alert({
      severity: 'HIGH',
      module:   'Backup Verify',
      error:    'Backup verification failed',
      reason:   err.message,
      action:   'Check mysqldump file integrity and temp DB creation permissions',
    });
    throw err;
  } finally {
    if (conn) await conn.end().catch(() => {});
    // Ensure cleanup
    try {
      const c = await mysql2.createConnection(connOpts);
      await c.query(`DROP DATABASE IF EXISTS \`${DB_TEST}\``);
      await c.end();
    } catch {}
  }
}

module.exports = { verifyBackup };
