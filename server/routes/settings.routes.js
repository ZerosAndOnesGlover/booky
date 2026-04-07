const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, uploadLogo, uploadFounderPhoto } = require('../controllers/settings.controller');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// --- PUBLIC ---
router.get('/public/settings', getSettings);

// --- ADMIN ---
router.put('/admin/settings', authMiddleware, updateSettings);
router.post('/admin/settings/logo', authMiddleware, upload.single('logo'), uploadLogo);
router.post('/admin/settings/photo', authMiddleware, upload.single('photo'), uploadFounderPhoto);

module.exports = router;
