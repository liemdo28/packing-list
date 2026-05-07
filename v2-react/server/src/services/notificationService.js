/**
 * Notification Service
 * Handles creating and dispatching notifications for order events
 */
const { Notification, User } = require('../models');
const { Op } = require('sequelize');

// Event types
const EVENT_TYPES = {
  ORDER_CREATED: 'order_created',
  ORDER_SUBMITTED: 'order_submitted',
  SUPPLIER_REVIEWING: 'supplier_reviewing',
  SUPPLIER_ACCEPTED: 'supplier_accepted',
  SUPPLIER_REJECTED: 'supplier_rejected',
  SUPPLIER_CHANGED_QUANTITY: 'supplier_changed_quantity',
  PREPARING_STARTED: 'preparing_started',
  ORDER_SHIPPED: 'order_shipped',
  RECEIVING_STARTED: 'receiving_started',
  DISCREPANCY_DETECTED: 'discrepancy_detected',
  ORDER_RECEIVED:  'order_received',
  ORDER_COMPLETED: 'order_completed',
  ORDER_CANCELLED: 'order_cancelled',
  ORDER_DELAYED: 'order_delayed',
  ADMIN_OVERRIDE: 'admin_override',
  ITEM_QUANTITY_CHANGED: 'item_quantity_changed',
  SHIPMENT_CONFIRMED: 'shipment_confirmed',
};

// Notification types
const NOTIF_TYPES = {
  ORDER: 'order',
  DISCREPANCY: 'discrepancy',
  SHIPMENT: 'shipment',
  ALERT: 'alert',
  SYSTEM: 'system',
};

// Severity levels
const SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Create a notification for a user
 */
async function createNotification(data) {
  const {
    userId,
    orderId,
    orderNumber,
    eventType,
    title,
    message,
    type = NOTIF_TYPES.ORDER,
    severity = SEVERITY.MEDIUM,
    sourceStore,
    targetStore,
    actorUser,
    deepLinkUrl,
    metadata = {},
  } = data;

  const notification = await Notification.create({
    user_id: userId,
    order_id: orderId,
    order_number: orderNumber,
    event_type: eventType,
    title,
    message,
    type,
    severity,
    source_store_id: sourceStore?.id,
    source_store_name: sourceStore?.name,
    target_store_id: targetStore?.id,
    target_store_name: targetStore?.name,
    actor_user_id: actorUser?.id,
    actor_user_name: actorUser?.name,
    deep_link_url: deepLinkUrl,
    metadata,
  });

  // Emit socket event for real-time updates
  emitNotification(userId, notification);

  return notification;
}

/**
 * Create notifications for multiple users
 */
async function createBulkNotifications(notifications) {
  const created = await Notification.bulkCreate(
    notifications.map(n => ({
      user_id: n.userId,
      order_id: n.orderId,
      order_number: n.orderNumber,
      event_type: n.eventType,
      title: n.title,
      message: n.message,
      type: n.type || NOTIF_TYPES.ORDER,
      severity: n.severity || SEVERITY.MEDIUM,
      source_store_id: n.sourceStore?.id,
      source_store_name: n.sourceStore?.name,
      target_store_id: n.targetStore?.id,
      target_store_name: n.targetStore?.name,
      actor_user_id: n.actorUser?.id,
      actor_user_name: n.actorUser?.name,
      deep_link_url: n.deepLinkUrl,
      metadata: n.metadata || {},
    }))
  );

  // Emit events for each user
  created.forEach(notif => {
    emitNotification(notif.user_id, notif);
  });

  return created;
}

/**
 * Notify all users in a store
 */
async function notifyStore(storeId, storeName, data) {
  const users = await User.findAll({
    where: { store_id: storeId },
    attributes: ['id'],
  });

  const notifications = users.map(user => ({
    ...data,
    userId: user.id,
    targetStore: { id: storeId, name: storeName },
  }));

  return createBulkNotifications(notifications);
}

/**
 * Notify all admins
 */
async function notifyAdmins(data) {
  const admins = await User.findAll({
    where: { role: 'admin' },
    attributes: ['id'],
  });

  const notifications = admins.map(admin => ({
    ...data,
    userId: admin.id,
  }));

  return createBulkNotifications(notifications);
}

