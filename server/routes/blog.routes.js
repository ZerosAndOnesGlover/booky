const express = require('express');
const router = express.Router();
const {
  getPublishedPosts, getPostBySlug, toggleLike, getAllPosts,
  getPostById, createPost, updatePost, deletePost,
} = require('../controllers/blog.controller');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: true, errors: errors.array() });
  }
  next();
};

// --- PUBLIC ---
router.get('/public/blogs', getPublishedPosts);
router.get('/public/blogs/:slug', getPostBySlug);

// --- ADMIN ---
router.get('/admin/blogs', authMiddleware, getAllPosts);
router.get('/admin/blogs/:id', authMiddleware, getPostById);

router.post('/admin/blogs', authMiddleware, upload.single('cover_image'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('body').notEmpty().withMessage('Body is required'),
    body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published'),
    body('meta_description').optional().isLength({ max: 160 }).withMessage('Meta description max 160 characters'),
  ],
  handleValidation,
  createPost
);

router.put('/admin/blogs/:id', authMiddleware, upload.single('cover_image'),
  [
    body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published'),
    body('meta_description').optional().isLength({ max: 160 }).withMessage('Meta description max 160 characters'),
  ],
  handleValidation,
  updatePost
);

router.delete('/admin/blogs/:id', authMiddleware, deletePost);

module.exports = router;
