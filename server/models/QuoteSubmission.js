const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const QuoteSubmission = sequelize.define('QuoteSubmission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  full_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    set(value) { this.setDataValue('full_name', value.trim()); },
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { isEmail: true },
  },
  phone: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  book_title: {
    type: DataTypes.STRING(500),
    allowNull: false,
    set(value) { this.setDataValue('book_title', value.trim()); },
  },
  genre: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  word_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  editing_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isIn: [[
        'General Manuscript Consultation',
        'Developmental Editing',
        'Basic Copyediting',
        'Heavy Copyediting',
        'Proofreading',
        'Publishing Support',
      ]],
    },
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  file_url: {
    type: DataTypes.STRING(1000),
    allowNull: true,
  },
  file_public_id: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'quote_submissions',
  timestamps: true,
  underscored: true,
  createdAt: 'submitted_at',
  updatedAt: 'updated_at',
});

module.exports = QuoteSubmission;