// Simulated socket.io emit - will be connected in app.js
let emitFn = null;
function setEmitFunction(fn) {
  emitFn = fn;
}

function emitNotification(userId, notification) {
  if (emitFn) {
    emitFn(userId, notification.toJSON ? notification.toJSON() : notification);
  }
}

/**
 * Order event handlers
 */
async function onOrderCreated(order, actorUser) {
  const requesterStore = await order.getFromStore();
  
  // Notify supplier store
  const supplierStore = await order.getToStore();
  await notifyStore(supplierStore.id, supplierStore.name, {
    orderId: order.id,
    orderNumber: order.order_number || `ORD-${order.id}`,
    eventType: EVENT_TYPES.ORDER_CREATED,
    title: 'New Order Request',
    message: `New order from ${requesterStore?.name || 'Unknown'}`,
    type: NOTIF_TYPES.ORDER,
    severity: SEVERITY.MEDIUM,
    sourceStore: { id: requesterStore?.id, name: requesterStore?.name },
    actorUser,
    deepLinkUrl: `/orders/${order.id}`,
    metadata: { fromStoreId: requesterStore?.id },
  });

  // Notify admins
  await notifyAdmins({
    orderId: order.id,
    orderNumber: order.order_number || `ORD-${order.id}`,
    eventType: EVENT_TYPES.ORDER_CREATED,
    title: 'New Order Created',
    message: `${requesterStore?.name || 'Unknown'} created order #${order.order_number || order.id}`,
    type: NOTIF_TYPES.ORDER,
    severity: SEVERITY.LOW,
    sourceStore: { id: requesterStore?.id, name: requesterStore?.name },
  });
}

async function onSupplierAccepted(order, actorUser) {
  const requesterStore = await order.getFromStore();
  const supplierStore = await order.getToStore();
  
  // Notify requester
  const requesterUsers = await User.findAll({
    where: { store_id: requesterStore?.id },
  });

  await createBulkNotifications(requesterUsers.map(user => ({
    userId: user.id,
    orderId: order.id,
    orderNumber: order.order_number || `ORD-${order.id}`,
    eventType: EVENT_TYPES.SUPPLIER_ACCEPTED,
    title: 'Order Accepted',
    message: `${supplierStore?.name || 'Supplier'} accepted Order #${order.order_number || order.id}`,
    type: NOTIF_TYPES.ORDER,
    severity: SEVERITY.MEDIUM,
    sourceStore: { id: supplierStore?.id, name: supplierStore?.name },
    actorUser,
    deepLinkUrl: `/orders/${order.id}`,
  })));
}

async function onSupplierRejected(order, actorUser, reason = '') {
  const requesterStore = await order.getFromStore();
  const supplierStore = await order.getToStore();

  const requesterUsers = await User.findAll({
    where: { store_id: requesterStore?.id },
  });

  await createBulkNotifications(requesterUsers.map(user => ({
    userId: user.id,
    orderId: order.id,
    orderNumber: order.order_number || `ORD-${order.id}`,
    eventType: EVENT_TYPES.SUPPLIER_REJECTED,
    title: 'Order Rejected',
    message: `${supplierStore?.name || 'Supplier'} rejected Order #${order.order_number || order.id}${reason ? `: ${reason}` : ''}`,
    type: NOTIF_TYPES.ALERT,
    severity: SEVERITY.HIGH,
    sourceStore: { id: supplierStore?.id, name: supplierStore?.name },
    actorUser,
    deepLinkUrl: `/orders/${order.id}`,
  })));

  // Alert admins
  await notifyAdmins({
    orderId: order.id,
    orderNumber: order.order_number || `ORD-${order.id}`,
    eventType: EVENT_TYPES.SUPPLIER_REJECTED,
    title: 'Order Rejected by Supplier',
    message: `${supplierStore?.name || 'Supplier'} rejected order #${order.order_number || order.id}`,
    type: NOTIF_TYPES.ALERT,
    severity: SEVERITY.HIGH,
    sourceStore: { id: supplierStore?.id, name: supplierStore?.name },
  });
}

