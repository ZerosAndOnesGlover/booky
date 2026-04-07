const express = require('express');
const router = express.Router();
const { getAbout, updateAbout } = require('../controllers/about.controller');
const authMiddleware = require('../middleware/auth');

// --- PUBLIC ---
router.get('/public/about', getAbout);

// --- ADMIN ---
router.put('/admin/about', authMiddleware, updateAbout);

module.exports = router;
