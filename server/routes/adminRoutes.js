const express = require('express')
const { getPendingProducts, reviewProduct, getPendingNid, reviewNid, getStats } = require('../controllers/adminController')
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware')

const router = express.Router()

// All admin routes require a valid JWT + is_admin flag
router.use(verifyToken, requireAdmin)

router.get('/stats', getStats)
router.get('/products', getPendingProducts)
router.post('/products/review', reviewProduct)
router.get('/nid', getPendingNid)
router.post('/nid/review', reviewNid)

module.exports = router
