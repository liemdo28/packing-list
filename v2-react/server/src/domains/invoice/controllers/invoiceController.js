const { Invoice, InvoiceLine, Store, Item, User } = require('../../../models');
const InvoiceService = require('../../../services/invoiceService');

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

    await InvoiceService.createInvoice({
      invoiceData: {
        invoice_number,
        supplier_name: supplier_name || 'Four Season',
        paid_by_store_id,
        on_behalf_of_store_id,
        invoice_date,
        due_date,
        total_amount,
        notes,
      },
      lines,
      userId: req.user.id,
    });

    // Reload full invoice with associations
    const allInvoices = await Invoice.findAll({
      where: { invoice_number },
      include: [
        { model: Store, as: 'paidByStore' },
        { model: Store, as: 'onBehalfOfStore' },
        { model: InvoiceLine, as: 'lines', include: [{ model: Item, as: 'item' }] },
      ],
      order: [['created_at', 'DESC']],
      limit: 1,
    });

    res.status(201).json({ data: allInvoices[0] });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: error.message || 'Failed to create invoice' });
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
    const {
      supplier_name, paid_by_store_id, on_behalf_of_store_id,
      invoice_date, due_date, total_amount, notes, lines,
    } = req.body;

    await InvoiceService.updateInvoice(req.params.id, {
      supplier_name, paid_by_store_id, on_behalf_of_store_id,
      invoice_date, due_date, total_amount, notes,
    }, lines);

    // Reload full invoice
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Store, as: 'paidByStore' },
        { model: Store, as: 'onBehalfOfStore' },
        { model: InvoiceLine, as: 'lines', include: [{ model: Item, as: 'item' }] },
      ],
    });

    res.json({ data: invoice });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: error.message || 'Failed to update invoice' });
  }
};

const reconcile = async (req, res) => {
  try {
    await InvoiceService.reconcileInvoice(req.params.id, req.user.id);

    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Store, as: 'paidByStore' },
        { model: Store, as: 'onBehalfOfStore' },
        { model: User, as: 'reconciler', attributes: ['id', 'full_name'] },
      ],
    });

    res.json({ data: invoice });
  } catch (error) {
    console.error('Reconcile invoice error:', error);
    res.status(500).json({ error: error.message || 'Failed to reconcile invoice' });
  }
};

module.exports = { list, create, get, update, reconcile };