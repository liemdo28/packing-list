const { Op } = require('sequelize');
const { Order, OrderLine, Item, PriceMaster, Store, sequelize } = require('../models');
const { isValidTransfer, canTransitionTo, ORDER_STATUSES } = require('../config/app');
const NotificationService = require('./notificationService');

class OrderService {
  static async generateOrderNumber() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `PL-${dateStr}-`;

    const lastOrder = await Order.findOne({
      where: { order_number: { [Op.like]: `${prefix}%` } },
      order: [['order_number', 'DESC']],
    });

    let seq = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.order_number.split('-').pop(), 10);
      seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(3, '0')}`;
  }

  static async validateTransfer(fromStoreId, toStoreId) {
    const fromStore = await Store.findByPk(fromStoreId);
    const toStore = await Store.findByPk(toStoreId);

    if (!fromStore || !toStore) {
      throw new Error('Invalid store');
    }

    if (!isValidTransfer(fromStore.code, toStore.code)) {
      throw new Error(`Transfer from ${fromStore.code} to ${toStore.code} is not allowed`);
    }

    return { fromStore, toStore };
  }

  static async createOrder({ fromStoreId, toStoreId, lines, notes, userId }) {
    await this.validateTransfer(fromStoreId, toStoreId);

    const t = await sequelize.transaction();
    try {
      const orderNumber = await this.generateOrderNumber();

      const order = await Order.create({
        order_number: orderNumber,
        from_store_id: fromStoreId,
        to_store_id: toStoreId,
        status: ORDER_STATUSES.DRAFT,
        notes,
        created_by: userId,
      }, { transaction: t });

      const orderLines = await Promise.all(
        lines.map(async (line) => {
          const item = await Item.findByPk(line.item_id);
          if (!item) throw new Error(`Item not found: ${line.item_id}`);

          return OrderLine.create({
            order_id: order.id,
            item_id: line.item_id,
            quantity: line.quantity,
            notes: line.notes || null,
          }, { transaction: t });
        })
      );

      await t.commit();

      return Order.findByPk(order.id, {
        include: [
          { model: Store, as: 'fromStore' },
          { model: Store, as: 'toStore' },
          { model: OrderLine, as: 'lines', include: [{ model: Item, as: 'item' }] },
        ],
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  static async updateOrderLines(orderId, lines) {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error('Order not found');
    if (order.status !== ORDER_STATUSES.DRAFT) {
      throw new Error('Only draft orders can be updated');
    }

    const t = await sequelize.transaction();
    try {
      await OrderLine.destroy({ where: { order_id: orderId }, transaction: t });

      await Promise.all(
        lines.map(async (line) => {
          const item = await Item.findByPk(line.item_id);
          if (!item) throw new Error(`Item not found: ${line.item_id}`);

          return OrderLine.create({
            order_id: orderId,
            item_id: line.item_id,
            quantity: line.quantity,
            notes: line.notes || null,
          }, { transaction: t });
        })
      );

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  static async snapshotPrices(orderId) {
    const lines = await OrderLine.findAll({
      where: { order_id: orderId },
      include: [{ model: Item, as: 'item' }],
    });

    let totalAmount = 0;
    const today = new Date().toISOString().slice(0, 10);

    for (const line of lines) {
      const price = await PriceMaster.findOne({
        where: {
          item_id: line.item_id,
          is_active: true,
          effective_date: { [Op.lte]: today },
          [Op.or]: [
            { end_date: null },
            { end_date: { [Op.gte]: today } },
          ],
        },
        order: [['effective_date', 'DESC']],
      });

      const unitPrice = price ? parseFloat(price.price) : 0;
      const totalPrice = unitPrice * parseFloat(line.quantity);

      await line.update({
        unit_price: unitPrice,
        total_price: totalPrice,
      });

      totalAmount += totalPrice;
    }

    await Order.update({ total_amount: totalAmount }, { where: { id: orderId } });

    return totalAmount;
  }

  static async transitionStatus(orderId, newStatus, userId, extras = {}) {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error('Order not found');

    if (!canTransitionTo(order.status, newStatus)) {
      throw new Error(`Cannot transition from ${order.status} to ${newStatus}`);
    }

    const updateData = { status: newStatus };

    switch (newStatus) {
      case ORDER_STATUSES.SUBMITTED:
        updateData.submitted_at = new Date();
        break;
      case ORDER_STATUSES.PREPARING:
        updateData.prepared_at = new Date();
        break;
      case ORDER_STATUSES.SHIPPED:
        updateData.shipped_at = new Date();
        break;
      case ORDER_STATUSES.RECEIVED:
        updateData.received_at = new Date();
        break;
      case ORDER_STATUSES.COMPLETED:
        updateData.completed_at = new Date();
        await this.snapshotPrices(orderId);
        break;
      case ORDER_STATUSES.CANCELLED:
        updateData.cancelled_at = new Date();
        updateData.cancel_reason = extras.cancel_reason || null;
        break;
    }

    await order.update(updateData);

    await NotificationService.notifyOrderStatusChange(order, newStatus, userId);

    return Order.findByPk(orderId, {
      include: [
        { model: Store, as: 'fromStore' },
        { model: Store, as: 'toStore' },
        { model: OrderLine, as: 'lines', include: [{ model: Item, as: 'item' }] },
      ],
    });
  }
}

module.exports = OrderService;
