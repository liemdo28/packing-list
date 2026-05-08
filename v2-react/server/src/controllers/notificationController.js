/**
 * Notification Controller
 * Handles notification API endpoints
 */
const notificationService = require('../services/notificationService');
const auth = require('../middleware/auth');

/**
 * Get all notifications for current user
 * GET /api/notifications
 */
async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const { page, limit, type, isRead, severity } = req.query;

    const result = await notificationService.getNotifications(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      type,
      isRead,
      severity,
    });

    res.json({
      success: true,
      data: result.notifications,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        total: result.total,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
}

/**
 * Get unread count
 * GET /api/notifications/unread-count
 */
async function getUnreadCount(req, res) {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch unread count' });
  }
}

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
async function markAsRead(req, res) {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await notificationService.markAsRead(notificationId, userId);

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
}

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;
    await notificationService.markAllAsRead(userId);

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark all as read' });
  }
}

/**
 * Delete old notifications
 * DELETE /api/notifications/cleanup
 */
async function cleanupOldNotifications(req, res) {
  try {
    // Only admins can cleanup
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { daysOld = 30 } = req.query;
    const deleted = await notificationService.cleanupOldNotifications(parseInt(daysOld));

    res.json({ success: true, data: { deleted } });
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to cleanup' });
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  cleanupOldNotifications,
};