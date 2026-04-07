const slugify = require('slugify');
const BlogPost = require('../models/BlogPost');
const { Op } = require('sequelize');

const generateUniqueSlug = async (title, excludeId = null) => {
  const baseSlug = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const where = { slug };
    if (excludeId) where.id = { [Op.ne]: excludeId };

    const existing = await BlogPost.findOne({ where });

    if (!existing) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

module.exports = { generateUniqueSlug };
