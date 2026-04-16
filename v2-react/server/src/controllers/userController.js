const { Op } = require('sequelize');
const { User, Store } = require('../models');

const list = async (req, res) => {
  try {
    const { role, search, active } = req.query;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (active !== undefined) where.is_active = active === 'true';
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [{ model: Store, as: 'store' }],
      order: [['full_name', 'ASC']],
      limit,
      offset,
    });

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const create = async (req, res) => {
  try {
    const { username, password, full_name, email, role, store_id } = req.body;

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const user = await User.create({
      username,
      password: password || 'password',
      full_name,
      email,
      role,
      store_id,
    });

    res.status(201).json({ data: user.toSafeJSON() });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

const get = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Store, as: 'store' }],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

const update = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { full_name, email, role, store_id, is_active, password } = req.body;

    const updateData = { full_name, email, role, store_id, is_active };
    if (password) updateData.password = password;

    await user.update(updateData);

    const updated = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Store, as: 'store' }],
    });

    res.json({ data: updated });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

const remove = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ is_active: false });
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

module.exports = { list, create, get, update, remove };
