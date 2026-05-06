const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const PackingJob = sequelize.define('PackingJob', {
    name: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.ENUM('shipment', 'transfer', 'event'), defaultValue: 'shipment' },
    status: { type: DataTypes.ENUM('draft', 'packing', 'packed', 'shipped'), defaultValue: 'draft' },
    order_id: { type: DataTypes.INTEGER, allowNull: true },
    from_store_id: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
}, {
    tableName: 'packing_jobs',
    timestamps: true,
    underscored: true,
});

module.exports = PackingJob;