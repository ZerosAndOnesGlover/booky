const express = require('express');
const router = express.Router();
const { recordPageView, getAnalytics, getDashboardStats } = require('../controllers/analytics.controller');
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
    body('path').notEmpty().isLength({ max: 500 }).withMessage('path is required and must be under 500 characters'),
    body('session_id').notEmpty().isLength({ max: 128 }).withMessage('session_id is required and must be under 128 characters'),
  ],
  handleValidation,
  recordPageView
);

// GET /api/admin/analytics
router.get('/admin/analytics', authMiddleware, getAnalytics);

// GET /api/admin/dashboard-stats
router.get('/admin/dashboard-stats', authMiddleware, getDashboardStats);

module.exports = router;
