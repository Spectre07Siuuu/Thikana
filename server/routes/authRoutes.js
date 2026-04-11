const express = require('express')
const { body } = require('express-validator')
const { signup, login, me } = require('../controllers/authController')
const { verifyToken } = require('../middleware/authMiddleware')

const router = express.Router()

/* ─── Validation rules ───────────────────────────────────── */
const signupRules = [
  body('fullName')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Full name must be at least 3 characters.'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address.'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters.'),
  body('role')
    .isIn(['buyer', 'seller', 'owner'])
    .withMessage('Role must be buyer, seller, or owner.'),
]

const loginRules = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address.'),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
]

/* ─── Routes ─────────────────────────────────────────────── */

// POST /api/auth/signup
router.post('/signup', signupRules, signup)

// POST /api/auth/login
router.post('/login', loginRules, login)

// GET  /api/auth/me  (protected)
router.get('/me', verifyToken, me)

module.exports = router
