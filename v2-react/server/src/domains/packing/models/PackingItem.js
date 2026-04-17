const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PackingItem = sequelize.define('PackingItem', {
    packing_job_id: { type: DataTypes.INTEGER, allowNull: false },
    item_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
    packed_qty: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
    packed: { type: DataTypes.BOOLEAN, defaultValue: false },
    packed_at: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
}, {
    tableName: 'packing_items',
    timestamps: true,
    underscored: true,
});

module.exports = PackingItem;