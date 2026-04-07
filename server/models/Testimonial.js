const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Testimonial = sequelize.define('Testimonial', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  client_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    set(value) { this.setDataValue('client_name', value.trim()); },
  },
  quote: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  book_title: {
    type: DataTypes.STRING(500),
    allowNull: true,
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
  tableName: 'testimonials',
  timestamps: true,
  underscored: true,
});

module.exports = Testimonial;
