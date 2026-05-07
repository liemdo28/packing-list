const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../../../middleware/auth');

router.use(authenticate);

router.get('/', notificationController.list);
router.get('/unread-count', notificationController.unreadCount);
router.put('/:id/read', notificationController.markRead);
router.put('/read-all', notificationController.markAllRead);
router.delete('/cleanup', notificationController.cleanup);

module.exports = router;