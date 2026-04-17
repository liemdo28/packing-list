const express = require('express');
const router = express.Router();

router.use('/auth', require('../domains/user/routes/auth'));
router.use('/stores', require('../domains/user/routes/stores'));
router.use('/items', require('../domains/inventory/routes/items'));
router.use('/prices', require('../domains/inventory/routes/prices'));
router.use('/orders', require('../domains/order/routes/orders'));
router.use('/notifications', require('../domains/notification/routes/notifications'));
router.use('/summary', require('../domains/report/routes/summary'));
router.use('/invoices', require('../domains/invoice/routes/invoices'));
router.use('/audit-logs', require('../domains/audit/routes/auditLogs'));
router.use('/users', require('../domains/user/routes/users'));
router.use('/dashboard', require('../domains/dashboard/routes/dashboard'));
router.use('/export', require('../domains/report/routes/export'));

module.exports = router;