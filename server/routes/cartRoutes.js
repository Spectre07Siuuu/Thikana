const express = require('express')
const rateLimit = require('express-rate-limit')
const { getCart, addToCart, removeFromCart, clearCart, getCartCount } = require('../controllers/cartController')
const { verifyToken, requireBuyer } = require('../middleware/authMiddleware')

const router = express.Router()

const cartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many cart requests. Please try again later.' },
})

router.use(verifyToken, requireBuyer)

router.get('/',        cartLimiter, getCart)
router.get('/count',   cartLimiter, getCartCount)
router.post('/',       cartLimiter, addToCart)
router.delete('/:id',  cartLimiter, removeFromCart)
router.delete('/',     cartLimiter, clearCart)

module.exports = router
