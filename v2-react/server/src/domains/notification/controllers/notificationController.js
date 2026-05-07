const { Notification } = require('../../../models');
const notificationService = require('../../../services/notificationService');

const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const { type, isRead, severity } = req.query;

    const result = await notificationService.getNotifications(req.user.id, {
      page,
      limit,
      type,
      isRead,
      severity,
    });

    res.json({
      data: result.notifications,
      pagination: {
        page: result.page,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error('List notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const markRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ data: notification });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

const markAllRead = async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};

const unreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ data: { count } });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

// Admin cleanup endpoint
const cleanup = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { daysOld = 30 } = req.query;
    const deleted = await notificationService.cleanupOldNotifications(parseInt(daysOld));
    res.json({ data: { deleted } });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup notifications' });
  }
};

module.exports = { list, markRead, markAllRead, unreadCount, cleanup };