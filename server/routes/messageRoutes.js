const express = require('express')
const { getConversations, getMessages, sendMessage, markConversationRead, getUnreadMessageCount } = require('../controllers/messageController')
const { verifyToken } = require('../middleware/authMiddleware')

const router = express.Router()

router.use(verifyToken)

router.get('/conversations',  getConversations)
router.get('/unread-count',   getUnreadMessageCount)
router.post('/',              sendMessage)
router.get('/:userId',        getMessages)
router.patch('/:userId/read', markConversationRead)

module.exports = router
