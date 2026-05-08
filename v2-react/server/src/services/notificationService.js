const https = require('https');
const { Notification, User, Store } = require('../models');

// ─── Event → UI type mapping ─────────────────────────────────────────────────
const TYPE_MAP = {
  order_created:         'order',
  order_submitted:       'order',
  supplier_reviewing:    'order',
  supplier_accepted:     'order',
  quantity_changed:      'discrepancy',
  item_quantity_changed: 'discrepancy',
  supplier_rejected:     'alert',
  preparing_started:     'order',
  order_shipped:         'shipment',
  shipment_confirmed:    'shipment',
  receiving_started:     'shipment',
  discrepancy_detected:  'discrepancy',
  order_received:        'order',
  order_completed:       'order',
  order_cancelled:       'alert',
  order_delayed:         'alert',
  admin_override:        'alert',
};

// ─── Event → Severity mapping ────────────────────────────────────────────────
const SEVERITY_MAP = {
  order_created:         'low',
  order_submitted:       'medium',
  supplier_reviewing:    'medium',
  supplier_accepted:     'medium',
  quantity_changed:      'high',
  item_quantity_changed: 'high',
  supplier_rejected:     'high',
  preparing_started:     'low',
  order_shipped:         'medium',
  shipment_confirmed:    'medium',
  receiving_started:     'medium',
  discrepancy_detected:  'critical',
  order_received:        'medium',
  order_completed:       'medium',
  order_cancelled:       'high',
  order_delayed:         'high',
  admin_override:        'critical',
};

// Events that also trigger Telegram alert (set TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID env vars)
const TELEGRAM_EVENTS = new Set([
  'discrepancy_detected',
  'order_delayed',
  'admin_override',
  'supplier_rejected',
  'order_cancelled',
]);

class NotificationService {
  // ─── Core bulk insert ───────────────────────────────────────────────────────

  static async _insertForUsers(userIds, payload) {
    if (!userIds || userIds.length === 0) return;
    const rows = userIds.map((uid) => ({
      user_id: uid,
      title: payload.title,
      message: payload.message,
      type: payload.type || TYPE_MAP[payload.event_type] || 'order',
      event_type: payload.event_type || null,
      severity: payload.severity || SEVERITY_MAP[payload.event_type] || 'medium',
      actor_user_id: payload.actor_user_id || null,
      source_store_id: payload.source_store_id || null,
      target_store_id: payload.target_store_id || null,
      reference_type: payload.reference_type || null,
      reference_id: payload.reference_id || null,
      metadata: payload.metadata || null,
    }));
    await Notification.bulkCreate(rows);
  }

  static async _getUsersForStore(storeId, excludeUserId = null) {
    const users = await User.findAll({ where: { store_id: storeId, is_active: true } });
    return users.filter((u) => u.id !== excludeUserId).map((u) => u.id);
  }

  static async _getAdminUserIds(excludeUserId = null) {
    const users = await User.findAll({ where: { role: ['admin', 'accountant'], is_active: true } });
    return users.filter((u) => u.id !== excludeUserId).map((u) => u.id);
  }

  // ─── Convenience wrappers ───────────────────────────────────────────────────

  static async notifyStoreUsers(storeId, payload) {
    const ids = await this._getUsersForStore(storeId, payload.excludeUserId);
    return this._insertForUsers(ids, { ...payload, target_store_id: storeId });
  }

  static async notifyAdminsAndAccountants(payload) {
    const ids = await this._getAdminUserIds(payload.excludeUserId);
    return this._insertForUsers(ids, payload);
  }

  // ─── Main event dispatcher ──────────────────────────────────────────────────

