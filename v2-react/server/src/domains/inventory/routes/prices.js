const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');
const { authenticate } = require('../../../middleware/auth');
const { authorize } = require('../../../middleware/role');
const { auditLog } = require('../../../middleware/audit');

router.use(authenticate);

router.get('/', priceController.list);
router.get('/:id', priceController.get);
router.get('/history/:itemId', priceController.history);
router.post('/', authorize('admin', 'accountant'), auditLog('create', 'price'), priceController.create);

module.exports = router;