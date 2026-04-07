const BlogComment = require('../models/BlogComment');
const BlogPost = require('../models/BlogPost');
const rateLimit = require('express-rate-limit');

// --- PUBLIC: Get approved comments for a post ---
const getComments = async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ where: { slug: req.params.slug, status: 'published' } });
    if (!post) return res.status(404).json({ error: true, message: 'Post not found.' });

    const comments = await BlogComment.findAll({
      where: { post_id: post.id, is_approved: true },
      order: [['created_at', 'ASC']],
      attributes: ['id', 'author_name', 'body', 'created_at'],
    });

    return res.status(200).json({ comments });
  } catch (err) {
    next(err);
  }
};

// --- PUBLIC: Submit a comment ---
const submitComment = async (req, res, next) => {
  try {
    const { author_name, body } = req.body;

    const post = await BlogPost.findOne({ where: { slug: req.params.slug, status: 'published' } });
    if (!post) return res.status(404).json({ error: true, message: 'Post not found.' });

    await BlogComment.create({
      post_id: post.id,
      post_slug: post.slug,
      author_name,
      body,
      is_approved: false,
    });

    return res.status(201).json({ message: 'Comment submitted. It will appear after moderation.' });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Get all comments with optional filter ---
const adminGetComments = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status === 'pending')  where.is_approved = false;
    if (req.query.status === 'approved') where.is_approved = true;

    const page   = parseInt(req.query.page) || 1;
    const limit  = 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await BlogComment.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return res.status(200).json({ comments: rows, total: count, page, totalPages: Math.ceil(count / limit) });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Approve a comment ---
const approveComment = async (req, res, next) => {
  try {
    const comment = await BlogComment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ error: true, message: 'Comment not found.' });

    await comment.update({ is_approved: true });
    return res.status(200).json({ message: 'Comment approved.', comment });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Delete a comment ---
const deleteComment = async (req, res, next) => {
  try {
    const comment = await BlogComment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ error: true, message: 'Comment not found.' });

    await comment.destroy();
    return res.status(200).json({ message: 'Comment deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getComments, submitComment, adminGetComments, approveComment, deleteComment };
