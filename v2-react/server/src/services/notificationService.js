const { Notification, User, Store } = require('../models');

class NotificationService {
  static async createNotification({ userId, title, message, type = 'order', referenceType = null, referenceId = null }) {
    return Notification.create({
      user_id: userId,
      title,
      message,
      type,
      reference_type: referenceType,
      reference_id: referenceId,
    });
  }

  static async notifyStoreUsers(storeId, { title, message, type, referenceType, referenceId, excludeUserId }) {
    const users = await User.findAll({
      where: { store_id: storeId, is_active: true },
    });

    const notifications = users
      .filter(u => u.id !== excludeUserId)
      .map(u => ({
        user_id: u.id,
        title,
        message,
        type,
        reference_type: referenceType,
        reference_id: referenceId,
      }));

    if (notifications.length > 0) {
      await Notification.bulkCreate(notifications);
    }
  }

  static async notifyAdminsAndAccountants({ title, message, type, referenceType, referenceId, excludeUserId }) {
    const users = await User.findAll({
      where: { role: ['admin', 'accountant'], is_active: true },
    });

    const notifications = users
      .filter(u => u.id !== excludeUserId)
      .map(u => ({
        user_id: u.id,
        title,
        message,
        type,
        reference_type: referenceType,
        reference_id: referenceId,
      }));

    if (notifications.length > 0) {
      await Notification.bulkCreate(notifications);
    }
  }

  static async notifyOrderStatusChange(order, newStatus, userId) {
    const fromStore = await Store.findByPk(order.from_store_id);
    const toStore = await Store.findByPk(order.to_store_id);
    const ref = { type: 'order', referenceType: 'order', referenceId: order.id, excludeUserId: userId };

    // Targeted notifications per status — notify only the store that needs to act
    switch (newStatus) {
      // Supplier needs to review → notify from_store (supplier)
      case 'supplier_reviewing':
      case 'submitted':
        await this.notifyStoreUsers(order.from_store_id, {
          ...ref,
          title: `📦 New Order Request — ${order.order_number}`,
          message: `${toStore.code} is requesting items from ${fromStore.code}. Please review and confirm quantities.`,
        });
        await this.notifyAdminsAndAccountants({
          ...ref,
          title: `Order Submitted — ${order.order_number}`,
          message: `${toStore.code} → ${fromStore.code}: order submitted, waiting for supplier review.`,
        });
        break;

      // Supplier accepted → notify to_store (requester)
      case 'supplier_accepted':
        await this.notifyStoreUsers(order.to_store_id, {
          ...ref,
          title: `✅ Order Accepted — ${order.order_number}`,
          message: `${fromStore.code} accepted your order and will start preparing.`,
        });
        break;

      // Supplier rejected → notify to_store
      case 'supplier_rejected':
        await this.notifyStoreUsers(order.to_store_id, {
          ...ref,
          title: `❌ Order Rejected — ${order.order_number}`,
          message: `${fromStore.code} could not fulfill order ${order.order_number}. Please create a new order.`,
        });
        await this.notifyAdminsAndAccountants({
          ...ref,
          title: `Order Rejected — ${order.order_number}`,
          message: `${fromStore.code} rejected order from ${toStore.code}.`,
        });
        break;

      // Preparing / shipping → notify to_store so they know it's coming
      case 'preparing':
      case 'processing':
        await this.notifyStoreUsers(order.to_store_id, {
          ...ref,
          title: `🔄 Preparing — ${order.order_number}`,
          message: `${fromStore.code} has started preparing your order.`,
        });
        break;

      case 'shipping':
      case 'in_transit':
      case 'shipped':
        await this.notifyStoreUsers(order.to_store_id, {
          ...ref,
          title: `🚚 Shipped — ${order.order_number}`,
          message: `${fromStore.code} has shipped order ${order.order_number}. Please confirm receipt when it arrives.`,
        });
        await this.notifyAdminsAndAccountants({
          ...ref,
          title: `Order Shipped — ${order.order_number}`,
          message: `${fromStore.code} → ${toStore.code}: order shipped.`,
        });
        break;

      // Received / discrepancy → notify from_store + admins
      case 'receiving_review':
      case 'received':
      case 'received_pending_confirmation':
        await this.notifyStoreUsers(order.from_store_id, {
          ...ref,
          title: `📬 Received — ${order.order_number}`,
          message: `${toStore.code} has confirmed receipt of order ${order.order_number}.`,
        });
        break;

      case 'discrepancy_review':
        await this.notifyAdminsAndAccountants({
          ...ref,
          title: `⚠️ Discrepancy — ${order.order_number}`,
          message: `Order ${order.order_number} (${fromStore.code} → ${toStore.code}) has quantity discrepancies that need review.`,
        });
        await this.notifyStoreUsers(order.from_store_id, {
          ...ref,
          title: `⚠️ Discrepancy — ${order.order_number}`,
          message: `${toStore.code} reported quantity discrepancies on order ${order.order_number}.`,
        });
        break;

      // Completed → notify both stores
      case 'completed':
        await this.notifyStoreUsers(order.from_store_id, {
          ...ref,
          title: `✔️ Completed — ${order.order_number}`,
          message: `Order ${order.order_number} has been completed and pricing is locked.`,
        });
        await this.notifyStoreUsers(order.to_store_id, {
          ...ref,
          title: `✔️ Completed — ${order.order_number}`,
          message: `Order ${order.order_number} has been completed and pricing is locked.`,
        });
        await this.notifyAdminsAndAccountants({
          ...ref,
          title: `Order Completed — ${order.order_number}`,
          message: `${fromStore.code} → ${toStore.code}: order completed.`,
        });
        break;

      // Cancelled → notify both stores
      case 'cancelled':
        await this.notifyStoreUsers(order.from_store_id, {
          ...ref,
          title: `🚫 Cancelled — ${order.order_number}`,
          message: `Order ${order.order_number} has been cancelled.`,
        });
        if (order.from_store_id !== order.to_store_id) {
          await this.notifyStoreUsers(order.to_store_id, {
            ...ref,
            title: `🚫 Cancelled — ${order.order_number}`,
            message: `Order ${order.order_number} has been cancelled.`,
          });
        }
        break;

      default:
        // Fallback: notify both stores generically
        await this.notifyStoreUsers(order.from_store_id, { ...ref, title: `Order Update — ${order.order_number}`, message: `Status changed to ${newStatus}.` });
        if (order.from_store_id !== order.to_store_id) {
          await this.notifyStoreUsers(order.to_store_id, { ...ref, title: `Order Update — ${order.order_number}`, message: `Status changed to ${newStatus}.` });
        }
    }
  }

  static async getUnreadCount(userId) {
    return Notification.count({
      where: { user_id: userId, is_read: false },
    });
  }
}

module.exports = NotificationService;
