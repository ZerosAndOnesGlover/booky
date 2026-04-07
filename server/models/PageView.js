const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PageView = sequelize.define('PageView', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  path: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  session_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName: 'page_views',
  timestamps: true,
  underscored: true,
  updatedAt: false,
});

module.exports = PageView;
