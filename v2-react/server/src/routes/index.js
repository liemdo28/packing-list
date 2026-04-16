const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/stores', require('./stores'));
router.use('/items', require('./items'));
router.use('/prices', require('./prices'));
router.use('/orders', require('./orders'));
router.use('/notifications', require('./notifications'));
router.use('/summary', require('./summary'));
router.use('/invoices', require('./invoices'));
router.use('/audit-logs', require('./auditLogs'));
router.use('/users', require('./users'));
router.use('/dashboard', require('./dashboard'));
router.use('/export', require('./export'));

module.exports = router;
