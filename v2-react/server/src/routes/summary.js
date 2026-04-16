const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summaryController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(authenticate);
router.use(authorize('admin', 'accountant'));

router.get('/monthly', summaryController.monthly);
router.get('/yearly', summaryController.yearly);
router.get('/pair/:from/:to', summaryController.byPair);

module.exports = router;
