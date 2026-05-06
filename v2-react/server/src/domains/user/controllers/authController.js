const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Store, RefreshToken } = require('../../../models');
const bruteForce = require('../../../middleware/bruteForce');

const ACCESS_TOKEN_TTL  = '15m';
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

async function generateRefreshToken(userId, ip) {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL);
  await RefreshToken.create({ user_id: userId, token, expires_at: expiresAt, ip_address: ip });
  return token;
}

const login = async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;
  const identifier = `user:${username}`;

  try {
    if (bruteForce.isLocked(identifier)) {
      const info = bruteForce.getLockInfo(identifier);
      const mins = Math.ceil(info.remainingMs / 60_000);
      return res.status(429).json({
        error: `Account temporarily locked. Try again in ${mins} minute(s).`,
      });
    }

    const user = await User.findOne({
      where: { username },
      include: [{ model: Store, as: 'store' }],
    });

    if (!user || !(await user.validatePassword(password))) {
      const entry = bruteForce.recordFailure(identifier);
      const remaining = Math.max(0, 5 - entry.count);
      return res.status(401).json({
        error: 'Invalid username or password',
        attemptsRemaining: remaining,
      });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    bruteForce.recordSuccess(identifier);
    await user.update({ last_login: new Date() });

    const accessToken  = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id, ip);

    res.json({
      data: {
        token: accessToken,
        refreshToken,
        expiresIn: 15 * 60, // seconds
        user: user.toSafeJSON(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const stored = await RefreshToken.findOne({
      where: { token: refreshToken, revoked: false },
    });

    if (!stored || new Date() > stored.expires_at) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await User.findByPk(stored.user_id, {
      include: [{ model: Store, as: 'store' }],
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Rotate: revoke old, issue new
    const newRefreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL);

    await stored.update({ revoked: true, replaced_by: newRefreshToken });
    await RefreshToken.create({
      user_id: user.id,
      token: newRefreshToken,
      expires_at: expiresAt,
      ip_address: ip,
    });

    const accessToken = generateAccessToken(user);

    res.json({
      data: {
        token: accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60,
      },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

const logout = async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await RefreshToken.update(
      { revoked: true },
      { where: { token: refreshToken } }
    ).catch(() => {}); // best-effort
  }

  res.json({ message: 'Logged out successfully' });
};

const me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Store, as: 'store' }],
    });
    res.json({ data: user.toSafeJSON() });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
};

module.exports = { login, refresh, logout, me };
