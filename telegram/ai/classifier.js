// Intent classification — determines how to route the user message.
// Done with keyword patterns first (fast, no AI cost) then falls back to AI.

const INTENT = {
  QUERY:          'query',           // read-only: "show my orders", "what is pending"
  NAVIGATE:       'navigate',        // "open the app", "open mini app", "go to task list"
  ACTION_SAFE:    'action_safe',     // low-risk write: add note, mark as read
  ACTION_DANGER:  'action_danger',   // high-risk write: complete, cancel, delete, override
  ESCALATE:       'escalate',        // disputes, blocked items, contact admin
  GREETING:       'greeting',        // hi, hello, start
  AMBIGUOUS:      'ambiguous',       // unclear
};

const PATTERNS = {
  [INTENT.GREETING]: [
    /^(hi|hello|hey|xin chào|chào|start)\b/i,
  ],
  [INTENT.NAVIGATE]: [
    /open (the )?(app|mini app|task list|screen|dashboard)/i,
    /go to/i,
    /mở app/i,
  ],
  [INTENT.ACTION_DANGER]: [
    /\b(complete|finish|done|cancel|delete|override|force|xác nhận hoàn thành|huỷ|xoá)\b/i,
  ],
  [INTENT.ACTION_SAFE]: [
    /\b(add note|mark|update note|ghi chú)\b/i,
  ],
  [INTENT.ESCALATE]: [
    /\b(dispute|blocked|stuck|admin|help|error|wrong|sai|bị kẹt|liên hệ)\b/i,
  ],
  [INTENT.QUERY]: [
    /\b(show|list|what|how many|status|pending|waiting|delayed|my tasks|orders|shipment)\b/i,
    /\b(xem|danh sách|trạng thái|đơn hàng|đang chờ)\b/i,
  ],
};

function classifyByPattern(text) {
  for (const [intent, regexes] of Object.entries(PATTERNS)) {
    if (regexes.some(r => r.test(text))) return intent;
  }
  return null;
}

/**
 * Classify intent from message text.
 * Returns { intent, confidence }
 * confidence: 1.0 = pattern match, 0.7 = heuristic, 0.5 = ambiguous
 */
function classify(text) {
  const matched = classifyByPattern(text);
  if (matched) {
    return { intent: matched, confidence: 1.0 };
  }

  // Short unrecognised message — likely ambiguous
  if (text.trim().length < 4) {
    return { intent: INTENT.AMBIGUOUS, confidence: 0.5 };
  }

  // Default to query with low confidence — AI will handle it
  return { intent: INTENT.QUERY, confidence: 0.65 };
}

module.exports = { INTENT, classify };
