const express = require('express');
const router = express.Router();
const {
  getTestimonials, getAllTestimonials,
  createTestimonial, updateTestimonial, deleteTestimonial,
} = require('../controllers/testimonial.controller');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: true, errors: errors.array() });
  }
  next();
};

// --- PUBLIC ---
router.get('/public/testimonials', getTestimonials);

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
router.delete('/admin/testimonials/:id', authMiddleware, deleteTestimonial);

module.exports = router;
