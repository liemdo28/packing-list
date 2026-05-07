const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../../../middleware/auth');
const { auditLog } = require('../../../middleware/audit');
const { authorizeOrderAction } = require('../../../middleware/role');

router.use(authenticate);

router.get('/', orderController.list);
router.get('/:id', orderController.get);
router.post('/', auditLog('create', 'order'), orderController.create);
router.put('/:id', auditLog('update', 'order'), orderController.update);

router.post('/:id/submit',
  auditLog('submit', 'order'),
  orderController.submit
);
router.post('/:id/accept',
  authorizeOrderAction(['b1', 'b3', 'admin'], 'from_store'),
  auditLog('accept', 'order'),
  orderController.accept
);
router.post('/:id/reject',
  authorizeOrderAction(['b1', 'b3', 'admin'], 'from_store'),
  auditLog('reject', 'order'),
  orderController.reject
);
router.post('/:id/prepare',
  authorizeOrderAction(['b1', 'b3', 'admin'], 'from_store'),
  auditLog('prepare', 'order'),
  orderController.prepare
);
router.post('/:id/ship',
  authorizeOrderAction(['b1', 'b3', 'admin'], 'from_store'),
  auditLog('ship', 'order'),
  orderController.ship
);
router.post('/:id/receive',
  authorizeOrderAction(['b1', 'b2', 'b3', 'admin'], 'to_store'),
  auditLog('receive', 'order'),
  orderController.receive
);
router.post('/:id/complete',
  authorizeOrderAction(['b1', 'b2', 'b3', 'accountant', 'admin'], 'to_store'),
  auditLog('complete', 'order'),
  orderController.complete
);
router.post('/:id/cancel',
  auditLog('cancel', 'order'),
  orderController.cancel
);

module.exports = router;