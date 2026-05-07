const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const OrderLine = sequelize.define('OrderLine', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  total_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  confirmed_quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  received_quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  supplier_note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  receiver_note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  discrepancy_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  item_status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'adjusted', 'short', 'missing'),
    defaultValue: 'pending',
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'order_lines',
});

module.exports = OrderLine;