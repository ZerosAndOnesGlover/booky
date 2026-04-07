const BlogPost = require('../models/BlogPost');
const BlogLike = require('../models/BlogLike');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');
const { generateUniqueSlug } = require('../services/slug.service');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);
const { Op } = require('sequelize');

// --- PUBLIC: Get all published posts ---
const getPublishedPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const offset = (page - 1) * limit;

    const { count, rows } = await BlogPost.findAndCountAll({
      where: { status: 'published' },
      order: [['published_at', 'DESC']],
      limit,
      offset,
      attributes: ['id', 'title', 'slug', 'cover_image_url', 'category', 'meta_description', 'published_at'],
    });

    return res.status(200).json({
      posts: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
};

// --- PUBLIC: Get single published post by slug ---
const getPostBySlug = async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({
      where: { slug: req.params.slug, status: 'published' },
    });

    if (!post) {
      return res.status(404).json({ error: true, message: 'Post not found.' });
    }

    await post.increment('view_count');
    await post.reload();

    let is_liked = false;
    if (req.query.session_id) {
      const like = await BlogLike.findOne({ where: { post_id: post.id, session_id: req.query.session_id } });
      is_liked = Boolean(like);
    }

    return res.status(200).json({ post, is_liked });
  } catch (err) {
    next(err);
  }
};

// --- PUBLIC: Toggle like on a post ---
const toggleLike = async (req, res, next) => {
  try {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: true, message: 'session_id is required.' });

    const post = await BlogPost.findOne({ where: { slug: req.params.slug, status: 'published' } });
    if (!post) return res.status(404).json({ error: true, message: 'Post not found.' });

    const existing = await BlogLike.findOne({ where: { post_id: post.id, session_id } });

    let liked;
    if (existing) {
      await existing.destroy();
      await post.decrement('like_count');
      liked = false;
    } else {
      await BlogLike.create({ post_id: post.id, session_id });
      await post.increment('like_count');
      liked = true;
    }

    await post.reload();
    return res.status(200).json({ liked, like_count: post.like_count });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Get all posts including drafts ---
const getAllPosts = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;

    const posts = await BlogPost.findAll({
      where,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'title', 'slug', 'status', 'category', 'published_at', 'created_at'],
    });

    return res.status(200).json({ posts });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Get single post by ID for editing ---
const getPostById = async (req, res, next) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ error: true, message: 'Post not found.' });
    }
    return res.status(200).json({ post });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Create new post ---
const createPost = async (req, res, next) => {
  try {
    const { title, body, category, meta_description, status } = req.body;

    const cleanBody = DOMPurify.sanitize(body);
    const slug = await generateUniqueSlug(title);

    let cover_image_url = null;
    let cover_image_public_id = null;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'booky/blog',
        resource_type: 'image',
      });
      cover_image_url = result.secure_url;
      cover_image_public_id = result.public_id;
    }

    const published_at = status === 'published' ? new Date() : null;

    const post = await BlogPost.create({
      title,
      slug,
      body: cleanBody,
      category,
      meta_description,
      status: status || 'draft',
      cover_image_url,
      cover_image_public_id,
      published_at,
    });

    return res.status(201).json({ message: 'Post created successfully', post });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Update post ---
const updatePost = async (req, res, next) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ error: true, message: 'Post not found.' });
    }

    const { title, body, category, meta_description, status } = req.body;
    const cleanBody = body ? DOMPurify.sanitize(body) : post.body;

    let slug = post.slug;
    if (title && title !== post.title) {
      slug = await generateUniqueSlug(title, post.id);
    }

    let cover_image_url = post.cover_image_url;
    let cover_image_public_id = post.cover_image_public_id;

    if (req.file) {
      await deleteFromCloudinary(post.cover_image_public_id);
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'booky/blog',
        resource_type: 'image',
      });
      cover_image_url = result.secure_url;
      cover_image_public_id = result.public_id;
    }

    let published_at = post.published_at;
    if (status === 'published' && post.status === 'draft') {
      published_at = new Date();
    }

    await post.update({
      title: title || post.title,
      slug,
      body: cleanBody,
      category: category !== undefined ? category : post.category,
      meta_description: meta_description !== undefined ? meta_description : post.meta_description,
      status: status || post.status,
      cover_image_url,
      cover_image_public_id,
      published_at,
    });

    return res.status(200).json({ message: 'Post updated successfully', post });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Delete post ---
const deletePost = async (req, res, next) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ error: true, message: 'Post not found.' });
    }

    await deleteFromCloudinary(post.cover_image_public_id);
    await post.destroy();

    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPublishedPosts, getPostBySlug, toggleLike, getAllPosts, getPostById, createPost, updatePost, deletePost };
