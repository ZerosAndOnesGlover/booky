const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Book = sequelize.define('Book', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
    set(value) { this.setDataValue('title', value.trim()); },
  },
  author: {
    type: DataTypes.STRING(255),
    allowNull: false,
    set(value) { this.setDataValue('author', value.trim()); },
  },
  cover_image_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cover_image_public_id: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  links: {
    type: DataTypes.JSONB,
    defaultValue: [],
    // stored as [{ name: string, url: string }]
  },
  display_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'books',
  timestamps: true,
  underscored: true,
});

module.exports = Book;
