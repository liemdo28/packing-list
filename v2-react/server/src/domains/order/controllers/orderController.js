/**
 * orderController — Node.js / Express
 *
 * Delegates all state mutations to OrderService (which handles
 * pessimistic locking, idempotency, and price snapshots).
 * Error messages from service are forwarded to the client as-is
 * so the UI can display the actual conflict reason.
 */

const { Op } = require('sequelize');
const {
  Order,
  OrderLine,
  Store,
  Item,
  User,
} = require('../../../models');
const OrderService = require('../../../services/orderService');
const { ORDER_STATUSES } = require('../../../config/app');

const list = async (req, res) => {
  try {
    const { status, from_store_id, to_store_id, search } = req.query;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;

    const where = {};

    // Role-based filtering
    if (req.user.role !== 'admin' && req.user.role !== 'accountant') {
      const storeId = req.user.store_id;
      where[Op.or] = [
        { from_store_id: storeId },
        { to_store_id: storeId },
      ];
    }

    if (status) where.status = status;
    if (from_store_id) where.from_store_id = from_store_id;
    if (to_store_id) where.to_store_id = to_store_id;
    if (search) {
      where.order_number = { [Op.like]: `%${search}%` };
    }

    const { rows, count } = await Order.findAndCountAll({
      where,
      include: [
        { model: Store, as: 'fromStore' },
        { model: Store, as: 'toStore' },
        { model: User, as: 'creator', attributes: ['id', 'full_name'] },
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
    console.error('List orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

const create = async (req, res) => {
  try {
    const { from_store_id, to_store_id, lines, notes, recipient_name } = req.body;

    const order = await OrderService.createOrder({
      fromStoreId: from_store_id,
      toStoreId: to_store_id,
      lines,
      notes,
      recipientName: recipient_name || null,
      userId: req.user.id,
    });

    res.status(201).json({ data: order });
  } catch (error) {
    console.error('Create order error:', error);
    const status = error.message.includes('not allowed') ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
};

const get = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: Store, as: 'fromStore' },
        { model: Store, as: 'toStore' },
        { model: User, as: 'creator', attributes: ['id', 'full_name'] },
        {
          model: OrderLine,
          as: 'lines',
          include: [{ model: Item, as: 'item' }],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ data: order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

const update = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== ORDER_STATUSES.DRAFT) {
      return res.status(400).json({ error: 'Only draft orders can be updated' });
    }

    const { notes, lines } = req.body;

    if (notes !== undefined) {
      await order.update({ notes });
    }

    if (lines && lines.length > 0) {
      await OrderService.updateOrderLines(order.id, lines);
    }

    const updated = await Order.findByPk(order.id, {
      include: [
        { model: Store, as: 'fromStore' },
        { model: Store, as: 'toStore' },
        { model: OrderLine, as: 'lines', include: [{ model: Item, as: 'item' }] },
      ],
    });

    res.json({ data: updated });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(400).json({ error: error.message });
  }
};

// ─── State transitions ───────────────────────────────────────────────────────
// All transition methods call OrderService which handles:
//   1. DB transaction with FOR UPDATE row lock
//   2. Idempotency guard (already-done transitions return silently)
//   3. Transition validation
//   4. Price snapshot atomically inside the COMPLETED transaction

const submit = async (req, res) => {
  try {
    const order = await OrderService.submitOrder(parseInt(req.params.id, 10), req.user.id);
    res.json({ data: order });
  } catch (error) {
    console.error('Submit order error:', error);
    res.status(400).json({ error: error.message });
  }
};

const accept = async (req, res) => {
  try {
    const { lines = [], note } = req.body;
    const order = await OrderService.acceptOrder(
      parseInt(req.params.id, 10), req.user.id, { lines, note }
    );
    res.json({ data: order });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(400).json({ error: error.message });
  }
};

const reject = async (req, res) => {
  try {
    const { reason, note } = req.body;
    const order = await OrderService.rejectOrder(
      parseInt(req.params.id, 10), req.user.id, { reason, note }
    );
    res.json({ data: order });
  } catch (error) {
    console.error('Reject order error:', error);
    res.status(400).json({ error: error.message });
  }
};

const prepare = async (req, res) => {
  try {
    const order = await OrderService.prepareOrder(parseInt(req.params.id, 10), req.user.id);
    res.json({ data: order });
  } catch (error) {
    console.error('Prepare order error:', error);
    res.status(400).json({ error: error.message });
  }
};

const ship = async (req, res) => {
  try {
    const order = await OrderService.shipOrder(parseInt(req.params.id, 10), req.user.id);
    res.json({ data: order });
  } catch (error) {
    console.error('Ship order error:', error);
    res.status(400).json({ error: error.message });
  }
};

const receive = async (req, res) => {
  try {
    const { lines = [], note } = req.body;
    const orderId = parseInt(req.params.id, 10);
    const order = await OrderService.receiveOrder(orderId, req.user.id, { lines, note });
    res.json({ data: order });
  } catch (error) {
    console.error('Receive order error:', error);
    res.status(400).json({ error: error.message });
  }
};

const complete = async (req, res) => {
  try {
    const order = await OrderService.completeOrder(parseInt(req.params.id, 10), req.user.id);
    res.json({ data: order });
  } catch (error) {
    console.error('Complete order error:', error);
    res.status(400).json({ error: error.message });
  }
};

const cancel = async (req, res) => {
  try {
    const reason = req.body.cancel_reason || 'Cancelled by user';
    const order = await OrderService.cancelOrder(
      parseInt(req.params.id, 10),
      req.user.id,
      reason
    );
    res.json({ data: order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  list, create, get, update,
  submit, accept, reject, prepare, ship, receive, complete, cancel,
};