async function onQuantityChanged(order, itemName, oldQty, newQty, actorUser) {
  const requesterStore = await order.getFromStore();
  const supplierStore = await order.getToStore();

  // Notify requester of quantity change
  const requesterUsers = await User.findAll({
    where: { store_id: requesterStore?.id },
  });

  await createBulkNotifications(requesterUsers.map(user => ({
    userId: user.id,
    orderId: order.id,
    orderNumber: order.order_number || `ORD-${order.id}`,
    eventType: EVENT_TYPES.SUPPLIER_CHANGED_QUANTITY,
    title: 'Quantity Changed',
    message: `${supplierStore?.name || 'Supplier'} changed ${itemName} quantity from ${oldQty} → ${newQty}`,
    type: NOTIF_TYPES.DISCREPANCY,
    severity: newQty < oldQty ? SEVERITY.HIGH : SEVERITY.MEDIUM,
    sourceStore: { id: supplierStore?.id, name: supplierStore?.name },
    targetStore: { id: requesterStore?.id, name: requesterStore?.name },
    actorUser,
    deepLinkUrl: `/orders/${order.id}`,
  })));
}

async function onOrderShipped(order, actorUser) {
  const requesterStore = await order.getFromStore();
  const supplierStore = await order.getToStore();

  // Notify requester of shipment
  const requesterUsers = await User.findAll({
    where: { store_id: requesterStore?.id },
  });

  await createBulkNotifications(requesterUsers.map(user => ({
    userId: user.id,
    orderId: order.id,
    orderNumber: order.order_number || `ORD-${order.id}`,
    eventType: EVENT_TYPES.ORDER_SHIPPED,
    title: 'Order Shipped',
    message: `${supplierStore?.name || 'Supplier'} shipped Order #${order.order_number || order.id}`,
    type: NOTIF_TYPES.SHIPMENT,
    severity: SEVERITY.MEDIUM,
    sourceStore: { id: supplierStore?.id, name: supplierStore?.name },
    targetStore: { id: requesterStore?.id, name: requesterStore?.name },
    actorUser,
    deepLinkUrl: `/orders/${order.id}`,
  })));
}

async function onDiscrepancyDetected(order, itemName, expectedQty, actualQty, actorUser) {
  const requesterStore = await order.getFromStore();
  const supplierStore = await order.getToStore();

  // Notify supplier of receiving discrepancy
  const supplierUsers = await User.findAll({
    where: { store_id: supplierStore?.id },
  });

  await createBulkNotifications(supplierUsers.map(user => ({
    userId: user.id,
    orderId: order.id,
    orderNumber: order.order_number || `ORD-${order.id}`,
    eventType: EVENT_TYPES.DISCREPANCY_DETECTED,
    title: 'Receiving Discrepancy',
    message: `Discrepancy detected for ${itemName}: expected ${expectedQty}, received ${actualQty}`,
    type: NOTIF_TYPES.DISCREPANCY,
    severity: SEVERITY.HIGH,
    sourceStore: { id: requesterStore?.id, name: requesterStore?.name },
    targetStore: { id: supplierStore?.id, name: supplierStore?.name },
    actorUser,
    deepLinkUrl: `/orders/${order.id}`,
  })));

  // Alert admins
  await notifyAdmins({
    orderId: order.id,
    orderNumber: order.order_number || `ORD-${order.id}`,
    eventType: EVENT_TYPES.DISCREPANCY_DETECTED,
    title: 'Discrepancy Alert',
    message: `Receiving discrepancy for Order #${order.order_number || order.id}: ${itemName} (expected: ${expectedQty}, actual: ${actualQty})`,
    type: NOTIF_TYPES.DISCREPANCY,
    severity: SEVERITY.CRITICAL,
    sourceStore: { id: requesterStore?.id, name: requesterStore?.name },
    targetStore: { id: supplierStore?.id, name: supplierStore?.name },
  });
}

