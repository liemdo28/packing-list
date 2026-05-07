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
      'draft',
      'submitted',
      'preparing',
      'shipping',
      'received',
      'completed',
      'cancelled'
    ),
    defaultValue: 'draft',
  },
  recipient_name: {
    type: DataTypes.STRING(100),
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