const { sequelize } = require('./models');
const { createApp } = require('./app');

const app = createApp();
const PORT = process.env.PORT || 3001;

// Start server
async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    if (process.argv.includes('--migrate')) {
      await sequelize.sync({ alter: true });
      console.log('Database migrated');
      process.exit(0);
    }

    await sequelize.sync();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
