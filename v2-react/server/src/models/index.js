const sequelize = require('../config/database');
const Store = require('./Store');
const User = require('./User');
const Item = require('./Item');
const PriceMaster = require('./PriceMaster');
const Order = require('./Order');
const OrderLine = require('./OrderLine');
const Notification = require('./Notification');
const MonthlySummary = require('./MonthlySummary');
const Invoice = require('./Invoice');
const InvoiceLine = require('./InvoiceLine');
const AuditLog = require('./AuditLog');

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

// MonthlySummary <-> Store
MonthlySummary.belongsTo(Store, { foreignKey: 'from_store_id', as: 'fromStore' });
MonthlySummary.belongsTo(Store, { foreignKey: 'to_store_id', as: 'toStore' });
MonthlySummary.belongsTo(User, { foreignKey: 'reconciled_by', as: 'reconciler' });

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
  MonthlySummary,
  Invoice,
  InvoiceLine,
  AuditLog,
};
