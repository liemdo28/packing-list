const { Notification } = require('../../../models');

const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;

    const { rows, count } = await Notification.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('List notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const markRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.update({ is_read: true, read_at: new Date() });
    res.json({ data: notification });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

const markAllRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: req.user.id, is_read: false } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};

const unreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { user_id: req.user.id, is_read: false },
    });

    res.json({ data: { count } });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

module.exports = { list, markRead, markAllRead, unreadCount };