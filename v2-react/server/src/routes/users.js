const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { auditLog } = require('../middleware/audit');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', userController.list);
router.get('/:id', userController.get);
router.post('/', auditLog('create', 'user'), userController.create);
router.put('/:id', auditLog('update', 'user'), userController.update);
router.delete('/:id', auditLog('delete', 'user'), userController.remove);

module.exports = router;
