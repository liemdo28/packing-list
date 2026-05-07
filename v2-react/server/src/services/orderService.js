/**
 * OrderService — Node.js / Express / Sequelize
 *
 * Concurrency-safe order state machine.
 * Key guarantees:
 *  1. Every state transition runs inside a DB transaction with FOR UPDATE lock.
 *  2. All transitions are idempotent — repeating a completed/submitted/etc. transition
 *     returns the order without error.
 *  3. Price snapshot for COMPLETED status is executed inside the same transaction,
 *     atomically with the status update.
 */

const { Op } = require('sequelize');
const {
  Order,
  OrderLine,
  Item,
  PriceMaster,
  Store,
  sequelize,
} = require('../models');
const { isValidTransfer, canTransitionTo, ORDER_STATUSES } = require('../config/app');
const NotificationService = require('./notificationService');

class OrderService {
  // ─── Order Number Generation ────────────────────────────────────────────────

  /**
   * Generate unique order number: PL-YYYYMMDD-NNN
   * Uses a transaction with lock to prevent duplicate sequences.
   */
  static async generateOrderNumber() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `PL-${today}-`;

    const t = await sequelize.transaction();
    try {
      const [lastOrder] = await Order.findAll({
        where: { order_number: { [Op.like]: `${prefix}%` } },
        order: [['order_number', 'DESC']],
        limit: 1,
        lock: true, // FOR UPDATE lock on rows scanned
        transaction: t,
      });

      let seq = 1;
      if (lastOrder) {
        const lastSeq = parseInt(lastOrder.order_number.split('-').pop(), 10);
        seq = lastSeq + 1;
      }

      await t.commit();
      return `${prefix}${String(seq).padStart(3, '0')}`;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // ─── Validation ─────────────────────────────────────────────────────────────

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

  // ─── Order Lifecycle ────────────────────────────────────────────────────────

  /**
   * Create a new draft order.
   * Full create runs inside a transaction; order number locked to avoid duplicates.
   */
  static async createOrder({ fromStoreId, toStoreId, lines, notes, recipientName, userId }) {
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
        recipient_name: recipientName || null,
        created_by: userId,
      }, { transaction: t });

      await Promise.all(
        lines.map((line) => OrderLine.create({
          order_id: order.id,
          item_id: line.item_id,
          quantity: line.quantity,
          notes: line.notes || null,
        }, { transaction: t }))
      );

      await t.commit();

      // Fire notification after commit (non-blocking)
      const User = require('../models').User;
      const user = await User.findByPk(userId);
      const actorUser = user ? { id: user.id, full_name: user.full_name } : { id: userId, full_name: 'System' };
      
      NotificationService.onOrderCreated(order, actorUser)
        .catch((err) => console.error('Notification error:', err.message));

