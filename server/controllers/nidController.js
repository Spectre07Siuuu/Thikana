const pool = require('../config/db')
const { saveBase64Image } = require('../utils/fileUpload')

/**
 * GET /api/nid/status
 * Get the latest NID submission status for the logged-in user
 */
async function getNidStatus(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nid_number, status, admin_note, created_at, reviewed_at FROM nid_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    )
    if (rows.length === 0) {
      return res.json({ success: true, submission: null })
    }
    return res.json({ success: true, submission: rows[0] })
  } catch (err) {
    console.error('[getNidStatus error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * POST /api/nid/submit
 * Submit a new NID for verification (Base64)
 */
async function submitNid(req, res) {
  const { nid_number, nid_front_base64, nid_selfie_base64 } = req.body

  if (!nid_number || !nid_front_base64 || !nid_selfie_base64) {
    return res.status(400).json({ success: false, message: 'Missing required fields. Provide NID number and both images.' })
  }

  try {
    // Prevent multiple pending submissions
    const [existing] = await pool.query(
      'SELECT id FROM nid_submissions WHERE user_id = ? AND status = "pending"',
      [req.user.id]
    )
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'You already have a pending submission in review.' })
    }

    // Save images
    const frontUrl = saveBase64Image(nid_front_base64, 'nid', `nid-front-${req.user.id}`)
    const selfieUrl = saveBase64Image(nid_selfie_base64, 'nid', `nid-selfie-${req.user.id}`)

    // Create DB entry
    await pool.query(
      'INSERT INTO nid_submissions (user_id, nid_number, nid_front_url, nid_selfie_url) VALUES (?, ?, ?, ?)',
      [req.user.id, nid_number, frontUrl, selfieUrl]
    )

    // ─── DEV ONLY: Auto-approve after 10 seconds ───
    const userId = req.user.id;
    setTimeout(async () => {
      try {
        await pool.query('UPDATE nid_submissions SET status = "approved", reviewed_at = NOW() WHERE user_id = ? AND status = "pending"', [userId]);
        await pool.query('UPDATE users SET nid_verified = 1 WHERE id = ?', [userId]);
        console.log(`[Auto-Approve] NID for user ${userId} automatically approved!`);
      } catch (e) {
        console.error('[Auto-Approve error]', e);
      }
    }, 10000);

    return res.json({ success: true, message: 'NID submitted successfully for admin review.' })
  } catch (err) {
    console.error('[submitNid error]', err)
    if (err.message.includes('Invalid') || err.message.includes('Unsupported')) {
      return res.status(400).json({ success: false, message: err.message })
    }
    return res.status(500).json({ success: false, message: 'Server error while uploading NID.' })
  }
}

/**
 * POST /api/nid/admin/review
 * Test-only endpoint to instantly approve/reject an NID submission
 */
async function reviewNid(req, res) {
  const { submission_id, status, admin_note } = req.body

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Must be "approved" or "rejected".' })
  }

  try {
    const [subs] = await pool.query('SELECT * FROM nid_submissions WHERE id = ?', [submission_id])
    if (subs.length === 0) {
      return res.status(404).json({ success: false, message: 'Submission not found.' })
    }
    const sub = subs[0]

    // Update submission
    await pool.query(
      'UPDATE nid_submissions SET status = ?, admin_note = ?, reviewed_at = NOW() WHERE id = ?',
      [status, admin_note || null, submission_id]
    )

    // Sync users.nid_verified flag
    const isVerified = status === 'approved' ? 1 : 0
    await pool.query('UPDATE users SET nid_verified = ? WHERE id = ?', [isVerified, sub.user_id])

    return res.json({ success: true, message: `Submission successfully marked as ${status}.` })
  } catch (err) {
    console.error('[reviewNid error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { getNidStatus, submitNid, reviewNid }
