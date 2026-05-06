require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const { handleStart, handleLogin, handleLogout, handleStatus, handleHelp } = require('./handlers/command');
const { handleMessage }  = require('./handlers/message');
const { handleCallback } = require('./handlers/callback');

function createBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');

  const bot = new TelegramBot(token, { polling: true });

  // ── Commands ───────────────────────────────────────────────────────────────
  bot.onText(/\/start/,  msg => handleStart(bot, msg));
  bot.onText(/\/login/,  msg => handleLogin(bot, msg));
  bot.onText(/\/logout/, msg => handleLogout(bot, msg));
  bot.onText(/\/status/, msg => handleStatus(bot, msg));
  bot.onText(/\/help/,   msg => handleHelp(bot, msg));

  // ── All text messages (non-command) ───────────────────────────────────────
  bot.on('message', msg => {
    if (!msg.text) return;
    if (msg.text.startsWith('/')) return; // already handled above
    handleMessage(bot, msg);
  });

  // ── Inline keyboard callbacks ──────────────────────────────────────────────
  bot.on('callback_query', query => handleCallback(bot, query));

  // ── Error handling ─────────────────────────────────────────────────────────
  bot.on('polling_error', err => {
    console.error('[bot] Polling error:', err.message);
  });

  bot.on('error', err => {
    console.error('[bot] Error:', err.message);
  });

  console.log('[bot] Bot started and polling...');
  return bot;
}

module.exports = { createBot };
