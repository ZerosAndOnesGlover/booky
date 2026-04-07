const { Sequelize } = require("sequelize");

const isRemoteDb = process.env.POSTGRES_URL && !process.env.POSTGRES_URL.includes('localhost') && !process.env.POSTGRES_URL.includes('127.0.0.1');

const sequelize = new Sequelize(process.env.POSTGRES_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: isRemoteDb
      ? { require: true, rejectUnauthorized: false }
      : false,
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
