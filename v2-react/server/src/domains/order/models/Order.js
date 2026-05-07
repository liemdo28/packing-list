const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  from_store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  to_store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(
      // new canonical statuses
      'draft',
      'supplier_reviewing',
      'supplier_accepted',
      'preparing',
      'shipping',
      'receiving_review',
      'discrepancy_review',
      'completed',
      'supplier_rejected',
      'cancelled',
      // legacy — keep until all in-flight orders are migrated
      'submitted',
      'processing',
      'ready_to_ship',
      'in_transit',
      'received_pending_confirmation',
      'disputed'
    ),
    defaultValue: 'draft',
  },
  ready_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  accepted_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rejected_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  supplier_note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  prepared_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  shipped_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  received_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancel_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'orders',
});

module.exports = Order;