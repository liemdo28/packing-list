const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  invoice_number: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },
  supplier_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Four Season',
  },
  paid_by_store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  on_behalf_of_store_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  invoice_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('pending', 'reconciled', 'disputed'),
    defaultValue: 'pending',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  tableName: 'invoices',
});

module.exports = Invoice;