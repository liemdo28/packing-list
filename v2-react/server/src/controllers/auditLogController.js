const { Op } = require('sequelize');
const { AuditLog, User } = require('../models');

const list = async (req, res) => {
  try {
    const { action, entity_type, user_id, from_date, to_date } = req.query;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;

    const where = {};
    if (action) where.action = action;
    if (entity_type) where.entity_type = entity_type;
    if (user_id) where.user_id = user_id;

    if (from_date || to_date) {
      where.created_at = {};
      if (from_date) where.created_at[Op.gte] = new Date(from_date);
      if (to_date) where.created_at[Op.lte] = new Date(to_date + 'T23:59:59');
    }

    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name', 'username'] },
      ],
      order: [['created_at', 'DESC']],
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
    console.error('List audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

module.exports = { list };
