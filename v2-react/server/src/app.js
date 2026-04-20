require('dotenv').config();

const express = require('express');
const cors = require('cors');
const routes = require('./routes');

function createApp() {
  const app = express();

  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_URL
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use('/api', routes);

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    });
  });

  return app;
}

module.exports = { createApp };