  /**
   * Primary notification entry point.
   * Call this after every meaningful order state change.
   *
   * @param {object} order       - Order instance (with fromStore/toStore included, or just ids)
   * @param {string} eventType   - One of the EVENT_TYPES above
   * @param {number} actorUserId - Who triggered the event
   * @param {object} extras      - { reason, itemName, from, to } for context-rich messages
   */
  static async notifyOrderEvent(order, eventType, actorUserId, extras = {}) {
    try {
      const fromStore = order.fromStore || (await Store.findByPk(order.from_store_id));
      const toStore = order.toStore || (await Store.findByPk(order.to_store_id));

      const base = {
        event_type:      eventType,
        reference_type:  'order',
        reference_id:    order.id,
        actor_user_id:   actorUserId || null,
        source_store_id: order.from_store_id,
        excludeUserId:   actorUserId,
        metadata: {
          order_number: order.order_number,
          deep_link_url: `/orders/${order.id}`,
        },
      };

      switch (eventType) {
        // ── New order → notify supplier (from_store) ──────────────────────────
        case 'order_created':
        case 'order_submitted':
        case 'supplier_reviewing':
          await this.notifyStoreUsers(order.from_store_id, {
            ...base,
            title: `📦 New Order Request — ${order.order_number}`,
            message: `${toStore.code} is requesting items from ${fromStore.code}. Review and confirm quantities.`,
          });
          await this.notifyAdminsAndAccountants({
            ...base,
            title: `Order Submitted — ${order.order_number}`,
            message: `${toStore.code} → ${fromStore.code}: new order submitted, awaiting supplier review.`,
          });
          break;

        // ── Supplier accepted → notify requester ──────────────────────────────
        case 'supplier_accepted':
          await this.notifyStoreUsers(order.to_store_id, {
            ...base,
            title: `✅ Order Accepted — ${order.order_number}`,
            message: `${fromStore.code} accepted your order and will start preparing shortly.`,
          });
          break;

        // ── Quantity adjusted by supplier → notify requester ──────────────────
        case 'quantity_changed':
        case 'item_quantity_changed': {
          const { itemName, from: fromQty, to: toQty } = extras;
          await this.notifyStoreUsers(order.to_store_id, {
            ...base,
            event_type: 'quantity_changed',
            title: `⚠️ Quantity Adjusted — ${order.order_number}`,
            message: itemName
              ? `${fromStore.code} changed ${itemName}: ${fromQty} → ${toQty}`
              : `${fromStore.code} adjusted item quantities on order ${order.order_number}.`,
          });
          break;
        }

        // ── Supplier rejected → notify requester + admins ─────────────────────
        case 'supplier_rejected':
          await this.notifyStoreUsers(order.to_store_id, {
            ...base,
            title: `❌ Order Rejected — ${order.order_number}`,
            message: `${fromStore.code} cannot fulfill order ${order.order_number}. ${extras.reason ? `Reason: ${extras.reason}.` : 'Please create a new order.'}`,
          });
          await this.notifyAdminsAndAccountants({
            ...base,
            title: `Order Rejected — ${order.order_number}`,
            message: `${fromStore.code} rejected ${toStore.code}'s order. ${extras.reason ? `Reason: ${extras.reason}.` : ''}`,
          });
          break;

        // ── Preparing → notify requester ──────────────────────────────────────
        case 'preparing_started':
          await this.notifyStoreUsers(order.to_store_id, {
            ...base,
            title: `🔄 Order Preparing — ${order.order_number}`,
            message: `${fromStore.code} started packing your order.`,
          });
          break;

        // ── Shipped → notify requester + admins ───────────────────────────────
        case 'order_shipped':
        case 'shipment_confirmed':
          await this.notifyStoreUsers(order.to_store_id, {
            ...base,
            event_type: 'order_shipped',
            title: `🚚 Order Shipped — ${order.order_number}`,
            message: `${fromStore.code} shipped order ${order.order_number}. Confirm receipt when items arrive.`,
          });
          await this.notifyAdminsAndAccountants({
            ...base,
            event_type: 'order_shipped',
            title: `Shipped — ${order.order_number}`,
            message: `${fromStore.code} → ${toStore.code}: order is in transit.`,
          });
          break;

        // ── Receiving started / received ──────────────────────────────────────
        case 'receiving_started':
        case 'order_received':
          await this.notifyStoreUsers(order.from_store_id, {
            ...base,
            event_type: 'order_received',
            title: `📬 Items Received — ${order.order_number}`,
            message: `${toStore.code} confirmed receipt of order ${order.order_number}.`,
          });
          break;

        // ── Discrepancy → notify admins + supplier + requester ────────────────
        case 'discrepancy_detected':
          await this.notifyAdminsAndAccountants({
            ...base,
            title: `⚠️ Discrepancy — ${order.order_number}`,
            message: `Order ${order.order_number} (${fromStore.code} → ${toStore.code}) has quantity discrepancies that require review.`,
          });
          await this.notifyStoreUsers(order.from_store_id, {
            ...base,
            title: `⚠️ Discrepancy — ${order.order_number}`,
            message: `${toStore.code} reported quantity differences on order ${order.order_number}. Admin review required.`,
          });
          await this.notifyStoreUsers(order.to_store_id, {
            ...base,
            title: `⚠️ Discrepancy Logged — ${order.order_number}`,
            message: `Discrepancy recorded for order ${order.order_number}. An admin will review shortly.`,
          });
          break;

        // ── Completed → notify both stores + admins ───────────────────────────
        case 'order_completed':
          await this.notifyStoreUsers(order.from_store_id, {
            ...base,
            title: `✔️ Completed — ${order.order_number}`,
            message: `Order ${order.order_number} is complete. Pricing has been locked for reconciliation.`,
          });
          if (order.from_store_id !== order.to_store_id) {
            await this.notifyStoreUsers(order.to_store_id, {
              ...base,
              title: `✔️ Completed — ${order.order_number}`,
              message: `Order ${order.order_number} is complete. Pricing has been locked for reconciliation.`,
            });
          }
          await this.notifyAdminsAndAccountants({
            ...base,
            title: `Completed — ${order.order_number}`,
            message: `${fromStore.code} → ${toStore.code}: order completed and pricing locked.`,
          });
          break;

        // ── Cancelled → notify both stores + admins ───────────────────────────
        case 'order_cancelled':
          await this.notifyStoreUsers(order.from_store_id, {
            ...base,
            title: `🚫 Cancelled — ${order.order_number}`,
            message: `Order ${order.order_number} was cancelled. ${extras.reason ? `Reason: ${extras.reason}.` : ''}`,
          });
          if (order.from_store_id !== order.to_store_id) {
            await this.notifyStoreUsers(order.to_store_id, {
              ...base,
              title: `🚫 Cancelled — ${order.order_number}`,
              message: `Order ${order.order_number} was cancelled.`,
            });
          }
          await this.notifyAdminsAndAccountants({
            ...base,
            title: `Cancelled — ${order.order_number}`,
            message: `Order ${order.order_number} (${fromStore.code} → ${toStore.code}) was cancelled.`,
          });
          break;

        // ── Delayed/stuck → notify admins + both stores ───────────────────────
        case 'order_delayed':
          await this.notifyAdminsAndAccountants({
            ...base,
            title: `⏰ Order Delayed — ${order.order_number}`,
            message: `Order ${order.order_number} (${fromStore.code} → ${toStore.code}) has been inactive for over 48 hours.`,
          });
          await this.notifyStoreUsers(order.from_store_id, {
            ...base,
            title: `⏰ Delayed — ${order.order_number}`,
            message: `Order ${order.order_number} has been waiting over 48 hours with no action.`,
          });
          if (order.from_store_id !== order.to_store_id) {
            await this.notifyStoreUsers(order.to_store_id, {
              ...base,
              title: `⏰ Delayed — ${order.order_number}`,
              message: `Order ${order.order_number} has been waiting over 48 hours with no action.`,
            });
          }
          break;

        // ── Admin override ────────────────────────────────────────────────────
        case 'admin_override':
          await this.notifyStoreUsers(order.from_store_id, {
            ...base,
            title: `🔧 Admin Override — ${order.order_number}`,
            message: `An admin performed an override on order ${order.order_number}.`,
          });
          if (order.from_store_id !== order.to_store_id) {
            await this.notifyStoreUsers(order.to_store_id, {
              ...base,
              title: `🔧 Admin Override — ${order.order_number}`,
              message: `An admin performed an override on order ${order.order_number}.`,
            });
          }
          break;

        // ── Fallback ──────────────────────────────────────────────────────────
        default:
          await this.notifyStoreUsers(order.from_store_id, {
            ...base,
            title: `Order Update — ${order.order_number}`,
            message: `Order status changed to: ${eventType}.`,
          });
          if (order.from_store_id !== order.to_store_id) {
            await this.notifyStoreUsers(order.to_store_id, {
              ...base,
              title: `Order Update — ${order.order_number}`,
              message: `Order status changed to: ${eventType}.`,
            });
          }
      }

      // Optional Telegram alert for high-priority events
      if (TELEGRAM_EVENTS.has(eventType) && process.env.TELEGRAM_BOT_TOKEN) {
        const icon = eventType === 'discrepancy_detected' ? '⚠️'
          : eventType === 'order_delayed'    ? '⏰'
          : eventType === 'admin_override'   ? '🔧'
          : eventType === 'supplier_rejected' ? '❌'
          : '🚫';
        this._sendTelegram(
          `${icon} *[${eventType.replace(/_/g, ' ').toUpperCase()}]*\n` +
          `Order: \`${order.order_number}\`\n` +
          `Route: ${fromStore?.code} → ${toStore?.code}`
        ).catch(() => {});
      }
    } catch (err) {
      console.error(`[NotificationService] notifyOrderEvent error [${eventType}]:`, err.message);
    }
  }

