const express = require('express')
const { getCart, addToCart, removeFromCart, clearCart, getCartCount } = require('../controllers/cartController')
const { verifyToken } = require('../middleware/authMiddleware')

const router = express.Router()

router.use(verifyToken)

router.get('/',        getCart)
router.get('/count',   getCartCount)
router.post('/',       addToCart)
router.delete('/:id',  removeFromCart)
router.delete('/',     clearCart)

module.exports = router
