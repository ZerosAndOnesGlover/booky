const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BlogComment = sequelize.define('BlogComment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  post_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  post_slug: {
    type: DataTypes.STRING(600),
    allowNull: false,
  },
  author_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    set(value) { this.setDataValue('author_name', value.trim()); },
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
    set(value) { this.setDataValue('body', value.trim()); },
  },
  is_approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'blog_comments',
  timestamps: true,
  underscored: true,
  updatedAt: false,
});

module.exports = BlogComment;