      return this._findOrderWithRelations(order.id);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Update order lines — only allowed on DRAFT orders.
   * Runs inside a transaction with row lock.
   */
  static async updateOrderLines(orderId, lines) {
    const t = await sequelize.transaction();
    try {
      // Lock the order row so no concurrent state change can sneak in
      const order = await Order.findByPk(orderId, {
        lock: true,
        transaction: t,
      });

      if (!order) throw new Error('Order not found');
      if (order.status !== ORDER_STATUSES.DRAFT) {
        throw new Error('Only draft orders can be updated');
      }

      await OrderLine.destroy({ where: { order_id: orderId }, transaction: t });

      await Promise.all(
        lines.map((line) => OrderLine.create({
          order_id: orderId,
          item_id: line.item_id,
          quantity: line.quantity,
          notes: line.notes || null,
        }, { transaction: t }))
      );

      await t.commit();
      return this._findOrderWithRelations(orderId);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // ─── State Transitions ───────────────────────────────────────────────────────

  /**
   * Core transition engine.
   * Every method below uses this internally — always runs inside a locked transaction.
   *
   * Idempotency: if the order is already in `newStatus`, returns it silently (HTTP 200).
   * Invalid transition: throws descriptive error (HTTP 400/409).
   */
  static async _transition(orderId, newStatus, userId, extras = {}) {
    const t = await sequelize.transaction();
    try {
      // ── Pessimistic lock on the order row ──────────────────────────────
      const order = await Order.findByPk(orderId, {
        lock: true,               // maps to FOR UPDATE
        transaction: t,
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // ── Idempotency guard: already in target state ─────────────────────
      if (order.status === newStatus) {
        await t.commit();
        return this._findOrderWithRelations(orderId);
      }

      // ── Transition validation ─────────────────────────────────────────
      if (!canTransitionTo(order.status, newStatus)) {
        throw new Error(
          `Cannot transition order #${order.order_number} from '${order.status}' to '${newStatus}'`
        );
      }

      // ── Build update payload ─────────────────────────────────────────────
      const updateData = { status: newStatus };

      switch (newStatus) {
        case ORDER_STATUSES.SUBMITTED:
          updateData.submitted_at = new Date();
          break;
        case ORDER_STATUSES.PREPARING:
          updateData.prepared_at = new Date();
          break;
        case ORDER_STATUSES.SHIPPING:
          updateData.shipped_at = new Date();
          break;
        case ORDER_STATUSES.RECEIVED:
          updateData.received_at = new Date();
          break;
        case ORDER_STATUSES.COMPLETED:
          updateData.completed_at = new Date();
          // Snapshot prices INSIDE the same locked transaction
          await this._snapshotPrices(orderId, t);
          break;
        case ORDER_STATUSES.CANCELLED:
          updateData.cancelled_at = new Date();
          updateData.cancel_reason = extras.cancel_reason || null;
          break;
      }

      await order.update(updateData, { transaction: t });

      await t.commit();

      // Fire notification after commit (non-blocking)
      NotificationService.notifyOrderStatusChange(order, newStatus, userId)
        .catch((err) => console.error('Notification error:', err.message));

      return this._findOrderWithRelations(orderId);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // ─── Public transition methods ──────────────────────────────────────────────

  static async submitOrder(orderId, userId) {
    return this._transition(orderId, ORDER_STATUSES.SUBMITTED, userId);
  }

  static async prepareOrder(orderId, userId) {
    return this._transition(orderId, ORDER_STATUSES.PREPARING, userId);
  }

  static async shipOrder(orderId, userId) {
    return this._transition(orderId, ORDER_STATUSES.SHIPPING, userId);
  }

  static async receiveOrder(orderId, userId, lines = []) {
    // First persist received quantities inside a locked transaction
    if (lines.length > 0) {
      const t = await sequelize.transaction();
      try {
        const order = await Order.findByPk(orderId, { lock: true, transaction: t });
        if (!order) throw new Error('Order not found');

        await Promise.all(
          lines.map((l) =>
            OrderLine.update(
              { received_quantity: l.received_quantity },
              { where: { id: l.id, order_id: orderId }, transaction: t }
            )
          )
        );

        await t.commit();
      } catch (err) {
        await t.rollback();
        throw err;
      }
    }

    return this._transition(orderId, ORDER_STATUSES.RECEIVED, userId);
  }

  static async completeOrder(orderId, userId) {
    return this._transition(orderId, ORDER_STATUSES.COMPLETED, userId);
  }

  static async cancelOrder(orderId, userId, reason) {
    return this._transition(orderId, ORDER_STATUSES.CANCELLED, userId, {
      cancel_reason: reason,
    });
  }

  // kept for legacy compatibility — no longer part of the main workflow
  static async disputeOrder(orderId, userId, reason) {
    return this._transition(orderId, ORDER_STATUSES.CANCELLED, userId, {
      cancel_reason: reason,
    });
  }

  // ─── Price Snapshot ─────────────────────────────────────────────────────────

  /**
   * Snapshot current prices for all lines of an order.
   * MUST be called inside a transaction — shares the transaction passed by caller.
   *
   * @param {number} orderId
   * @param {Transaction} t  - Active Sequelize transaction (from _transition)
   */
  static async _snapshotPrices(orderId, t) {
    const lines = await OrderLine.findAll({
      where: { order_id: orderId },
      include: [{ model: Item, as: 'item' }],
      lock: true,
      transaction: t,
    });

    const today = new Date().toISOString().slice(0, 10);
    let totalAmount = 0;

    for (const line of lines) {
      // Find the currently active price (locked row on price_master too)
      const priceRow = await PriceMaster.findOne({
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
        lock: true,
        transaction: t,
      });

      const unitPrice = priceRow ? parseFloat(priceRow.price) : 0;
      const qty = parseFloat(line.received_quantity || line.quantity || 0);
      const lineTotal = Math.round(unitPrice * qty * 100) / 100;

      await line.update(
        { unit_price: unitPrice, total_price: lineTotal },
        { transaction: t }
      );

      totalAmount += lineTotal;
    }

    // Update order total atomically
    await Order.update(
      { total_amount: totalAmount },
      { where: { id: orderId }, transaction: t }
    );
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Reload order with all relations.
   * Used as the return value after every transition.
   */
  static async _findOrderWithRelations(orderId) {
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
