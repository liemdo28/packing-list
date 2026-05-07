require('dotenv').config();

const Anthropic = require('@anthropic-ai/sdk');

// Validate content is non-empty before sending to AI
function isValidContent(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  return trimmed.length > 0;
}

// Sanitize message content - ensure no empty content blocks
function sanitizeMessages(messages) {
  return messages.filter(m => {
    if (!m.role || !m.content) return false;
    if (Array.isArray(m.content)) {
      return m.content.some(block => block.type !== 'text' || isValidContent(block.text));
    }
    return isValidContent(m.content);
  });
}
const { TOOL_DEFINITIONS, executeTool } = require('./tools');
const { classify, INTENT }             = require('./classifier');
const { check }                        = require('./safety');
const {
  getSession, getHistory, addMessage, setPendingAction, clearPendingAction,
} = require('./session');

const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt(session) {
  const storeInfo = session?.store_id ? `Store ID: ${session.store_id}` : 'No store assigned';
  return `You are an operations assistant for a multi-store workflow system.

User: ${session?.full_name || 'Unknown'}, Role: ${session?.role || 'unknown'}
${storeInfo}

Responsibilities:
- Help the user understand their current tasks and order statuses
- Always call a tool before stating any business data — never invent order IDs, quantities, or states
- Guide the user through the correct next step in the workflow
- Explain clearly why an action may be blocked
- For dangerous actions (complete, cancel, delete, override): summarise what will happen and ask for explicit "YES" confirmation before acting
- If unsure or the question is outside operational scope: say so clearly and suggest the user contact Admin or open the task screen

Workflow states (in order):
draft → submitted → processing → ready_to_ship → in_transit → received_pending_confirmation → completed

Be concise. Plain text only — no markdown, no bullet asterisks (use • instead).
Language: respond in the same language the user uses (Vietnamese or English).`;
}

/**
 * Process a user message and return the assistant reply text.
 * @param {number} telegramId
 * @param {string} text
 * @returns {Promise<string>}
 */
async function processMessage(telegramId, text) {
  const session = await getSession(telegramId);

  if (!session?.api_token) {
    return 'You are not logged in. Please use /login to connect your account.';
  }

  // Validate input - reject empty/whitespace-only messages
  if (!isValidContent(text)) {
    return 'Please send a valid message (not empty or whitespace only).';
  }

  // Check for pending dangerous action confirmation
  if (session.pending_action) {
    return await handlePendingConfirmation(telegramId, text, session);
  }

  const { intent, confidence } = classify(text);
  const safetyResult = check({ intent, confidence, action: null, session });

  if (safetyResult.decision === 'refuse')   return safetyResult.message;
  if (safetyResult.decision === 'clarify')  return safetyResult.message;
  if (safetyResult.decision === 'escalate') return safetyResult.message;

  // Save user message to history
  await addMessage(telegramId, 'user', text, intent);

  const history = await getHistory(telegramId);
  const messages = sanitizeMessages(history.map(m => ({ role: m.role, content: m.content })));

  // Final validation before AI call - reject if no valid messages
  if (messages.length === 0) {
    return 'No valid conversation history. Please try again.';
  }

  const response = await callClaude(messages, session);
  await addMessage(telegramId, 'assistant', response);
  return response;
}

async function callClaude(messages, session, depth = 0) {
  if (depth > 4) return 'I was unable to retrieve the information needed. Please try again or open the task screen.';

  // Log the request payload for debugging
  console.log(`[callClaude] depth=${depth}, messages count=${messages.length}`);
  messages.forEach((m, i) => {
    const contentPreview = Array.isArray(m.content) 
      ? JSON.stringify(m.content).substring(0, 100)
      : String(m.content).substring(0, 100);
    console.log(`  msg[${i}] role=${m.role}, content="${contentPreview}..."`);
  });

  try {
    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: buildSystemPrompt(session),
      tools: TOOL_DEFINITIONS,
      messages,
    });

    if (res.stop_reason === 'tool_use') {
      const toolUseBlock = res.content.find(b => b.type === 'tool_use');
      if (!toolUseBlock) return 'Something went wrong. Please try again.';

      const toolResult = await executeTool(toolUseBlock.name, toolUseBlock.input, session);

      const nextMessages = [
        ...messages,
        { role: 'assistant', content: res.content },
        {
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: String(toolResult),
          }],
        },
      ];

      return callClaude(nextMessages, session, depth + 1);
    }

    const textBlock = res.content.find(b => b.type === 'text');
    return textBlock?.text || 'No response generated.';
  } catch (error) {
    console.error('[callClaude] Error:', error.message);
    return 'I encountered an error processing your request. Please try again.';
  }
}

async function handlePendingConfirmation(telegramId, text, session) {
  const pending = typeof session.pending_action === 'string'
    ? JSON.parse(session.pending_action)
    : session.pending_action;

  if (/^\s*(yes|YES|có|xác nhận|confirm)\s*$/i.test(text.trim())) {
    await clearPendingAction(telegramId);
    return `Confirmed. Please open the task screen to complete this action — dangerous operations must be executed through the app UI for full validation and audit logging.`;
  }

  if (/^\s*(no|NO|không|cancel|huỷ)\s*$/i.test(text.trim())) {
    await clearPendingAction(telegramId);
    return 'Action cancelled. Let me know if you need anything else.';
  }

  return `Please reply YES to confirm or NO to cancel.\n\nPending: ${pending.description}`;
}

module.exports = { processMessage };