  // ─── Backward-compat wrapper ────────────────────────────────────────────────

  static async notifyOrderStatusChange(order, newStatus, userId) {
    const STATUS_TO_EVENT = {
      draft:                        'order_created',
      submitted:                    'order_submitted',
      supplier_reviewing:           'supplier_reviewing',
      supplier_accepted:            'supplier_accepted',
      supplier_rejected:            'supplier_rejected',
      preparing:                    'preparing_started',
      processing:                   'preparing_started',
      shipping:                     'order_shipped',
      in_transit:                   'order_shipped',
      ready_to_ship:                'order_shipped',
      receiving_review:             'order_received',
      received:                     'order_received',
      received_pending_confirmation:'order_received',
      discrepancy_review:           'discrepancy_detected',
      completed:                    'order_completed',
      cancelled:                    'order_cancelled',
    };
    const eventType = STATUS_TO_EVENT[newStatus] || newStatus;
    return this.notifyOrderEvent(order, eventType, userId);
  }

  // ─── Unread count ───────────────────────────────────────────────────────────

  static async getUnreadCount(userId) {
    return Notification.count({ where: { user_id: userId, is_read: false } });
  }

  // ─── Telegram ───────────────────────────────────────────────────────────────

  static _sendTelegram(text) {
    return new Promise((resolve, reject) => {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      if (!token || !chatId) return resolve();

      const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' });
      const req = https.request(
        {
          hostname: 'api.telegram.org',
          path: `/bot${token}/sendMessage`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        },
        (res) => {
          res.resume();
          res.on('end', resolve);
        }
      );
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}

module.exports = NotificationService;
