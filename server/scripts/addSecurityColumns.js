// One-time migration: adds the columns introduced by the security hardening
// (admins.otp_attempts, admins.token_version). Needed in production because the
// server no longer auto-ALTERs the schema on boot (see config/syncDb.js).
//
//   Usage:  node scripts/addSecurityColumns.js
//
// Idempotent — safe to run more than once.
require('dotenv').config();
const { DataTypes } = require('sequelize');
const sequelize = require('./../config/db');
require('../models/Admin');

const run = async () => {
  const qi = sequelize.getQueryInterface();
  try {
    await sequelize.authenticate();
    const table = await qi.describeTable('admins');

    if (!table.otp_attempts) {
      await qi.addColumn('admins', 'otp_attempts', { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });
      console.log('Added admins.otp_attempts');
    } else {
      console.log('admins.otp_attempts already exists — skipping');
    }

    if (!table.token_version) {
      await qi.addColumn('admins', 'token_version', { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });
      console.log('Added admins.token_version');
    } else {
      console.log('admins.token_version already exists — skipping');
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
};

run();
