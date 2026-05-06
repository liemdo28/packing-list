require('dotenv').config();

const mysql2 = require('mysql2/promise');

const pool = mysql2.createPool({
  host:            process.env.DB_HOST     || '127.0.0.1',
  port:            parseInt(process.env.DB_PORT || '3306'),
  database:        process.env.DB_NAME     || 'packing_list',
  user:            process.env.DB_USER     || 'root',
  password:        process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 5,
});

const MAX_HISTORY = 10; // messages to keep in context window

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bot_sessions (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      telegram_id     BIGINT NOT NULL UNIQUE,
      user_id         INT,
      store_id        INT,
      role            VARCHAR(20),
      full_name       VARCHAR(100),
      api_token       TEXT,
      pending_action  JSON,
      updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bot_messages (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      telegram_id BIGINT NOT NULL,
      role        ENUM('user','assistant') NOT NULL,
      content     TEXT NOT NULL,
      intent      VARCHAR(50),
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tid (telegram_id)
    )
  `);
}

async function getSession(telegramId) {
  const [[row]] = await pool.query('SELECT * FROM bot_sessions WHERE telegram_id = ?', [telegramId]);
  return row || null;
}

async function upsertSession(telegramId, data) {
  await pool.query(`
    INSERT INTO bot_sessions (telegram_id, user_id, store_id, role, full_name, api_token)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      user_id = VALUES(user_id),
      store_id = VALUES(store_id),
      role = VALUES(role),
      full_name = VALUES(full_name),
      api_token = VALUES(api_token)
  `, [telegramId, data.user_id, data.store_id, data.role, data.full_name, data.api_token]);
}

async function setPendingAction(telegramId, action) {
  await pool.query(
    'UPDATE bot_sessions SET pending_action = ? WHERE telegram_id = ?',
    [JSON.stringify(action), telegramId]
  );
}

async function clearPendingAction(telegramId) {
  await pool.query(
    'UPDATE bot_sessions SET pending_action = NULL WHERE telegram_id = ?',
    [telegramId]
  );
}

async function clearSession(telegramId) {
  await pool.query('DELETE FROM bot_sessions WHERE telegram_id = ?', [telegramId]);
  await pool.query('DELETE FROM bot_messages WHERE telegram_id = ?', [telegramId]);
}

async function addMessage(telegramId, role, content, intent = null) {
  await pool.query(
    'INSERT INTO bot_messages (telegram_id, role, content, intent) VALUES (?, ?, ?, ?)',
    [telegramId, role, content, intent]
  );
}

async function getHistory(telegramId) {
  const [rows] = await pool.query(`
    SELECT role, content FROM bot_messages
    WHERE telegram_id = ?
    ORDER BY created_at DESC
    LIMIT ${MAX_HISTORY}
  `, [telegramId]);
  return rows.reverse(); // chronological order
}

module.exports = {
  ensureTables,
  getSession,
  upsertSession,
  setPendingAction,
  clearPendingAction,
  clearSession,
  addMessage,
  getHistory,
};
