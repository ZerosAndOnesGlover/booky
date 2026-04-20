const express = require('express');
const router = express.Router();
const { login, verifyOtp, logout, verify, changePassword, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// --- Rate Limiter for login ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: true, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Rate Limiter for OTP ---
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { error: true, message: 'Too many verification attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Validation middleware ---
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: true, errors: errors.array() });
  }
  next();
};

// --- Routes ---

// POST /api/auth/login
router.post('/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidation,
  login
);

// POST /api/auth/verify-otp
router.post('/verify-otp',
  otpLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be a 6-digit code'),
  ],
  handleValidation,
  verifyOtp
);

// POST /api/auth/logout
router.post('/logout', authMiddleware, logout);

// GET /api/auth/verify
router.get('/verify', authMiddleware, verify);

// POST /api/auth/change-password
router.post('/change-password',
  authMiddleware,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  handleValidation,
  changePassword
);

// POST /api/auth/forgot-password
router.post('/forgot-password',
  [
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  handleValidation,
  forgotPassword
);

// POST /api/auth/reset-password
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  handleValidation,
  resetPassword
);

module.exports = router;
