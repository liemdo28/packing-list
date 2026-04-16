const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { auditLog } = require('../middleware/audit');

router.use(authenticate);

router.get('/', itemController.list);
router.get('/:id', itemController.get);
router.post('/', authorize('admin', 'b1', 'b2', 'b3'), auditLog('create', 'item'), itemController.create);
router.put('/:id', authorize('admin', 'b1', 'b2', 'b3'), auditLog('update', 'item'), itemController.update);
router.delete('/:id', authorize('admin'), auditLog('delete', 'item'), itemController.remove);

module.exports = router;
