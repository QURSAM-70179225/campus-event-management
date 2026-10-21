const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { config } = require('../config/env');
const { authenticate } = require('../middleware/auth');
const auth = require('../controllers/authController');

const router = Router();

// Slow down password guessing: 20 attempts per 15 minutes per IP (disabled in tests).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => config.isTest,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

router.post('/signup', authLimiter, auth.signup);
router.post('/login', authLimiter, auth.login);
router.get('/me', authenticate, auth.me);

module.exports = router;
