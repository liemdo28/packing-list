const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Denormalized for fast display without JOIN
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  order_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  event_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('order', 'invoice', 'system', 'alert', 'discrepancy', 'shipment'),
    defaultValue: 'order',
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium',
  },
  // FK references for associations
  actor_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  source_store_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  target_store_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // Denormalized names for fast display
  source_store_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  target_store_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  actor_user_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  reference_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  reference_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  deep_link_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'notifications',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['order_id'] },
    { fields: ['is_read'] },
    { fields: ['event_type'] },
    { fields: ['created_at'] },
  ],
});

module.exports = Notification;