async function onOrderCompleted(order, actorUser) {
  const requesterStore = await order.getFromStore();
  const supplierStore = await order.getToStore();

  // Notify supplier of completion
  const supplierUsers = await User.findAll({
    where: { store_id: supplierStore?.id },
  });

  await createBulkNotifications(supplierUsers.map(user => ({
    userId: user.id,
    orderId: order.id,
    orderNumber: order.order_number || `ORD-${order.id}`,
    eventType: EVENT_TYPES.ORDER_COMPLETED,
    title: 'Order Completed',
    message: `Order #${order.order_number || order.id} has been completed`,
    type: NOTIF_TYPES.ORDER,
    severity: SEVERITY.LOW,
    sourceStore: { id: requesterStore?.id, name: requesterStore?.name },
    targetStore: { id: supplierStore?.id, name: supplierStore?.name },
    actorUser,
    deepLinkUrl: `/orders/${order.id}`,
  })));
}

async function onOrderDelayed(order, reason, actorUser) {
  const requesterStore = await order.getFromStore();
  const supplierStore = await order.getToStore();

  // Notify requester
  const requesterUsers = await User.findAll({
    where: { store_id: requesterStore?.id },
  });

  await createBulkNotifications(requesterUsers.map(user => ({
    userId: user.id,
    orderId: order.id,
    orderNumber: order.order_number || `ORD-${order.id}`,
    eventType: EVENT_TYPES.ORDER_DELAYED,
    title: 'Order Delayed',
    message: `Order #${order.order_number || order.id} is delayed: ${reason}`,
    type: NOTIF_TYPES.ALERT,
    severity: SEVERITY.HIGH,
    sourceStore: { id: supplierStore?.id, name: supplierStore?.name },
    actorUser,
    deepLinkUrl: `/orders/${order.id}`,
  })));

  // Alert admins
  await notifyAdmins({
    orderId: order.id,
    orderNumber: order.order_number || `ORD-${order.id}`,
    eventType: EVENT_TYPES.ORDER_DELAYED,
    title: 'Delayed Order Alert',
    message: `Order #${order.order_number || order.id} is delayed: ${reason}`,
    type: NOTIF_TYPES.ALERT,
    severity: SEVERITY.HIGH,
  });
}

async function onAdminOverride(order, reason, actorUser) {
  // Alert admins and relevant stores
  await notifyAdmins({
    orderId: order.id,
    orderNumber: order.order_number || `ORD-${order.id}`,
    eventType: EVENT_TYPES.ADMIN_OVERRIDE,
    title: 'Admin Override',
    message: `Admin ${actorUser?.full_name || 'Admin'} overrode order #${order.order_number || order.id}: ${reason}`,
    type: NOTIF_TYPES.ALERT,
    severity: SEVERITY.CRITICAL,
    actorUser,
    deepLinkUrl: `/orders/${order.id}`,
  });
}

/**
 * Handle order status change notification
 * Called from OrderService after each state transition
 */
