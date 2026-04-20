const express = require('express')
const { getFavourites, toggleFavourite, getFavouriteStatus } = require('../controllers/favouriteController')
const { verifyToken, requireBuyer } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/',                  verifyToken, requireBuyer, getFavourites)
router.post('/:productId',       verifyToken, requireBuyer, toggleFavourite)
router.get('/:productId/status', verifyToken, requireBuyer, getFavouriteStatus)

module.exports = router
