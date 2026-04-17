const { Op } = require('sequelize');
const { PackingJob, PackingItem, PackingTemplate, PackingTemplateItem, Item, Store, User, Order, OrderLine } = require('../../../models');

const list = async (req, res) => {
  try {
    const { status, type, from_store_id, from_date, to_date } = req.query;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (from_store_id) where.from_store_id = from_store_id;
    if (from_date) where.created_at = { ...where.created_at, [Op.gte]: new Date(from_date) };
    if (to_date) where.created_at = { ...where.created_at, [Op.lte]: new Date(to_date + 'T23:59:59') };

    const { rows, count } = await PackingJob.findAndCountAll({
      where,
      include: [
        { model: Store, as: 'fromStore' },
        { model: User, as: 'creator', attributes: ['id', 'full_name'] },
        { model: Order, as: 'order', attributes: ['id', 'order_number'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({ data: rows, total: count, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const get = async (req, res) => {
  try {
    const job = await PackingJob.findByPk(req.params.id, {
      include: [
        { model: PackingItem, include: [{ model: Item, attributes: ['id', 'code', 'name', 'unit'] }] },
        { model: Store, as: 'fromStore' },
        { model: User, as: 'creator', attributes: ['id', 'full_name'] },
        { model: Order, as: 'order', attributes: ['id', 'order_number'] },
      ],
    });

    if (!job) return res.status(404).json({ error: 'Packing job not found' });

    const totalItems = job.PackingItems.length;
    const packedItems = job.PackingItems.filter(i => i.packed).length;
    job.dataValues.progress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, type, order_id, from_store_id, notes, template_id } = req.body;

    let job;

    if (order_id) {
      const order = await Order.findByPk(order_id, { include: [{ model: OrderLine }] });
      if (!order) return res.status(404).json({ error: 'Order not found' });

      job = await PackingJob.create({
        name: name || `Packing #${order.order_number}`,
        type: type || 'transfer',
        status: 'draft',
        order_id,
        from_store_id: from_store_id || order.from_store_id,
        notes,
        created_by: req.user.id,
      });

      for (const line of order.OrderLines) {
        await PackingItem.create({
          packing_job_id: job.id,
          item_id: line.item_id,
          quantity: line.requested_qty,
          packed_qty: 0,
          packed: false,
        });
      }
    } else if (template_id) {
      const template = await PackingTemplate.findByPk(template_id, { include: [{ model: PackingTemplateItem }] });
      if (!template) return res.status(404).json({ error: 'Template not found' });

      job = await PackingJob.create({
        name,
        type: type || 'shipment',
        status: 'draft',
        from_store_id,
        notes,
        created_by: req.user.id,
      });

      for (const ti of template.PackingTemplateItems) {
        await PackingItem.create({
          packing_job_id: job.id,
          item_id: ti.item_id,
          quantity: ti.default_qty,
          packed_qty: 0,
          packed: false,
        });
      }
    } else {
      job = await PackingJob.create({
        name,
        type: type || 'shipment',
        status: 'draft',
        from_store_id,
        notes,
        created_by: req.user.id,
      });
    }

    const full = await PackingJob.findByPk(job.id, {
      include: [
        { model: PackingItem },
        { model: Store, as: 'fromStore' },
      ],
    });

    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const job = await PackingJob.findByPk(req.params.id);
    if (!job) return res.status(404).json({ error: 'Not found' });

    await job.update(req.body);
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Items
const addItem = async (req, res) => {
  try {
    const { item_id, quantity, notes } = req.body;
    const item = await PackingItem.create({
      packing_job_id: req.params.id,
      item_id,
      quantity,
      packed_qty: 0,
      packed: false,
      notes,
    });

    const full = await PackingItem.findByPk(item.id, { include: [{ model: Item }] });
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateItem = async (req, res) => {
  try {
    const item = await PackingItem.findByPk(req.params.itemId);
    if (!item || item.packing_job_id !== parseInt(req.params.id)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const data = req.body;
    if (data.packed && !item.packed) {
      data.packed_at = new Date();
      data.packed_qty = data.packed_qty ?? item.quantity;
    }
    if (!data.packed) data.packed_at = null;

    await item.update(data);

    // Auto-update job status
    await autoUpdateStatus(item.packing_job_id);

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeItem = async (req, res) => {
  try {
    const item = await PackingItem.findByPk(req.params.itemId);
    if (!item || item.packing_job_id !== parseInt(req.params.id)) {
      return res.status(404).json({ error: 'Not found' });
    }
    await item.destroy();
    await autoUpdateStatus(item.packing_job_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const markAllPacked = async (req, res) => {
  try {
    const job = await PackingJob.findByPk(req.params.id, { include: [{ model: PackingItem }] });
    if (!job) return res.status(404).json({ error: 'Not found' });

    for (const item of job.PackingItems) {
      await item.update({ packed: true, packed_qty: item.quantity, packed_at: new Date() });
    }
    await job.update({ status: 'packed' });

    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const markShipped = async (req, res) => {
  try {
    const job = await PackingJob.findByPk(req.params.id);
    if (!job) return res.status(404).json({ error: 'Not found' });
    if (job.status !== 'packed') return res.status(400).json({ error: 'Job must be packed first' });

    await job.update({ status: 'shipped' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Templates
const templateList = async (req, res) => {
  try {
    const templates = await PackingTemplate.findAll({
      include: [
        { model: PackingTemplateItem, include: [{ model: Item }] },
        { model: User, as: 'creator', attributes: ['id', 'full_name'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const templateCreate = async (req, res) => {
  try {
    const { name, description, items } = req.body;

    const template = await PackingTemplate.create({
      name,
      description,
      created_by: req.user.id,
    });

    for (const item of items || []) {
      await PackingTemplateItem.create({
        packing_template_id: template.id,
        item_id: item.item_id,
        default_qty: item.default_qty || 1,
      });
    }

    const full = await PackingTemplate.findByPk(template.id, {
      include: [{ model: PackingTemplateItem, include: [{ model: Item }] }],
    });
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const templateUpdate = async (req, res) => {
  try {
    const template = await PackingTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Not found' });

    const { name, description, items } = req.body;
    await template.update({ name, description });

    await PackingTemplateItem.destroy({ where: { packing_template_id: template.id } });
    for (const item of items || []) {
      await PackingTemplateItem.create({
        packing_template_id: template.id,
        item_id: item.item_id,
        default_qty: item.default_qty || 1,
      });
    }

    const full = await PackingTemplate.findByPk(template.id, {
      include: [{ model: PackingTemplateItem, include: [{ model: Item }] }],
    });
    res.json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const templateDelete = async (req, res) => {
  try {
    await PackingTemplateItem.destroy({ where: { packing_template_id: req.params.id } });
    await PackingTemplate.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function autoUpdateStatus(jobId) {
  const items = await PackingItem.findAll({ where: { packing_job_id: jobId } });
  const total = items.length;
  const packed = items.filter(i => i.packed).length;

  let status = 'draft';
  if (total > 0) {
    if (packed === 0) status = 'draft';
    else if (packed < total) status = 'packing';
    else status = 'packed';
  }

  await PackingJob.update({ status }, { where: { id: jobId } });
}

module.exports = {
  list, get, create, update,
  addItem, updateItem, removeItem,
  markAllPacked, markShipped,
  templateList, templateCreate, templateUpdate, templateDelete,
};