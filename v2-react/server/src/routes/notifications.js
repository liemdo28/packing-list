/**
 * Notification Routes
 */
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all notifications for current user
router.get('/', notificationController.getNotifications);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark single notification as read
router.put('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Cleanup old notifications (admin only)
router.delete('/cleanup', notificationController.cleanupOldNotifications);

module.exports = router;