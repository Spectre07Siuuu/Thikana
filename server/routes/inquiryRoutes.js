const express = require('express')
const { sendInquiry, getSellerInquiries, markRead, getUnreadCount } = require('../controllers/inquiryController')
const { verifyToken } = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/',            verifyToken, sendInquiry)
router.get('/seller',       verifyToken, getSellerInquiries)
router.get('/unread-count', verifyToken, getUnreadCount)
router.patch('/:id/read',   verifyToken, markRead)

module.exports = router
