const express = require('express');
const router = express.Router();
const { recordPageView, getAnalytics } = require('../controllers/analytics.controller');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const pageViewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: true, errors: errors.array() });
  next();
};

// POST /api/public/analytics/pageview
router.post('/public/analytics/pageview',
  pageViewLimiter,
  [
    body('path').notEmpty().withMessage('path is required'),
    body('session_id').notEmpty().withMessage('session_id is required'),
  ],
  handleValidation,
  recordPageView
);

// GET /api/admin/analytics
router.get('/admin/analytics', authMiddleware, getAnalytics);

module.exports = router;
