const { Store } = require('../models');

const list = async (req, res) => {
  try {
    const stores = await Store.findAll({ order: [['code', 'ASC']] });
    res.json({ data: stores });
  } catch (error) {
    console.error('List stores error:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
};

const create = async (req, res) => {
  try {
    const { code, name, address, phone } = req.body;

    const existing = await Store.findOne({ where: { code } });
    if (existing) {
      return res.status(400).json({ error: 'Store code already exists' });
    }

    const store = await Store.create({ code, name, address, phone });
    res.status(201).json({ data: store });
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ error: 'Failed to create store' });
  }
};

const get = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json({ data: store });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Failed to fetch store' });
  }
};

const update = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const { name, address, phone, is_active } = req.body;
    await store.update({ name, address, phone, is_active });

    res.json({ data: store });
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({ error: 'Failed to update store' });
  }
};

const remove = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    await store.update({ is_active: false });
    res.json({ message: 'Store deactivated successfully' });
  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({ error: 'Failed to delete store' });
  }
};

module.exports = { list, create, get, update, remove };
