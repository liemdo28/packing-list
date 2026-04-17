const { Op } = require('sequelize');
const { Order, Store, User, Item, Notification } = require('../../../models');
const { ORDER_STATUSES } = require('../../../config/app');

const stats = async (req, res) => {
  try {
    const user = req.user;
    const storeFilter = {};

    if (user.role !== 'admin' && user.role !== 'accountant' && user.store_id) {
      storeFilter[Op.or] = [
        { from_store_id: user.store_id },
        { to_store_id: user.store_id },
      ];
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Total orders
    const totalOrders = await Order.count({ where: storeFilter });

    // Pending orders (submitted, preparing, shipped)
    const pendingOrders = await Order.count({
      where: {
        ...storeFilter,
        status: { [Op.in]: ['submitted', 'preparing', 'shipped', 'received'] },
      },
    });

    // Completed this month
    const completedThisMonth = await Order.count({
      where: {
        ...storeFilter,
        status: ORDER_STATUSES.COMPLETED,
        completed_at: { [Op.gte]: startOfMonth },
      },
    });

    // Total amount this month
    const monthlyOrders = await Order.findAll({
      where: {
        ...storeFilter,
        status: ORDER_STATUSES.COMPLETED,
        completed_at: { [Op.gte]: startOfMonth },
      },
      attributes: ['total_amount'],
    });
    const monthlyTotal = monthlyOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

    // Recent orders
    const recentOrders = await Order.findAll({
      where: storeFilter,
      include: [
        { model: Store, as: 'fromStore' },
        { model: Store, as: 'toStore' },
        { model: User, as: 'creator', attributes: ['id', 'full_name'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 5,
    });

    // Orders by status
    const statusCounts = {};
    for (const status of Object.values(ORDER_STATUSES)) {
      statusCounts[status] = await Order.count({
        where: { ...storeFilter, status },
      });
    }

    // Unread notifications
    const unreadNotifications = await Notification.count({
      where: { user_id: user.id, is_read: false },
    });

    // Active items count
    const activeItems = await Item.count({ where: { is_active: true } });

    // Active stores count
    const activeStores = await Store.count({ where: { is_active: true } });

    res.json({
      data: {
        totalOrders,
        pendingOrders,
        completedThisMonth,
        monthlyTotal,
        recentOrders,
        statusCounts,
        unreadNotifications,
        activeItems,
        activeStores,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

module.exports = { stats };