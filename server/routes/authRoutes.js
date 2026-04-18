const express = require('express')
const { body } = require('express-validator')
const { signup, verifyEmail, resendOtp, login, me, forgotPassword, resetPassword } = require('../controllers/authController')
const { verifyToken } = require('../middleware/authMiddleware')

const router = express.Router()

const signupRules = [
  body('fullName').trim().isLength({ min: 3 }).withMessage('Full name must be at least 3 characters.'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email address.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('role').isIn(['buyer', 'seller', 'owner']).withMessage('Role must be buyer, seller, or owner.'),
]

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email address.'),
  body('password').notEmpty().withMessage('Password is required.'),
]

router.post('/signup',          signupRules, signup)
router.post('/verify-email',    verifyEmail)
router.post('/resend-otp',      resendOtp)
router.post('/login',           loginRules, login)
router.get('/me',               verifyToken, me)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password',  resetPassword)

module.exports = router
