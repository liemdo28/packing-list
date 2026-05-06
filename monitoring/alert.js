require('dotenv').config();

const axios    = require('axios');
const nodemailer = require('nodemailer');

const ENV = process.env.APP_ENV || 'production';

// ── Telegram ────────────────────────────────────────────────────────────────

async function sendTelegram(text) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    });
  } catch (err) {
    console.error('[alert] Telegram send failed:', err.message);
  }
}

// ── Email ────────────────────────────────────────────────────────────────────

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

async function sendEmail(subject, body) {
  const to = process.env.ALERT_EMAIL_TO;
  if (!to || !process.env.SMTP_USER) return;
  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: `[${ENV}] ${subject}`,
      text: body,
    });
  } catch (err) {
    console.error('[alert] Email send failed:', err.message);
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Send a structured alert to all channels.
 *
 * @param {object} opts
 * @param {'CRITICAL'|'HIGH'|'WARNING'|'INFO'} opts.severity
 * @param {string} opts.module
 * @param {string} opts.error
 * @param {string} [opts.endpoint]
 * @param {string} [opts.reason]
 * @param {string} [opts.action]
 * @param {string|number} [opts.entityId]
 */
async function alert({ severity = 'HIGH', module, error, endpoint, reason, action, entityId }) {
  const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' });

  const lines = [
    `[${ENV.toUpperCase()} ${severity}]`,
    `Module: ${module}`,
    `Error: ${error}`,
  ];
  if (entityId)  lines.push(`Entity: ${entityId}`);
  if (endpoint)  lines.push(`API: ${endpoint}`);
  lines.push(`Time: ${now} UTC+7`);
  if (reason)    lines.push(`Reason: ${reason}`);
  if (action)    lines.push(`Action: ${action}`);

  const text = lines.join('\n');
  console.error(`[ALERT] ${text.replace(/\n/g, ' | ')}`);

  await Promise.all([
    sendTelegram(`<pre>${text}</pre>`),
    sendEmail(`${severity}: ${module} — ${error}`, text),
  ]);
}

async function info(message) {
  const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' });
  const text = `[${ENV.toUpperCase()} INFO] ${message}\nTime: ${now} UTC+7`;
  console.log(`[INFO] ${message}`);
  await sendTelegram(`<pre>${text}</pre>`);
}

module.exports = { alert, info };
