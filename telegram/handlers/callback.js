const { getSession, setPendingAction, clearPendingAction } = require('../ai/session');

/**
 * Handle inline keyboard button callbacks.
 * Callback data format: "action:payload" e.g. "confirm_complete:1042"
 */
async function handleCallback(bot, query) {
  const telegramId = query.from.id;
  const chatId     = query.message.chat.id;
  const data       = query.data || '';

  await bot.answerCallbackQuery(query.id);

  const [action, ...rest] = data.split(':');
  const payload = rest.join(':');

  const session = await getSession(telegramId);
  if (!session?.api_token) {
    return bot.sendMessage(chatId, 'Session expired. Please /login again.');
  }

  switch (action) {
    case 'open_tasks':
      return bot.sendMessage(chatId, 'Opening your task list... Tap the Mini App button below if available, or type "show my tasks".');

    case 'confirm_complete': {
      await setPendingAction(telegramId, {
        type: 'complete_order',
        entity_id: payload,
        description: `Complete order #${payload}`,
      });
      return bot.sendMessage(chatId,
        `⚠️ You are about to complete Order #${payload}.\n\nThis action is permanent and cannot be undone.\n\nReply YES to confirm or NO to cancel.`
      );
    }

    case 'confirm_cancel': {
      await setPendingAction(telegramId, {
        type: 'cancel_order',
        entity_id: payload,
        description: `Cancel order #${payload}`,
      });
      return bot.sendMessage(chatId,
        `⚠️ You are about to cancel Order #${payload}.\n\nReply YES to confirm or NO to cancel this action.`
      );
    }

    case 'cancel_action':
      await clearPendingAction(telegramId);
      return bot.sendMessage(chatId, 'Action cancelled.');

    default:
      return bot.sendMessage(chatId, 'Unknown action. Please use the task screen.');
  }
}

module.exports = { handleCallback };
