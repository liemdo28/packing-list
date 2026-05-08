require('dotenv').config();

const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { generalLimiter, adminLimiter } = require('./middleware/rateLimiter');

function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_URL
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use('/api', generalLimiter);
  app.use('/api/admin', adminLimiter);

  app.use('/api', routes);

  // ── Health endpoints ───────────────────────────────────────────────────────

  // Quick liveness check (no DB) — also available at /api/health for consistency
  app.get('/api/health', async (req, res) => {
    const { sequelize } = require('./models');
    let dbStatus = 'ok';
    let dbLatencyMs = null;

    try {
      const start = Date.now();
      await sequelize.authenticate();
      dbLatencyMs = Date.now() - start;
    } catch {
      dbStatus = 'error';
    }

    const healthy = dbStatus === 'ok';
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      db: { status: dbStatus, latencyMs: dbLatencyMs },
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  // Quick liveness check (no DB)
  app.get('/health', async (req, res) => {
    const { sequelize } = require('./models');
    let dbStatus = 'ok';
    let dbLatencyMs = null;

    try {
      const start = Date.now();
      await sequelize.authenticate();
      dbLatencyMs = Date.now() - start;
    } catch {
      dbStatus = 'error';
    }

    const healthy = dbStatus === 'ok';
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      db: { status: dbStatus, latencyMs: dbLatencyMs },
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  // DB-only health check
  app.get('/health/db', async (req, res) => {
    const { sequelize } = require('./models');
    try {
      const start = Date.now();
      await sequelize.authenticate();
      const latencyMs = Date.now() - start;
      res.json({ status: 'ok', latencyMs });
    } catch (err) {
      res.status(503).json({ status: 'error', error: err.message });
    }
  });

  // Full system health: DB + memory + uptime + env
  app.get('/health/full', async (req, res) => {
    const { sequelize } = require('./models');
    const mem = process.memoryUsage();

    let db = { status: 'error', latencyMs: null };
    try {
      const start = Date.now();
      await sequelize.authenticate();
      db = { status: 'ok', latencyMs: Date.now() - start };
    } catch (err) {
      db.error = err.message;
    }

    const healthy = db.status === 'ok';
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
      env: process.env.NODE_ENV || 'development',
      db,
      memory: {
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        rssMB: Math.round(mem.rss / 1024 / 1024),
      },
    });
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  app.use((err, req, res, next) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      service: 'packing-api',
      module: 'global',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    }));
    res.status(500).json({
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    });
  });

  return app;
}

module.exports = { createApp };
