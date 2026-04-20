const express = require('express')
const { body } = require('express-validator')
const router = express.Router()

const { addReview, getProductReviews } = require('../controllers/reviewController')
const { verifyToken, requireBuyer } = require('../middleware/authMiddleware')

// Public routes
router.get('/product/:id', getProductReviews)

// Protected routes
router.post('/', verifyToken, requireBuyer, [
  body('order_item_id').isInt().withMessage('Valid order item ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional({ nullable: true, checkFalsy: true }).isString(),
], addReview)

module.exports = router
