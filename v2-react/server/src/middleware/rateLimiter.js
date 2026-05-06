function createLimiter({ windowMs, max, message }) {
  const store = new Map(); // each limiter has its own store

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count++;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', retryAfter);
      return res.status(429).json({
        error: message || 'Too many requests. Please try again later.',
        retryAfter,
      });
    }

    next();
  };
}

const generalLimiter = createLimiter({ windowMs: 60_000, max: 200 });
const loginLimiter   = createLimiter({
  windowMs: 15 * 60_000,
  max: 10,
  message: 'Too many login attempts. Try again in 15 minutes.',
});
const adminLimiter   = createLimiter({ windowMs: 60_000, max: 60 });

module.exports = { generalLimiter, loginLimiter, adminLimiter };
