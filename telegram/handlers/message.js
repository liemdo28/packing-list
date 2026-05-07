const { handleLoginFlow } = require('./command');
const { processMessage }  = require('../ai/assistant');
const { getSession }      = require('../ai/session');

// Simple in-memory per-user rate limit: max 10 messages per minute
const msgCount = new Map();
setInterval(() => msgCount.clear(), 60_000);

// Guard: validate message is non-empty before processing
function isValidMessage(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  return trimmed.length > 0;
}

async function handleMessage(bot, msg) {
  if (!msg.text) return;

  // Guard: reject empty/whitespace-only messages at entry point
  if (!isValidMessage(msg.text)) {
    bot.sendMessage(msg.chat.id, 'Please send a valid message (not empty or whitespace only).');
    return;
  }

  const telegramId = msg.from.id;
  const chatId     = msg.chat.id;

  // Rate limit check
  const count = (msgCount.get(telegramId) || 0) + 1;
  msgCount.set(telegramId, count);
  if (count > 10) {
    if (count === 11) bot.sendMessage(chatId, 'Slow down — please wait before sending more messages.');
    return;
  }

  // Handle login flow first
  const handledByLogin = await handleLoginFlow(bot, msg);
  if (handledByLogin) return;

  const session = await getSession(telegramId);
  if (!session?.api_token) {
    return bot.sendMessage(chatId, 'Please /login first to use the assistant.');
  }

  // Show typing indicator
  bot.sendChatAction(chatId, 'typing');

  try {
    const reply = await processMessage(telegramId, msg.text);
    bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error('[message] Error processing message:', err.message);
    bot.sendMessage(chatId, 'Something went wrong. Please try again or contact Admin.');
  }
}

module.exports = { handleMessage };
