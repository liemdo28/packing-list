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

    const statusMessages = {
      submitted: `Order ${order.order_number} has been submitted (${fromStore.code} -> ${toStore.code})`,
      preparing: `Order ${order.order_number} is being prepared by ${fromStore.code}`,
      shipping:  `Order ${order.order_number} is on the way to ${toStore.code} — please confirm receipt`,
      received:  `Order ${order.order_number} has been received by ${toStore.code}`,
      completed: `Order ${order.order_number} has been completed`,
      cancelled: `Order ${order.order_number} has been cancelled`,
    };

    const message = statusMessages[newStatus] || `Order ${order.order_number} status changed to ${newStatus}`;
    const title = `Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`;

    // Notify users of both stores
    await this.notifyStoreUsers(order.from_store_id, {
      title,
      message,
      type: 'order',
      referenceType: 'order',
      referenceId: order.id,
      excludeUserId: userId,
    });

    if (order.from_store_id !== order.to_store_id) {
      await this.notifyStoreUsers(order.to_store_id, {
        title,
        message,
        type: 'order',
        referenceType: 'order',
        referenceId: order.id,
        excludeUserId: userId,
      });
    }

    // Also notify admins
    await this.notifyAdminsAndAccountants({
      title,
      message,
      type: 'order',
      referenceType: 'order',
      referenceId: order.id,
      excludeUserId: userId,
    });
  }

  static async getUnreadCount(userId) {
    return Notification.count({
      where: { user_id: userId, is_read: false },
    });
  }
}

module.exports = NotificationService;
