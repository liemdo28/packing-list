require('dotenv').config();

const axios = require('axios');
const { upsertSession, clearSession, getSession } = require('../ai/session');

const API_BASE = process.env.API_BASE_URL;

// Map: telegramId -> { username, awaitingPassword }
const loginState = new Map();

/**
 * Handle /start command
 */
async function handleStart(bot, msg) {
  const { id: telegramId, first_name } = msg.from;
  const session = await getSession(telegramId);

  if (session?.api_token) {
    return bot.sendMessage(msg.chat.id,
      `Welcome back, ${session.full_name}!\n\nYou are connected as: ${session.role.toUpperCase()}\n\nWhat can I help you with?\n• Show my tasks\n• Show pending orders\n• Open task list\n• Show delayed orders`
    );
  }

  bot.sendMessage(msg.chat.id,
    `Hello ${first_name}! I'm the Store Operations Assistant.\n\nTo get started, use /login to connect your account.`
  );
}

/**
 * Handle /login command — initiates 2-step login flow
 */
async function handleLogin(bot, msg) {
  const telegramId = msg.from.id;
  bot.sendMessage(msg.chat.id, 'Please enter your username:');
  loginState.set(telegramId, { step: 'username' });
}

/**
 * Handle /logout command
 */
async function handleLogout(bot, msg) {
  const telegramId = msg.from.id;
  await clearSession(telegramId);
  loginState.delete(telegramId);
  bot.sendMessage(msg.chat.id, 'You have been logged out.');
}

/**
 * Handle /status command — quick system status
 */
async function handleStatus(bot, msg) {
  const telegramId = msg.from.id;
  const session    = await getSession(telegramId);

  if (!session?.api_token) {
    return bot.sendMessage(msg.chat.id, 'Not logged in. Use /login first.');
  }

  try {
    const res  = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
    const data = res.data;
    bot.sendMessage(msg.chat.id,
      `System Status\n• API: ${data.status === 'ok' ? '✅' : '⚠️'} ${data.status}\n• DB: ${data.db?.status === 'ok' ? '✅' : '⚠️'} ${data.db?.status} (${data.db?.latencyMs}ms)\n• Uptime: ${data.uptime}s`
    );
  } catch {
    bot.sendMessage(msg.chat.id, '⚠️ System status check failed — backend may be unreachable.');
  }
}

/**
 * Handle /help command
 */
async function handleHelp(bot, msg) {
  bot.sendMessage(msg.chat.id,
    `Available commands:\n\n/start — Welcome message\n/login — Connect your account\n/logout — Disconnect\n/status — System health\n/help — This message\n\nYou can also ask me in natural language:\n• "Show my pending orders"\n• "What should I do next?"\n• "Why is order 123 blocked?"\n• "Show delayed orders"\n• "Open the task list"`
  );
}

/**
 * Handle login conversation flow (username → password)
 * Returns true if handled, false if not part of login flow
 */
async function handleLoginFlow(bot, msg) {
  const telegramId = msg.from.id;
  const state      = loginState.get(telegramId);
  if (!state) return false;

  const text = msg.text?.trim();

  if (state.step === 'username') {
    loginState.set(telegramId, { step: 'password', username: text });
    bot.sendMessage(msg.chat.id, 'Now enter your password:');
    return true;
  }

  if (state.step === 'password') {
    loginState.delete(telegramId);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        username: state.username,
        password: text,
      });
      const { token, user } = res.data.data;
      await upsertSession(telegramId, {
        user_id:   user.id,
        store_id:  user.store_id,
        role:      user.role,
        full_name: user.full_name,
        api_token: token,
      });
      bot.sendMessage(msg.chat.id,
        `✅ Logged in as ${user.full_name} (${user.role.toUpperCase()})\n\nYou can now ask me about your tasks and orders.`
      );
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Login failed';
      bot.sendMessage(msg.chat.id, `❌ ${errMsg}\n\nUse /login to try again.`);
    }
    return true;
  }

  return false;
}

module.exports = { handleStart, handleLogin, handleLogout, handleStatus, handleHelp, handleLoginFlow };
