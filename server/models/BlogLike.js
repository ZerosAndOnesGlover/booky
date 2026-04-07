const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BlogLike = sequelize.define('BlogLike', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  post_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  session_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
}, {
  tableName: 'blog_likes',
  timestamps: true,
  underscored: true,
  updatedAt: false,
  indexes: [
    { unique: true, fields: ['post_id', 'session_id'] },
  ],
});

module.exports = BlogLike;
