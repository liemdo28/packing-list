const { Op } = require('sequelize');
const { Invoice, InvoiceLine, Store, Item, User } = require('../models');

const list = async (req, res) => {
  try {
    const { status, paid_by_store_id } = req.query;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (paid_by_store_id) where.paid_by_store_id = paid_by_store_id;

    const { rows, count } = await Invoice.findAndCountAll({
      where,
      include: [
        { model: Store, as: 'paidByStore' },
        { model: Store, as: 'onBehalfOfStore' },
        { model: User, as: 'creator', attributes: ['id', 'full_name'] },
      ],
      order: [['invoice_date', 'DESC']],
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
    console.error('List invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

const create = async (req, res) => {
  try {
    const {
      invoice_number, supplier_name, paid_by_store_id, on_behalf_of_store_id,
      invoice_date, due_date, total_amount, notes, lines,
    } = req.body;

    const existing = await Invoice.findOne({ where: { invoice_number } });
    if (existing) {
      return res.status(400).json({ error: 'Invoice number already exists' });
    }

    const invoice = await Invoice.create({
      invoice_number,
      supplier_name: supplier_name || 'Four Season',
      paid_by_store_id,
      on_behalf_of_store_id,
      invoice_date,
      due_date,
      total_amount,
      notes,
      created_by: req.user.id,
    });

    if (lines && lines.length > 0) {
      await InvoiceLine.bulkCreate(
        lines.map(line => ({
          invoice_id: invoice.id,
          item_id: line.item_id || null,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          total_price: line.quantity * line.unit_price,
        }))
      );
    }

    const result = await Invoice.findByPk(invoice.id, {
      include: [
        { model: Store, as: 'paidByStore' },
        { model: Store, as: 'onBehalfOfStore' },
        { model: InvoiceLine, as: 'lines', include: [{ model: Item, as: 'item' }] },
      ],
    });

    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

const get = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Store, as: 'paidByStore' },
        { model: Store, as: 'onBehalfOfStore' },
        { model: User, as: 'creator', attributes: ['id', 'full_name'] },
        { model: User, as: 'reconciler', attributes: ['id', 'full_name'] },
        { model: InvoiceLine, as: 'lines', include: [{ model: Item, as: 'item' }] },
      ],
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ data: invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

const update = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'reconciled') {
      return res.status(400).json({ error: 'Cannot update reconciled invoice' });
    }

    const {
      supplier_name, paid_by_store_id, on_behalf_of_store_id,
      invoice_date, due_date, total_amount, notes, lines,
    } = req.body;

    await invoice.update({
      supplier_name, paid_by_store_id, on_behalf_of_store_id,
      invoice_date, due_date, total_amount, notes,
    });

    if (lines) {
      await InvoiceLine.destroy({ where: { invoice_id: invoice.id } });
      await InvoiceLine.bulkCreate(
        lines.map(line => ({
          invoice_id: invoice.id,
          item_id: line.item_id || null,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          total_price: line.quantity * line.unit_price,
        }))
      );
    }

    const result = await Invoice.findByPk(invoice.id, {
      include: [
        { model: Store, as: 'paidByStore' },
        { model: Store, as: 'onBehalfOfStore' },
        { model: InvoiceLine, as: 'lines', include: [{ model: Item, as: 'item' }] },
      ],
    });

    res.json({ data: result });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
};

const reconcile = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'reconciled') {
      return res.status(400).json({ error: 'Invoice already reconciled' });
    }

    await invoice.update({
      status: 'reconciled',
      reconciled_by: req.user.id,
      reconciled_at: new Date(),
    });

    const result = await Invoice.findByPk(invoice.id, {
      include: [
        { model: Store, as: 'paidByStore' },
        { model: Store, as: 'onBehalfOfStore' },
        { model: User, as: 'reconciler', attributes: ['id', 'full_name'] },
      ],
    });

    res.json({ data: result });
  } catch (error) {
    console.error('Reconcile invoice error:', error);
    res.status(500).json({ error: 'Failed to reconcile invoice' });
  }
};

module.exports = { list, create, get, update, reconcile };
