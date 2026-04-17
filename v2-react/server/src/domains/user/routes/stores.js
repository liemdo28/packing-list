const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { authenticate } = require('../../../middleware/auth');
const { authorize } = require('../../../middleware/role');
const { auditLog } = require('../../../middleware/audit');

router.use(authenticate);

router.get('/', storeController.list);
router.get('/:id', storeController.get);
router.post('/', authorize('admin'), auditLog('create', 'store'), storeController.create);
router.put('/:id', authorize('admin'), auditLog('update', 'store'), storeController.update);
router.delete('/:id', authorize('admin'), auditLog('delete', 'store'), storeController.remove);

module.exports = router;