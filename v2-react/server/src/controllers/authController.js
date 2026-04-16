const jwt = require('jsonwebtoken');
const { User, Store } = require('../models');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      where: { username },
      include: [{ model: Store, as: 'store' }],
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    await user.update({ last_login: new Date() });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      data: {
        token,
        user: user.toSafeJSON(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const logout = async (req, res) => {
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

module.exports = { login, logout, me };
