const { Op } = require('sequelize');
const { Order, OrderLine, Store, Item, User } = require('../models');
const OrderService = require('../services/orderService');
const { getStoresByRole, ORDER_STATUSES } = require('../config/app');

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
    const { from_store_id, to_store_id, lines, notes } = req.body;

    const order = await OrderService.createOrder({
      fromStoreId: from_store_id,
      toStoreId: to_store_id,
      lines,
      notes,
      userId: req.user.id,
    });

    res.status(201).json({ data: order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(400).json({ error: error.message });
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

const submit = async (req, res) => {
  try {
    const order = await OrderService.transitionStatus(
      req.params.id, ORDER_STATUSES.SUBMITTED, req.user.id
    );
    res.json({ data: order });
  } catch (error) {
    console.error('Submit order error:', error);
    res.status(400).json({ error: error.message });
  }
};

const prepare = async (req, res) => {
  try {
    const order = await OrderService.transitionStatus(
      req.params.id, ORDER_STATUSES.PREPARING, req.user.id
    );
    res.json({ data: order });
  } catch (error) {
    console.error('Prepare order error:', error);
    res.status(400).json({ error: error.message });
  }
};

const ship = async (req, res) => {
  try {
    const order = await OrderService.transitionStatus(
      req.params.id, ORDER_STATUSES.SHIPPED, req.user.id
    );
    res.json({ data: order });
  } catch (error) {
    console.error('Ship order error:', error);
    res.status(400).json({ error: error.message });
  }
};

const receive = async (req, res) => {
  try {
    // Update received quantities if provided
    if (req.body.lines) {
      for (const lineData of req.body.lines) {
        await OrderLine.update(
          { received_quantity: lineData.received_quantity },
          { where: { id: lineData.id } }
        );
      }
    }

    const order = await OrderService.transitionStatus(
      req.params.id, ORDER_STATUSES.RECEIVED, req.user.id
    );
    res.json({ data: order });
  } catch (error) {
    console.error('Receive order error:', error);
    res.status(400).json({ error: error.message });
  }
};

const complete = async (req, res) => {
  try {
    const order = await OrderService.transitionStatus(
      req.params.id, ORDER_STATUSES.COMPLETED, req.user.id
    );
    res.json({ data: order });
  } catch (error) {
    console.error('Complete order error:', error);
    res.status(400).json({ error: error.message });
  }
};

const cancel = async (req, res) => {
  try {
    const order = await OrderService.transitionStatus(
      req.params.id, ORDER_STATUSES.CANCELLED, req.user.id, {
        cancel_reason: req.body.cancel_reason,
      }
    );
    res.json({ data: order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = { list, create, get, update, submit, prepare, ship, receive, complete, cancel };
