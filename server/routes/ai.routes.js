const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/ai.controller');
const authMiddleware = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/admin/ai/chat
router.post('/admin/ai/chat', authMiddleware, aiLimiter, chat);

module.exports = router;
