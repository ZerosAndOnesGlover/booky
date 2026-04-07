const express = require('express');
const router = express.Router();
const {
  getTestimonials, submitPublicTestimonial,
  getAllTestimonials, createTestimonial, updateTestimonial,
  approveTestimonial, deleteTestimonial,
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
router.post('/public/testimonials', submitPublicTestimonial);

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
