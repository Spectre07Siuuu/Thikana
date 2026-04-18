const express = require('express')
const { getFavourites, toggleFavourite, getFavouriteStatus } = require('../controllers/favouriteController')
const { verifyToken } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/',                  verifyToken, getFavourites)
router.post('/:productId',       verifyToken, toggleFavourite)
router.get('/:productId/status', verifyToken, getFavouriteStatus)

module.exports = router
