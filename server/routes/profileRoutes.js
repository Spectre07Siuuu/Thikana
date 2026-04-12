const express = require('express')
const { body } = require('express-validator')
const { getProfile, updateProfile, uploadAvatar } = require('../controllers/profileController')
const { verifyToken } = require('../middleware/authMiddleware')

const router = express.Router()

/* ─── Validation rules for profile update ───────────────── */
const updateRules = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Full name must be at least 3 characters.'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone must be 20 characters or fewer.'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Address must be 300 characters or fewer.'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must be 1000 characters or fewer.'),
]

/* ─── Routes (all protected) ────────────────────────────── */

// GET  /api/profile/me
router.get('/me', verifyToken, getProfile)

// PUT  /api/profile/me
router.put('/me', verifyToken, updateRules, updateProfile)

// PUT  /api/profile/me/avatar
router.put('/me/avatar', verifyToken, uploadAvatar)

module.exports = router
