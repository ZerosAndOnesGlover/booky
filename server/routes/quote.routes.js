const express = require('express');
const router = express.Router();
const { submitQuote, getQuotes, getQuoteById, toggleReadStatus } = require('../controllers/quote.controller');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const quoteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: true, message: 'Too many submissions. Please try again later.' },
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

const EDITING_TYPES = [
  'General Manuscript Consultation',
  'Developmental Editing',
  'Basic Copyediting',
  'Heavy Copyediting',
  'Proofreading',
  'Publishing Support',
];

// --- PUBLIC ---
router.post('/public/quote', quoteLimiter, upload.single('manuscript'),
  [
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('book_title').notEmpty().withMessage('Book title is required'),
    body('genre').notEmpty().withMessage('Genre is required'),
    body('word_count').isInt({ min: 1, max: 2000000 }).withMessage('Word count must be between 1 and 2,000,000'),
    body('editing_type').isIn(EDITING_TYPES).withMessage('Invalid editing type selected'),
    body('deadline').isDate().withMessage('Valid deadline date is required')
      .custom((value) => {
        if (new Date(value) < new Date(new Date().toDateString())) {
          throw new Error('Deadline cannot be in the past');
        }
        return true;
      }),
  ],
  handleValidation,
  submitQuote
);

// --- ADMIN ---
router.get('/admin/quotes', authMiddleware, getQuotes);
router.get('/admin/quotes/:id', authMiddleware, getQuoteById);
router.put('/admin/quotes/:id/read', authMiddleware, toggleReadStatus);

module.exports = router;
