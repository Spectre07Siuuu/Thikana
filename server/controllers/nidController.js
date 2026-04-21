const pool = require('../config/db')
const { saveBase64Image } = require('../utils/fileUpload')

async function getNidStatus(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nid_number, status, admin_note, created_at, reviewed_at FROM nid_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    )
    return res.json({ success: true, submission: rows[0] || null })
  } catch (err) {
    console.error('[getNidStatus error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * @roadmap
 * FUTURE IMPLEMENTATION: Automated NID Verification (OCR)
 * Currently, verification is a manual process where admins review uploaded images.
 * In a production environment, implement an OCR pipeline (e.g., Google Vision API 
 * or a specialized KYC provider) to validate NID numbers and extract data automatically.
 */
async function submitNid(req, res) {
  const { nid_number, nid_front_base64, nid_selfie_base64 } = req.body
  if (!nid_number || !nid_front_base64 || !nid_selfie_base64) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' })
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM nid_submissions WHERE user_id = ? AND status = "pending"',
      [req.user.id]
    )
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'You already have a pending submission in review.' })
    }

    const frontUrl  = saveBase64Image(nid_front_base64,  'nid', `nid-front-${req.user.id}`)
    const selfieUrl = saveBase64Image(nid_selfie_base64, 'nid', `nid-selfie-${req.user.id}`)

    await pool.query(
      'INSERT INTO nid_submissions (user_id, nid_number, nid_front_url, nid_selfie_url) VALUES (?, ?, ?, ?)',
      [req.user.id, nid_number, frontUrl, selfieUrl]
    )

    return res.json({ success: true, message: 'NID submitted successfully. An admin will review it shortly.' })
  } catch (err) {
    console.error('[submitNid error]', err)
    if (err.message.includes('Invalid') || err.message.includes('Unsupported')) {
      return res.status(400).json({ success: false, message: err.message })
    }
    return res.status(500).json({ success: false, message: 'Server error while uploading NID.' })
  }
}

module.exports = { getNidStatus, submitNid }
