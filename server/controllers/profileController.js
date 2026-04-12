const { validationResult } = require('express-validator')
const pool = require('../config/db')
const { saveBase64Image } = require('../utils/fileUpload')

/* ── Helper: strip password hash ─────────────────────────── */
function safeUser(row) {
  const { password, otp_code, otp_expires_at, ...user } = row
  return user
}

/* ─────────────────────────────────────────────────────────
   GET /api/profile/me
   Header: Authorization: Bearer <token>
───────────────────────────────────────────────────────── */
async function getProfile(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }
    return res.json({ success: true, user: safeUser(rows[0]) })
  } catch (err) {
    console.error('[getProfile error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/* ─────────────────────────────────────────────────────────
   PUT /api/profile/me
   Header: Authorization: Bearer <token>
   Body: { fullName?, phone?, address?, bio? }
───────────────────────────────────────────────────────── */
async function updateProfile(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    })
  }

  const { fullName, phone, address, bio } = req.body

  try {
    // Build dynamic SET clause — only update fields that were sent
    const fields = []
    const values = []

    if (fullName !== undefined) { fields.push('full_name = ?'); values.push(fullName.trim()) }
    if (phone !== undefined)    { fields.push('phone = ?');     values.push(phone.trim() || null) }
    if (address !== undefined)  { fields.push('address = ?');   values.push(address.trim() || null) }
    if (bio !== undefined)      { fields.push('bio = ?');       values.push(bio.trim() || null) }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' })
    }

    values.push(req.user.id)

    await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    // Return updated user
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id])
    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: safeUser(rows[0]),
    })
  } catch (err) {
    console.error('[updateProfile error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/* ─────────────────────────────────────────────────────────
   PUT /api/profile/avatar
   Header: Authorization: Bearer <token>
   Body: { avatar_base64 }
───────────────────────────────────────────────────────── */
async function uploadAvatar(req, res) {
  const { avatar_base64 } = req.body

  if (!avatar_base64) {
    return res.status(400).json({ success: false, message: 'No image provided.' })
  }

  try {
    // Generate a file and get the URL
    const avatarUrl = saveBase64Image(avatar_base64, 'avatars', `user-${req.user.id}`)

    // Update database
    await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id])

    // Get updated user
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id])
    
    return res.json({
      success: true,
      message: 'Profile picture updated!',
      user: safeUser(rows[0]),
    })
  } catch (err) {
    console.error('[uploadAvatar error]', err)
    if (err.message.includes('Invalid') || err.message.includes('Unsupported')) {
      return res.status(400).json({ success: false, message: err.message })
    }
    return res.status(500).json({ success: false, message: 'Server error while uploading image.' })
  }
}

module.exports = { getProfile, updateProfile, uploadAvatar }
