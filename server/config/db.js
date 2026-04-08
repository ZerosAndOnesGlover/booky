const { Sequelize } = require('sequelize');

// Remove sslmode param from URL to avoid conflicts
const connectionUrl = process.env.POSTGRES_URL.replace(/[?&]sslmode=\w+/, '');

const isLocal = connectionUrl.includes('localhost') || connectionUrl.includes('127.0.0.1');

const sequelize = new Sequelize(connectionUrl, {
  dialect: 'postgres',
  dialectOptions: isLocal ? {} : {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    family: 4, // force IPv4 — Render free tier does not support IPv6
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: false,
});

module.exports = sequelize;