async function notifyOrderStatusChange(order, newStatus, userId) {
  const actorUser = { id: userId, full_name: 'System' };
  
  try {
    const User = require('../models').User;
    const user = await User.findByPk(userId);
    if (user) {
      actorUser.full_name = user.full_name;
    }
  } catch (e) {
    // Ignore - use default actor name
  }

  const statusMessages = {
    submitted:  { title: 'Order Submitted',  severity: SEVERITY.MEDIUM },
    preparing:  { title: 'Order Preparing',  severity: SEVERITY.MEDIUM },
    shipping:   { title: 'Order Shipped',    severity: SEVERITY.MEDIUM },
    received:   { title: 'Order Received',   severity: SEVERITY.HIGH   },
    completed:  { title: 'Order Completed',  severity: SEVERITY.LOW    },
    cancelled:  { title: 'Order Cancelled',  severity: SEVERITY.HIGH   },
  };

  const statusInfo = statusMessages[newStatus] || { title: 'Order Updated', severity: SEVERITY.MEDIUM };

  const fromStore = await order.getFromStore();
  const toStore = await order.getToStore();

  // Notify the to-store (destination) when order progresses through early stages
  if (['submitted', 'preparing', 'completed'].includes(newStatus)) {
    await notifyStore(toStore?.id, toStore?.name, {
      orderId: order.id,
      orderNumber: order.order_number,
      eventType: `order_${newStatus}`,
      title: statusInfo.title,
      message: `Order #${order.order_number} is now: ${statusInfo.title}`,
      type: NOTIF_TYPES.ORDER,
      severity: statusInfo.severity,
      sourceStore: { id: fromStore?.id, name: fromStore?.name },
      actorUser,
      deepLinkUrl: `/orders/${order.id}`,
    });
  }

  // When shipped — notify the destination store (incoming shipment)
  if (newStatus === 'shipping') {
    await notifyStore(toStore?.id, toStore?.name, {
      orderId: order.id,
      orderNumber: order.order_number,
      eventType: EVENT_TYPES.ORDER_SHIPPED,
      title: '📦 Incoming Shipment',
      message: `Order #${order.order_number} is on the way from ${fromStore?.name || 'sender'}`,
      type: NOTIF_TYPES.SHIPMENT,
      severity: SEVERITY.MEDIUM,
      sourceStore: { id: fromStore?.id, name: fromStore?.name },
      targetStore: { id: toStore?.id, name: toStore?.name },
      actorUser,
      deepLinkUrl: `/orders/${order.id}`,
    });
  }

  // When received — notify the from-store (sender confirmation)
  if (newStatus === 'received') {
    await notifyStore(fromStore?.id, fromStore?.name, {
      orderId: order.id,
      orderNumber: order.order_number,
      eventType: EVENT_TYPES.ORDER_RECEIVED,
      title: 'Order Received',
      message: `Order #${order.order_number} has been received at ${toStore?.name || 'destination'}`,
      type: NOTIF_TYPES.SHIPMENT,
      severity: SEVERITY.MEDIUM,
      sourceStore: { id: toStore?.id, name: toStore?.name },
      targetStore: { id: fromStore?.id, name: fromStore?.name },
      actorUser,
      deepLinkUrl: `/orders/${order.id}`,
    });
  }

  // Alert admins on completion/cancellation
  if (['completed', 'cancelled'].includes(newStatus)) {
    await notifyAdmins({
      orderId: order.id,
      orderNumber: order.order_number,
      eventType: `order_${newStatus}`,
      title: statusInfo.title,
      message: `Order #${order.order_number} has been ${newStatus}`,
      type: NOTIF_TYPES.ORDER,
      severity: statusInfo.severity,
      sourceStore: { id: fromStore?.id, name: fromStore?.name },
      targetStore: { id: toStore?.id, name: toStore?.name },
    });
  }
}

/**
 * Get unread count for a user
 */
async function getUnreadCount(userId) {
  return Notification.count({
    where: {
      user_id: userId,
      is_read: false,
    },
  });
}

/**
 * Get notifications for a user with pagination and filtering
 */
async function getNotifications(userId, options = {}) {
  const { page = 1, limit = 20, type, isRead, severity } = options;
  const offset = (page - 1) * limit;

  const where = { user_id: userId };
  
  if (type) {
    where.type = type;
  }
  
  if (isRead !== undefined) {
    where.is_read = isRead === 'true' || isRead === true;
  }
  
  if (severity) {
    where.severity = severity;
  }

  const { count, rows } = await Notification.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  return {
    notifications: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
}

/**
 * Mark notification as read
 */
async function markAsRead(notificationId, userId) {
  const notification = await Notification.findOne({
    where: { id: notificationId, user_id: userId },
  });

  if (notification) {
    notification.is_read = true;
    notification.read_at = new Date();
    await notification.save();
  }

  return notification;
}

/**
 * Mark all notifications as read for a user
 */
async function markAllAsRead(userId) {
  await Notification.update(
    { is_read: true, read_at: new Date() },
    { where: { user_id: userId, is_read: false } }
  );
}

/**
 * Delete old notifications (cleanup)
 */
async function cleanupOldNotifications(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return Notification.destroy({
    where: {
      created_at: { [Op.lt]: cutoffDate },
      is_read: true,
    },
  });
}

module.exports = {
  EVENT_TYPES,
  NOTIF_TYPES,
  SEVERITY,
  setEmitFunction,
  createNotification,
  createBulkNotifications,
  notifyStore,
  notifyAdmins,
  onOrderCreated,
  onSupplierAccepted,
  onSupplierRejected,
  onQuantityChanged,
  onOrderShipped,
  onDiscrepancyDetected,
  onOrderCompleted,
  onOrderDelayed,
  onAdminOverride,
  notifyOrderStatusChange,
  getUnreadCount,
  getNotifications,
  markAsRead,
  markAllAsRead,
  cleanupOldNotifications,
};
