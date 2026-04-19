const express = require('express')
const rateLimit = require('express-rate-limit')
const { placeOrder, getMyOrders, getSellerOrders, updateOrderStatus } = require('../controllers/orderController')
const { verifyToken } = require('../middleware/authMiddleware')

const router = express.Router()

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
})

router.use(verifyToken)

router.post('/',               apiLimiter, placeOrder)
router.get('/',                getMyOrders)
router.get('/seller',          getSellerOrders)
router.patch('/:id/status',    apiLimiter, updateOrderStatus)

module.exports = router
