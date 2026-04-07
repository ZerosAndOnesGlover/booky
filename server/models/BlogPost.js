const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BlogPost = sequelize.define('BlogPost', {
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
  slug: {
    type: DataTypes.STRING(600),
    allowNull: false,
    unique: true,
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  cover_image_url: {
    type: DataTypes.STRING(1000),
    allowNull: true,
  },
  cover_image_public_id: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'draft',
    validate: { isIn: [['draft', 'published']] },
  },
  meta_description: {
    type: DataTypes.STRING(160),
    allowNull: true,
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  like_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'blog_posts',
  timestamps: true,
  underscored: true,
});

module.exports = BlogPost;
