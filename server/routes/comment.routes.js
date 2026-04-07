const express = require('express');
const router = express.Router();
const { getComments, submitComment, adminGetComments, approveComment, deleteComment } = require('../controllers/comment.controller');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const commentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: true, message: 'Too many comments submitted. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: true, errors: errors.array() });
  next();
};

// --- PUBLIC ---
router.get('/public/blogs/:slug/comments', getComments);

router.post('/public/blogs/:slug/comments',
  commentLimiter,
  [
    body('author_name').notEmpty().trim().withMessage('Name is required'),
    body('body').notEmpty().trim().isLength({ max: 1000 }).withMessage('Comment must be between 1 and 1000 characters'),
  ],
  handleValidation,
  submitComment
);

// --- PUBLIC: Like toggle ---
router.post('/public/blogs/:slug/like',
  [body('session_id').notEmpty().withMessage('session_id is required')],
  handleValidation,
  require('../controllers/blog.controller').toggleLike
);

// --- ADMIN ---
router.get('/admin/comments', authMiddleware, adminGetComments);
router.put('/admin/comments/:id/approve', authMiddleware, approveComment);
router.delete('/admin/comments/:id', authMiddleware, deleteComment);

module.exports = router;
