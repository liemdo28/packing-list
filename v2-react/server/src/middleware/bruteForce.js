// In-memory brute-force tracking per identifier (username or ip)
// On deployment restart the counters reset — acceptable for operational simplicity.

const attempts = new Map(); // identifier -> { count, lockedUntil, firstAt }

const MAX_ATTEMPTS   = 5;
const LOCK_DURATION  = 30 * 60 * 1000; // 30 minutes
const WINDOW_MS      = 15 * 60 * 1000; // sliding 15-min window

function recordFailure(identifier) {
  const now = Date.now();
  const entry = attempts.get(identifier) || { count: 0, lockedUntil: 0, firstAt: now };

  // Reset window if the first attempt is too old
  if (now - entry.firstAt > WINDOW_MS) {
    entry.count = 0;
    entry.firstAt = now;
    entry.lockedUntil = 0;
  }

  entry.count++;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_DURATION;
  }

  attempts.set(identifier, entry);
  return entry;
}

function recordSuccess(identifier) {
  attempts.delete(identifier);
}

function isLocked(identifier) {
  const entry = attempts.get(identifier);
  if (!entry) return false;
  if (Date.now() < entry.lockedUntil) return true;
  // Lock expired — reset
  if (entry.lockedUntil > 0) attempts.delete(identifier);
  return false;
}

function getLockInfo(identifier) {
  const entry = attempts.get(identifier);
  if (!entry) return null;
  return {
    count: entry.count,
    lockedUntil: entry.lockedUntil,
    remainingMs: Math.max(0, entry.lockedUntil - Date.now()),
  };
}

// Clean expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts.entries()) {
    if (now - entry.firstAt > WINDOW_MS && entry.lockedUntil < now) {
      attempts.delete(key);
    }
  }
}, 10 * 60 * 1000);

module.exports = { recordFailure, recordSuccess, isLocked, getLockInfo };
