// Central barrel — imports from domain model locations
const sequelize = require('../config/database');
const Store = require('./domains/user/models/Store');
const User = require('./domains/user/models/User');
const Item = require('./domains/inventory/models/Item');
const PriceMaster = require('./domains/inventory/models/PriceMaster');
const Order = require('./domains/order/models/Order');
const OrderLine = require('./domains/order/models/OrderLine');
const Notification = require('./domains/notification/models/Notification');
const Invoice = require('./domains/invoice/models/Invoice');
const InvoiceLine = require('./domains/invoice/models/InvoiceLine');
const AuditLog = require('./domains/audit/models/AuditLog');

// User <-> Store
Store.hasMany(User, { foreignKey: 'store_id', as: 'users' });
User.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

// PriceMaster <-> Item
Item.hasMany(PriceMaster, { foreignKey: 'item_id', as: 'prices' });
PriceMaster.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });
PriceMaster.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Order <-> Store
Store.hasMany(Order, { foreignKey: 'from_store_id', as: 'outgoing_orders' });
Store.hasMany(Order, { foreignKey: 'to_store_id', as: 'incoming_orders' });
Order.belongsTo(Store, { foreignKey: 'from_store_id', as: 'fromStore' });
Order.belongsTo(Store, { foreignKey: 'to_store_id', as: 'toStore' });
Order.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// OrderLine <-> Order, Item
Order.hasMany(OrderLine, { foreignKey: 'order_id', as: 'lines' });
OrderLine.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderLine.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });

// Notification <-> User
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Invoice <-> Store
Invoice.belongsTo(Store, { foreignKey: 'paid_by_store_id', as: 'paidByStore' });
Invoice.belongsTo(Store, { foreignKey: 'on_behalf_of_store_id', as: 'onBehalfOfStore' });
Invoice.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Invoice.belongsTo(User, { foreignKey: 'reconciled_by', as: 'reconciler' });
Invoice.hasMany(InvoiceLine, { foreignKey: 'invoice_id', as: 'lines' });
InvoiceLine.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
InvoiceLine.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });

// AuditLog <-> User
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  Store,
  User,
  Item,
  PriceMaster,
  Order,
  OrderLine,
  Notification,
  Invoice,
  InvoiceLine,
  AuditLog,
};