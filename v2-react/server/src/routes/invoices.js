const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { auditLog } = require('../middleware/audit');

router.use(authenticate);

router.get('/', invoiceController.list);
router.get('/:id', invoiceController.get);
router.post('/', authorize('admin', 'accountant', 'b2'), auditLog('create', 'invoice'), invoiceController.create);
router.put('/:id', authorize('admin', 'accountant', 'b2'), auditLog('update', 'invoice'), invoiceController.update);
router.post('/:id/reconcile', authorize('admin', 'accountant'), auditLog('reconcile', 'invoice'), invoiceController.reconcile);

module.exports = router;
