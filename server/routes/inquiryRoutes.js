const express = require('express')
const rateLimit = require('express-rate-limit')
const { sendInquiry, getSellerInquiries, markRead, getUnreadCount } = require('../controllers/inquiryController')
const { verifyToken } = require('../middleware/authMiddleware')

const router = express.Router()

const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many inquiries sent. Please try again later.' },
})

router.post('/',            verifyToken, inquiryLimiter, sendInquiry)
router.get('/seller',       verifyToken, getSellerInquiries)
router.get('/unread-count', verifyToken, getUnreadCount)
router.patch('/:id/read',   verifyToken, markRead)

module.exports = router
