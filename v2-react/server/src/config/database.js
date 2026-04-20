const { Sequelize } = require('sequelize');

const isPostgres = (process.env.DB_DIALECT || '').toLowerCase() === 'postgres';

const sequelize = new Sequelize(
  isPostgres ? process.env.DB_NAME : (process.env.DB_NAME || 'packing_list'),
  isPostgres ? process.env.DB_USER : (process.env.DB_USER || 'root'),
  isPostgres ? process.env.DB_PASS : (process.env.DB_PASS || ''),
  {
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT || (isPostgres ? '5432' : '3306'), 10),
    dialect:  isPostgres ? 'postgres' : 'mysql',
    protocol: isPostgres ? 'postgres' : undefined,
    logging:  process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max:    10,
      min:    0,
      acquire: 30000,
      idle:   10000,
    },
    dialectOptions: isPostgres ? {
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false,
      } : false,
    } : {},
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

module.exports = sequelize;