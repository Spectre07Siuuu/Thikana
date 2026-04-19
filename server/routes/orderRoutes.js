const express = require('express')
const { placeOrder, getMyOrders, getSellerOrders, updateOrderStatus } = require('../controllers/orderController')
const { verifyToken } = require('../middleware/authMiddleware')

const router = express.Router()

router.use(verifyToken)

router.post('/',               placeOrder)
router.get('/',                getMyOrders)
router.get('/seller',          getSellerOrders)
router.patch('/:id/status',    updateOrderStatus)

module.exports = router
