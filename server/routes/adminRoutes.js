const express = require('express')
const {
  getDashboard,
  getStats,
  getAdminActivities,
  getAdminProducts,
  reviewProduct,
  getAdminKyc,
  reviewNid,
  blockNid,
  getNidImage,
  getAdminUsers,
  updateUserStatus,
  getAdminSettings,
  updateAdminSettings,
} = require('../controllers/adminController')
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware')

const router = express.Router()

// All admin routes require a valid JWT + is_admin flag
router.use(verifyToken, requireAdmin)

router.get('/dashboard', getDashboard)
router.get('/stats', getStats)
router.get('/activities', getAdminActivities)
router.get('/products', getAdminProducts)
router.post('/products/review', reviewProduct)
router.get('/kyc', getAdminKyc)
router.get('/nid', getAdminKyc)
router.get('/nid/:id/image/:type', getNidImage)
router.post('/kyc/review', reviewNid)
router.post('/nid/review', reviewNid)
router.post('/kyc/block', blockNid)
router.post('/nid/block', blockNid)
router.get('/users', getAdminUsers)
router.patch('/users/:userId/status', updateUserStatus)
router.get('/settings', getAdminSettings)
router.put('/settings', updateAdminSettings)

module.exports = router
