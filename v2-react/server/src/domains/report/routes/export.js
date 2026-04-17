const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summaryController');
const { authenticate } = require('../../../middleware/auth');
const { authorize } = require('../../../middleware/role');

router.use(authenticate);
router.use(authorize('admin', 'accountant'));

router.get('/excel', summaryController.exportExcel);
router.get('/pdf', summaryController.exportPdf);

module.exports = router;