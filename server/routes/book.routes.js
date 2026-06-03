const express = require('express');
const router = express.Router();
const { getBooks, getAllBooks, createBook, updateBook, deleteBook } = require('../controllers/book.controller');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// --- PUBLIC ---
router.get('/public/books', getBooks);

// --- ADMIN ---
router.get('/admin/books', authMiddleware, getAllBooks);
router.post('/admin/books', authMiddleware, upload.single('cover_image'), createBook);
router.put('/admin/books/:id', authMiddleware, upload.single('cover_image'), updateBook);
router.delete('/admin/books/:id', authMiddleware, deleteBook);

module.exports = router;
