const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../../../middleware/auth');
const { auditLog } = require('../../../middleware/audit');

router.use(authenticate);

router.get('/', orderController.list);
router.get('/:id', orderController.get);
router.post('/', auditLog('create', 'order'), orderController.create);
router.put('/:id', auditLog('update', 'order'), orderController.update);

router.post('/:id/submit',  auditLog('submit',  'order'), orderController.submit);
router.post('/:id/prepare', auditLog('prepare', 'order'), orderController.prepare);
router.post('/:id/receive', auditLog('receive', 'order'), orderController.receive);
router.post('/:id/complete',auditLog('complete','order'), orderController.complete);
router.post('/:id/cancel',  auditLog('cancel',  'order'), orderController.cancel);

module.exports = router;