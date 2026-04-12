const express = require('express')
const { getNidStatus, submitNid, reviewNid } = require('../controllers/nidController')
const { verifyToken } = require('../middleware/authMiddleware')

const router = express.Router()

// GET /api/nid/status
// Get current user's NID verification status
router.get('/status', verifyToken, getNidStatus)

// POST /api/nid/submit
// Submit NID front and selfie images for verification
router.post('/submit', verifyToken, submitNid)

// POST /api/nid/admin/review
// Intentionally UNPROTECTED for testing purposes.
// An admin UI can hit this to easily approve/reject submissions.
router.post('/admin/review', reviewNid)

module.exports = router
