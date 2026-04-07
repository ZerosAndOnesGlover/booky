const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SiteSettings = sequelize.define('SiteSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    defaultValue: 1,
  },
  logo_url: {
    type: DataTypes.STRING(1000),
    allowNull: true,
  },
  logo_public_id: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  founder_photo_url: {
    type: DataTypes.STRING(1000),
    allowNull: true,
  },
  founder_photo_public_id: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  whatsapp_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: '',
  },
  contact_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: '',
  },
  instagram_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  twitter_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  facebook_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  linkedin_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'site_settings',
  timestamps: true,
  underscored: true,
});

module.exports = SiteSettings;
