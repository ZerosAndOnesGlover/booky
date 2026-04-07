const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AboutContent = sequelize.define('AboutContent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    defaultValue: 1,
  },
  founder_story: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  mission: {
    type: DataTypes.STRING(1000),
    allowNull: true,
  },
  vision: {
    type: DataTypes.STRING(1000),
    allowNull: true,
  },
  value_1_label: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  value_1_description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  value_2_label: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  value_2_description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  value_3_label: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  value_3_description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  value_4_label: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  value_4_description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'about_content',
  timestamps: true,
  underscored: true,
});

module.exports = AboutContent;
