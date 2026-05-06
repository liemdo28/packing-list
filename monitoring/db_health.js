require('dotenv').config();

const mysql2  = require('mysql2/promise');
const { alert } = require('./alert');

const config = {
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME     || 'packing_list',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  connectTimeout: 8000,
};

async function checkDbHealth() {
  let conn;
  try {
    const start = Date.now();
    conn        = await mysql2.createConnection(config);
    await conn.query('SELECT 1');
    const latencyMs = Date.now() - start;

    const [[sizeRow]] = await conn.query(`
      SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 1) AS mb
      FROM information_schema.tables
      WHERE table_schema = ?
    `, [config.database]);
    const sizeMb = sizeRow?.mb || 0;

    if (latencyMs > 2000) {
      await alert({
        severity: 'CRITICAL',
        module:   'DB Health',
        error:    `DB very slow: ${latencyMs}ms`,
        reason:   'Query latency above 2000ms — may indicate lock contention or disk I/O issues',
        action:   'Check SHOW PROCESSLIST; consider restarting DB if sustained',
      });
    } else if (latencyMs > 500) {
      await alert({
        severity: 'WARNING',
        module:   'DB Health',
        error:    `DB slow: ${latencyMs}ms`,
        reason:   'Query latency above 500ms threshold',
        action:   'Monitor for sustained slowness',
      });
    }

    console.log(`[db_health] ok — ${latencyMs}ms — ${sizeMb}MB`);
    return { ok: true, latencyMs, sizeMb };
  } catch (err) {
    await alert({
      severity: 'CRITICAL',
      module:   'DB Health',
      error:    'Database unreachable',
      reason:   err.message,
      action:   'Check if MySQL/Postgres is running; watchdog will attempt auto-restart',
    });
    return { ok: false, error: err.message };
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}

module.exports = { checkDbHealth };
