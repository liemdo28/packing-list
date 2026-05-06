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
