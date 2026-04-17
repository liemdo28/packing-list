const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PackingTemplate = sequelize.define('PackingTemplate', {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
}, {
    tableName: 'packing_templates',
    timestamps: true,
    underscored: true,
});

const PackingTemplateItem = sequelize.define('PackingTemplateItem', {
    packing_template_id: { type: DataTypes.INTEGER, allowNull: false },
    item_id: { type: DataTypes.INTEGER, allowNull: false },
    default_qty: { type: DataTypes.DECIMAL(10, 3), defaultValue: 1 },
}, {
    tableName: 'packing_template_items',
    timestamps: true,
    underscored: true,
});

module.exports = { PackingTemplate, PackingTemplateItem };