const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/packingController');
const { authenticate } = require('../../../middleware/auth');
const { auditLog } = require('../../../middleware/audit');

router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', auditLog('create', 'packing_job'), ctrl.create);
router.put('/:id', auditLog('update', 'packing_job'), ctrl.update);

router.post('/:id/items', auditLog('add_item', 'packing_item'), ctrl.addItem);
router.put('/:id/items/:itemId', auditLog('update_item', 'packing_item'), ctrl.updateItem);
router.delete('/:id/items/:itemId', auditLog('remove_item', 'packing_item'), ctrl.removeItem);

router.post('/:id/mark-all-packed', auditLog('mark_packed', 'packing_job'), ctrl.markAllPacked);
router.post('/:id/ship', auditLog('ship', 'packing_job'), ctrl.markShipped);

// Templates
router.get('/templates/list', ctrl.templateList);
router.post('/templates', auditLog('create', 'packing_template'), ctrl.templateCreate);
router.put('/templates/:id', auditLog('update', 'packing_template'), ctrl.templateUpdate);
router.delete('/templates/:id', auditLog('delete', 'packing_template'), ctrl.templateDelete);

module.exports = router;