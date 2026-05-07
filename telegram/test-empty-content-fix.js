/**
 * Test script to verify the empty content block fix
 * Run: node test-empty-content-fix.js
 */

// Test validation functions
function isValidContent(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  return trimmed.length > 0;
}

function sanitizeMessages(messages) {
  return messages.filter(m => {
    if (!m.role || !m.content) return false;
    if (Array.isArray(m.content)) {
      return m.content.some(block => block.type !== 'text' || isValidContent(block.text));
    }
    return isValidContent(m.content);
  });
}

console.log('=== Testing Empty Content Fix ===\n');

// Test 1: Empty string
console.log('Test 1 - Empty string:');
console.log('  isValidContent(""):', isValidContent('')); // Should be false

// Test 2: Whitespace only
console.log('Test 2 - Whitespace only:');
console.log('  isValidContent("   "):', isValidContent('   ')); // Should be false

// Test 3: Null/undefined
console.log('Test 3 - Null/undefined:');
console.log('  isValidContent(null):', isValidContent(null)); // Should be false
console.log('  isValidContent(undefined):', isValidContent(undefined)); // Should be false

// Test 4: Valid message
console.log('Test 4 - Valid message:');
console.log('  isValidContent("Hello"):', isValidContent('Hello')); // Should be true

// Test 5: Message with content
console.log('Test 5 - Message with content:');
console.log('  isValidContent("  Hello World  "):', isValidContent('  Hello World  ')); // Should be true

// Test 6: Sanitize messages with empty content
console.log('\nTest 6 - Sanitize messages with empty content:');
const testMessages = [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: '' },  // Should be filtered
  { role: 'user', content: '   ' },    // Should be filtered
  { role: 'assistant', content: 'Hi there' },
];
const sanitized = sanitizeMessages(testMessages);
console.log('  Original count:', testMessages.length);
console.log('  Sanitized count:', sanitized.length);
console.log('  Sanitized messages:', sanitized.map(m => m.content));

// Test 7: Simulate Anthropic request payload
console.log('\nTest 7 - Simulate Anthropic request payload:');
const validMessages = sanitizeMessages([
  { role: 'user', content: 'What is my order status?' },
  { role: 'assistant', content: 'Let me check that for you.' },
]);
const payload = {
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 512,
  system: 'You are an assistant.',
  messages: validMessages,
};
console.log('  Request payload:');
console.log(JSON.stringify(payload, null, 2));

// Test 8: Empty messages after sanitization
console.log('\nTest 8 - Empty messages array after sanitization:');
const emptySanitized = sanitizeMessages([
  { role: 'user', content: '' },
  { role: 'assistant', content: '   ' },
]);
console.log('  Empty sanitized array length:', emptySanitized.length);
if (emptySanitized.length === 0) {
  console.log('  ✓ Would correctly reject - no valid messages to send to AI');
}

console.log('\n=== All Tests Complete ===');
