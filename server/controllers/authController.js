const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const crypto   = require('crypto')
const { validationResult } = require('express-validator')
const pool     = require('../config/db')
const { sendMail } = require('../config/mail')

const SALT_ROUNDS = 12
const OTP_TTL_MINUTES = 15
const RESET_TTL_HOURS = 1

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

function safeUser(row) {
  const { password, otp_code, otp_expires_at, reset_token, reset_token_expires_at, ...user } = row
  return user
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function otpEmailHtml(otp) {
  return `<div style="font-family:sans-serif;max-width:460px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e5e7eb"><h2 style="color:#f97316;margin-bottom:8px">Verify your Thikana account</h2><p style="color:#6b7280;margin-bottom:24px">Enter this code to confirm your email. Expires in ${OTP_TTL_MINUTES} minutes.</p><div style="background:#fff7ed;border:2px dashed #f97316;border-radius:10px;padding:20px;text-align:center"><span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#ea580c">${otp}</span></div><p style="color:#9ca3af;font-size:12px;margin-top:24px">If you didn't sign up for Thikana, ignore this email.</p></div>`
}

function resetEmailHtml(resetUrl) {
  return `<div style="font-family:sans-serif;max-width:460px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e5e7eb"><h2 style="color:#f97316;margin-bottom:8px">Reset your Thikana password</h2><p style="color:#6b7280;margin-bottom:24px">Click the button to set a new password. This link expires in ${RESET_TTL_HOURS} hour.</p><a href="${resetUrl}" style="display:inline-block;background:#f97316;color:#fff;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none">Reset Password</a><p style="color:#9ca3af;font-size:12px;margin-top:24px">If you didn't request this, ignore this email.</p></div>`
}

async function signup(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() })

  const { fullName, email, password, role } = req.body
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()])
    if (existing.length > 0) return res.status(409).json({ success: false, message: 'An account with this email already exists.' })

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    const otp = generateOtp()
    const otpExpires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)

    await pool.query(
      `INSERT INTO users (full_name, email, password, role, is_verified, otp_code, otp_expires_at) VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [fullName.trim(), email.toLowerCase(), hashedPassword, role, otp, otpExpires]
    )

    sendMail({ to: email, subject: 'Verify your Thikana account', html: otpEmailHtml(otp), text: `Your Thikana verification code is: ${otp}` })
      .catch(err => console.error('[mail error]', err))

    return res.status(201).json({ success: true, message: 'Account created! Please verify your email.', requiresVerification: true, email: email.toLowerCase() })
  } catch (err) {
    console.error('[signup error]', err)
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' })
  }
}

async function verifyEmail(req, res) {
  const { email, otp } = req.body
  if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required.' })

  try {
    const [rows] = await pool.query(
      `SELECT u.*, (SELECT status FROM nid_submissions WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as nid_status FROM users u WHERE email = ?`,
      [email.toLowerCase()]
    )
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Account not found.' })

    const user = rows[0]
    if (user.is_verified) {
      const token = signToken({ id: user.id, email: user.email, role: user.role, is_admin: !!user.is_admin })
      return res.json({ success: true, message: 'Email already verified.', token, user: safeUser(user) })
    }
    if (!user.otp_code || user.otp_code !== String(otp).trim()) return res.status(400).json({ success: false, message: 'Invalid verification code.' })
    if (!user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' })

    await pool.query('UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL WHERE id = ?', [user.id])
    const [fresh] = await pool.query(
      `SELECT u.*, (SELECT status FROM nid_submissions WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as nid_status FROM users u WHERE u.id = ?`,
      [user.id]
    )
    const token = signToken({ id: user.id, email: user.email, role: user.role, is_admin: !!user.is_admin })
    return res.json({ success: true, message: 'Email verified! Welcome to Thikana.', token, user: safeUser(fresh[0]) })
  } catch (err) {
    console.error('[verifyEmail error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

async function resendOtp(req, res) {
  const { email } = req.body
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' })
  try {
    const [rows] = await pool.query('SELECT id, is_verified FROM users WHERE email = ?', [email.toLowerCase()])
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Account not found.' })
    if (rows[0].is_verified) return res.status(400).json({ success: false, message: 'Email is already verified.' })

    const otp = generateOtp()
    const otpExpires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)
    await pool.query('UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?', [otp, otpExpires, rows[0].id])

    sendMail({ to: email, subject: 'Your new Thikana verification code', html: otpEmailHtml(otp), text: `Your new code: ${otp}` })
      .catch(err => console.error('[mail error]', err))

    return res.json({ success: true, message: 'A new verification code has been sent to your email.' })
  } catch (err) {
    console.error('[resendOtp error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

async function login(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() })

  const { email, password } = req.body
  try {
    const [rows] = await pool.query(
      `SELECT u.*, (SELECT status FROM nid_submissions WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as nid_status FROM users u WHERE email = ?`,
      [email.toLowerCase()]
    )
    if (rows.length === 0) return res.status(401).json({ success: false, message: 'Invalid email or password.' })

    const user = rows[0]
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password.' })

    if (!user.is_verified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in.', requiresVerification: true, email: user.email })
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, is_admin: !!user.is_admin })
    return res.json({ success: true, message: 'Login successful!', token, user: safeUser(user) })
  } catch (err) {
    console.error('[login error]', err)
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' })
  }
}

async function me(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT u.*, (SELECT status FROM nid_submissions WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as nid_status FROM users u WHERE u.id = ?`,
      [req.user.id]
    )
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' })
    return res.json({ success: true, user: safeUser(rows[0]) })
  } catch (err) {
    console.error('[me error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

async function forgotPassword(req, res) {
  const { email } = req.body
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' })
  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()])
    if (rows.length > 0) {
      const token = crypto.randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + RESET_TTL_HOURS * 60 * 60 * 1000)
      await pool.query('UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?', [token, expires, rows[0].id])
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
      const resetUrl  = `${clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`
      sendMail({ to: email, subject: 'Reset your Thikana password', html: resetEmailHtml(resetUrl), text: `Reset your password: ${resetUrl}` })
        .catch(err => console.error('[mail error]', err))
    }
    return res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' })
  } catch (err) {
    console.error('[forgotPassword error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

async function resetPassword(req, res) {
  const { email, token, newPassword } = req.body
  if (!email || !token || !newPassword) return res.status(400).json({ success: false, message: 'Email, token, and new password are required.' })
  if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' })
  try {
    const [rows] = await pool.query('SELECT id, reset_token, reset_token_expires_at FROM users WHERE email = ?', [email.toLowerCase()])
    if (rows.length === 0 || rows[0].reset_token !== token) return res.status(400).json({ success: false, message: 'Invalid or expired reset link.' })
    if (!rows[0].reset_token_expires_at || new Date() > new Date(rows[0].reset_token_expires_at)) return res.status(400).json({ success: false, message: 'Reset link has expired. Please request a new one.' })

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)
    await pool.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?', [hashedPassword, rows[0].id])
    return res.json({ success: true, message: 'Password reset successfully. You can now log in.' })
  } catch (err) {
    console.error('[resetPassword error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/* ─────────────────────────────────────────────────────────
   POST /api/auth/change-password  (authenticated)
   Body: { currentPassword, newPassword }
───────────────────────────────────────────────────────── */
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Both current and new passwords are required.' })
  if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' })
  try {
    const [rows] = await pool.query('SELECT id, password FROM users WHERE id = ?', [req.user.id])
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' })
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password)
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect.' })
    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS)
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id])
    return res.json({ success: true, message: 'Password changed successfully.' })
  } catch (err) {
    console.error('[changePassword error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { signup, verifyEmail, resendOtp, login, me, forgotPassword, resetPassword, changePassword }
