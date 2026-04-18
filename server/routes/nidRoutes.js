const express = require('express')
const { getNidStatus, submitNid } = require('../controllers/nidController')
const { verifyToken } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/status', verifyToken, getNidStatus)
router.post('/submit', verifyToken, submitNid)

module.exports = router
