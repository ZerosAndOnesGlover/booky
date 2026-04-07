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
}, {
  tableName: 'admins',
  timestamps: true,
  underscored: true,
});

module.exports = Admin;
