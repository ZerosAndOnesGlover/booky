const express = require('express');
const router = express.Router();
const {
  getTestimonials, submitPublicTestimonial,
  getAllTestimonials, createTestimonial, updateTestimonial,
  approveTestimonial, deleteTestimonial,
} = require('../controllers/testimonial.controller');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const testimonialLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: { error: true, message: 'Too many reviews submitted. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: true, errors: errors.array() });
  }
  next();
};

// --- PUBLIC ---
router.get('/public/testimonials', getTestimonials);
router.post('/public/testimonials',
  testimonialLimiter,
  [
    body('client_name').notEmpty().trim().isLength({ max: 100 }).withMessage('Name is required (max 100 characters)'),
    body('quote').notEmpty().trim().isLength({ min: 10, max: 1000 }).withMessage('Review must be between 10 and 1000 characters'),
    body('book_title').optional().trim().isLength({ max: 255 }).withMessage('Book title max 255 characters'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  ],
  handleValidation,
  submitPublicTestimonial
);

// --- ADMIN ---
router.get('/admin/testimonials', authMiddleware, getAllTestimonials);

router.post('/admin/testimonials', authMiddleware,
  [
    body('client_name').notEmpty().withMessage('Client name is required'),
    body('quote').notEmpty().withMessage('Quote is required'),
  ],
  handleValidation,
  createTestimonial
);

router.put('/admin/testimonials/:id', authMiddleware, updateTestimonial);
router.put('/admin/testimonials/:id/approve', authMiddleware, approveTestimonial);
router.delete('/admin/testimonials/:id', authMiddleware, deleteTestimonial);

module.exports = router;
