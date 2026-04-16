const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(authenticate);
router.use(authorize('admin', 'accountant'));

router.get('/', auditLogController.list);

module.exports = router;
