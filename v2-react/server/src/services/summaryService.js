const { Op } = require('sequelize');
const { Order, OrderLine, Store, Item, sequelize } = require('../../models');
const { ORDER_STATUSES } = require('../config/app');

class SummaryService {
  static async getMonthlySummary(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const orders = await Order.findAll({
      where: {
        status: ORDER_STATUSES.COMPLETED,
        completed_at: { [Op.between]: [startDate, endDate] },
      },
      include: [
        { model: Store, as: 'fromStore' },
        { model: Store, as: 'toStore' },
        { model: OrderLine, as: 'lines', include: [{ model: Item, as: 'item' }] },
      ],
    });

    const pairSummaries = {};

    for (const order of orders) {
      const key = `${order.fromStore.code}-${order.toStore.code}`;
      if (!pairSummaries[key]) {
        pairSummaries[key] = {
          from_store: order.fromStore.code,
          to_store: order.toStore.code,
          from_store_name: order.fromStore.name,
          to_store_name: order.toStore.name,
          total_orders: 0,
          total_items: 0,
          total_amount: 0,
          orders: [],
        };
      }

      pairSummaries[key].total_orders += 1;
      pairSummaries[key].total_items += order.lines.length;
      pairSummaries[key].total_amount += parseFloat(order.total_amount || 0);
      pairSummaries[key].orders.push({
        id: order.id,
        order_number: order.order_number,
        completed_at: order.completed_at,
        total_amount: order.total_amount,
        line_count: order.lines.length,
      });
    }

    return {
      year,
      month,
      pairs: Object.values(pairSummaries),
      grand_total: Object.values(pairSummaries).reduce((sum, p) => sum + p.total_amount, 0),
      grand_total_orders: Object.values(pairSummaries).reduce((sum, p) => sum + p.total_orders, 0),
    };
  }

  static async getYearlySummary(year) {
    const months = [];
    for (let m = 1; m <= 12; m++) {
      const summary = await this.getMonthlySummary(year, m);
      months.push(summary);
    }

    return {
      year,
      months,
      grand_total: months.reduce((sum, m) => sum + m.grand_total, 0),
      grand_total_orders: months.reduce((sum, m) => sum + m.grand_total_orders, 0),
    };
  }

  static async getPairSummary(fromStoreCode, toStoreCode, year, month) {
    const fromStore = await Store.findOne({ where: { code: fromStoreCode } });
    const toStore = await Store.findOne({ where: { code: toStoreCode } });

    if (!fromStore || !toStore) throw new Error('Store not found');

    const whereClause = {
      from_store_id: fromStore.id,
      to_store_id: toStore.id,
      status: ORDER_STATUSES.COMPLETED,
    };

    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      whereClause.completed_at = { [Op.between]: [startDate, endDate] };
    } else if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      whereClause.completed_at = { [Op.between]: [startDate, endDate] };
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        { model: Store, as: 'fromStore' },
        { model: Store, as: 'toStore' },
        { model: OrderLine, as: 'lines', include: [{ model: Item, as: 'item' }] },
      ],
      order: [['completed_at', 'DESC']],
    });

    const itemSummary = {};
    let totalAmount = 0;

    for (const order of orders) {
      for (const line of order.lines) {
        const itemKey = line.item_id;
        if (!itemSummary[itemKey]) {
          itemSummary[itemKey] = {
            item_id: line.item_id,
            item_code: line.item?.code,
            item_name: line.item?.name,
            total_quantity: 0,
            total_amount: 0,
          };
        }
        itemSummary[itemKey].total_quantity += parseFloat(line.quantity);
        itemSummary[itemKey].total_amount += parseFloat(line.total_price || 0);
      }
      totalAmount += parseFloat(order.total_amount || 0);
    }

    return {
      from_store: fromStoreCode,
      to_store: toStoreCode,
      year,
      month,
      total_orders: orders.length,
      total_amount: totalAmount,
      items: Object.values(itemSummary),
      orders: orders.map(o => ({
        id: o.id,
        order_number: o.order_number,
        completed_at: o.completed_at,
        total_amount: o.total_amount,
        line_count: o.lines.length,
      })),
    };
  }
}

module.exports = SummaryService;
