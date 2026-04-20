const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
    set(value) { this.setDataValue('email', value.toLowerCase().trim()); },
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lock_until: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  otp_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  otp_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  known_device_tokens: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const val = this.getDataValue('known_device_tokens');
      return val ? JSON.parse(val) : [];
    },
    set(val) {
      this.setDataValue('known_device_tokens', JSON.stringify(val));
    },
  },
}, {
  tableName: 'admins',
  timestamps: true,
  underscored: true,
});

module.exports = Admin;
