const { Op } = require('sequelize');
const { Item, PriceMaster } = require('../../../models');

const list = async (req, res) => {
  try {
    const { search, category, active } = req.query;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
      ];
    }
    if (category) where.category = category;
    if (active !== undefined) where.is_active = active === 'true';

    const { rows, count } = await Item.findAndCountAll({
      where,
      include: [{
        model: PriceMaster,
        as: 'prices',
        where: { is_active: true },
        required: false,
        limit: 1,
        order: [['effective_date', 'DESC']],
      }],
      order: [['code', 'ASC']],
      limit,
      offset,
      distinct: true,
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
    console.error('List items error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};

const create = async (req, res) => {
  try {
    const { code, name, description, category, unit } = req.body;

    const existing = await Item.findOne({ where: { code } });
    if (existing) {
      return res.status(400).json({ error: 'Item code already exists' });
    }

    const item = await Item.create({ code, name, description, category, unit });
    res.status(201).json({ data: item });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
};

const get = async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id, {
      include: [{
        model: PriceMaster,
        as: 'prices',
        order: [['effective_date', 'DESC']],
      }],
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ data: item });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
};

const update = async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const { name, description, category, unit, is_active } = req.body;
    await item.update({ name, description, category, unit, is_active });

    res.json({ data: item });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
};

const remove = async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await item.update({ is_active: false });
    res.json({ message: 'Item deactivated successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
};

module.exports = { list, create, get, update, remove };