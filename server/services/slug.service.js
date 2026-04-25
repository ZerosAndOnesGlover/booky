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
  const MAX_ATTEMPTS = 100;

  while (counter <= MAX_ATTEMPTS) {
    const where = { slug };
    if (excludeId) where.id = { [Op.ne]: excludeId };

    const existing = await BlogPost.findOne({ where });
    if (!existing) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  if (counter > MAX_ATTEMPTS) {
    slug = `${baseSlug}-${Date.now()}`;
  }

  return slug;
};

module.exports = { generateUniqueSlug };
