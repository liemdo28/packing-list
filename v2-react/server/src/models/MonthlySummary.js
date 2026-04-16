const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MonthlySummary = sequelize.define('MonthlySummary', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  from_store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  to_store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  total_orders: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_items: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  is_reconciled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  reconciled_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reconciled_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'monthly_summaries',
});

module.exports = MonthlySummary;
