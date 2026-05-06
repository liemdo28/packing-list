const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { authorize } = require('../../../middleware/role');
const priceSyncService = require('../../../services/priceSyncService');

router.use(authenticate);
router.use(authorize('admin', 'accountant'));

// GET /api/admin/pricing/sync/status
router.get('/sync/status', async (req, res) => {
  try {
    const [lastSync, missingPrices] = await Promise.all([
      priceSyncService.getLastSync(),
      priceSyncService.getMissingPrices(),
    ]);
    res.json({ data: { lastSync, missingCount: missingPrices.length } });
  } catch (err) {
    console.error('Pricing sync status error:', err);
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
});

// GET /api/admin/pricing/sync/history
router.get('/sync/history', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const history = await priceSyncService.getSyncHistory(limit);
    res.json({ data: history });
  } catch (err) {
    console.error('Pricing sync history error:', err);
    res.status(500).json({ error: 'Failed to fetch sync history' });
  }
});

// POST /api/admin/pricing/sync — manual trigger (admin only)
router.post('/sync', authorize('admin'), async (req, res) => {
  try {
    const triggeredBy = req.user?.full_name || req.user?.username || 'admin';
    const result = await priceSyncService.runSync({ triggeredBy });
    res.json({ data: result });
  } catch (err) {
    console.error('Pricing sync trigger error:', err);
    res.status(500).json({ error: 'Sync failed: ' + err.message });
  }
});

// GET /api/admin/pricing/missing
router.get('/missing', async (req, res) => {
  try {
    const missing = await priceSyncService.getMissingPrices();
    res.json({ data: missing });
  } catch (err) {
    console.error('Missing prices error:', err);
    res.status(500).json({ error: 'Failed to fetch missing prices' });
  }
});

// GET /api/admin/pricing/audit
router.get('/audit', async (req, res) => {
  try {
    const { item_id, limit } = req.query;
    const audit = await priceSyncService.getPriceAudit({
      itemId: item_id ? parseInt(item_id, 10) : undefined,
      limit: Math.min(parseInt(limit || '50', 10), 200),
    });
    res.json({ data: audit });
  } catch (err) {
    console.error('Price audit error:', err);
    res.status(500).json({ error: 'Failed to fetch price audit' });
  }
});

// GET /api/admin/pricing/prices
router.get('/prices', async (req, res) => {
  try {
    const prices = await priceSyncService.getCurrentPrices();
    res.json({ data: prices });
  } catch (err) {
    console.error('Current prices error:', err);
    res.status(500).json({ error: 'Failed to fetch current prices' });
  }
});

module.exports = router;
