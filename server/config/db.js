const { Sequelize } = require('sequelize');

// Force IPv4 — Render free tier does not support IPv6
require('pg').defaults.family = 4;

// Remove sslmode param from URL to avoid conflicts
const connectionUrl = process.env.POSTGRES_URL.replace(/[?&]sslmode=\w+/, '');

const isLocal = connectionUrl.includes('localhost') || connectionUrl.includes('127.0.0.1');

// Provide the database provider's CA certificate (PEM) via DB_CA_CERT to enable
// full TLS certificate verification and prevent MITM. When it is absent we fall
// back to encrypted-but-unverified so existing deployments keep working.
const caCert = process.env.DB_CA_CERT;

const sequelize = new Sequelize(connectionUrl, {
  dialect: 'postgres',
  dialectOptions: isLocal ? { ssl: false } : {
    ssl: {
      require: true,
      rejectUnauthorized: Boolean(caCert),
      ...(caCert ? { ca: caCert } : {}),
    },
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
