const { Op } = require('sequelize');
const { PriceMaster, Item, User } = require('../../../models');

const list = async (req, res) => {
  try {
    const { item_id, active } = req.query;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;

    const where = {};
    if (item_id) where.item_id = item_id;
    if (active !== undefined) where.is_active = active === 'true';

    const { rows, count } = await PriceMaster.findAndCountAll({
      where,
      include: [
        { model: Item, as: 'item' },
        { model: User, as: 'creator', attributes: ['id', 'full_name'] },
      ],
      order: [['effective_date', 'DESC']],
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
    console.error('List prices error:', error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
};

const create = async (req, res) => {
  try {
    const { item_id, price, effective_date, end_date } = req.body;

    const item = await Item.findByPk(item_id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Deactivate current active prices for this item if new one overlaps
    await PriceMaster.update(
      { is_active: false, end_date: effective_date },
      {
        where: {
          item_id,
          is_active: true,
          effective_date: { [Op.lte]: effective_date },
          [Op.or]: [
            { end_date: null },
            { end_date: { [Op.gte]: effective_date } },
          ],
        },
      }
    );

    const priceMaster = await PriceMaster.create({
      item_id,
      price,
      effective_date,
      end_date: end_date || null,
      is_active: true,
      created_by: req.user.id,
    });

    const result = await PriceMaster.findByPk(priceMaster.id, {
      include: [
        { model: Item, as: 'item' },
        { model: User, as: 'creator', attributes: ['id', 'full_name'] },
      ],
    });

    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Create price error:', error);
    res.status(500).json({ error: 'Failed to create price' });
  }
};

const get = async (req, res) => {
  try {
    const price = await PriceMaster.findByPk(req.params.id, {
      include: [
        { model: Item, as: 'item' },
        { model: User, as: 'creator', attributes: ['id', 'full_name'] },
      ],
    });

    if (!price) {
      return res.status(404).json({ error: 'Price not found' });
    }

    res.json({ data: price });
  } catch (error) {
    console.error('Get price error:', error);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
};

const history = async (req, res) => {
  try {
    const { itemId } = req.params;

    const prices = await PriceMaster.findAll({
      where: { item_id: itemId },
      include: [
        { model: Item, as: 'item' },
        { model: User, as: 'creator', attributes: ['id', 'full_name'] },
      ],
      order: [['effective_date', 'DESC']],
    });

    res.json({ data: prices });
  } catch (error) {
    console.error('Price history error:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
};

module.exports = { list, create, get, history };