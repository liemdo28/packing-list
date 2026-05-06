const { INTENT } = require('./classifier');

// Actions that require two-step confirmation
const DANGEROUS_ACTIONS = new Set([
  'complete_order',
  'cancel_order',
  'delete_draft',
  'override_status',
  'resend_shipment',
]);

// Roles that can execute dangerous actions at all
const ROLE_CAN_EXECUTE = {
  complete_order:   ['admin', 'b1', 'b2', 'b3'],
  cancel_order:     ['admin', 'b1', 'b3'],
  delete_draft:     ['admin', 'b1', 'b3'],
  override_status:  ['admin'],
  resend_shipment:  ['admin', 'b1', 'b3'],
};

/**
 * Check whether the AI should proceed, confirm, or refuse.
 *
 * Returns:
 *   { decision: 'proceed' }
 *   { decision: 'confirm', message: '...' }
 *   { decision: 'refuse',  message: '...' }
 *   { decision: 'clarify', message: '...' }
 *   { decision: 'escalate', message: '...' }
 */
function check({ intent, confidence, action, session }) {
  // Low confidence — always clarify first
  if (confidence < 0.7) {
    return {
      decision: 'clarify',
      message: "I'm not entirely sure what you'd like to do. Could you be more specific?",
    };
  }

  // Escalation intent — hand off
  if (intent === INTENT.ESCALATE) {
    return {
      decision: 'escalate',
      message: "This looks like something that needs admin attention. Please contact your Admin directly or open the task screen for guidance.",
    };
  }

  // Ambiguous — clarify
  if (intent === INTENT.AMBIGUOUS) {
    return {
      decision: 'clarify',
      message: "I didn't quite understand that. You can ask me things like:\n• Show my pending orders\n• What should I do next?\n• Open the task list",
    };
  }

  // Dangerous action checks
  if (intent === INTENT.ACTION_DANGER && action) {
    const allowed = ROLE_CAN_EXECUTE[action] || [];
    if (!allowed.includes(session?.role)) {
      return {
        decision: 'refuse',
        message: `Your role (${session?.role}) is not allowed to perform "${action}". Contact Admin if this is incorrect.`,
      };
    }

    return {
      decision: 'confirm',
      message: null, // caller builds the confirmation prompt
    };
  }

  return { decision: 'proceed' };
}

function isDangerous(action) {
  return DANGEROUS_ACTIONS.has(action);
}

module.exports = { check, isDangerous, DANGEROUS_ACTIONS };
