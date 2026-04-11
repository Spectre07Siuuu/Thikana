const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const pool   = require('../config/db')

/* ─── Helpers ────────────────────────────────────────────── */
const SALT_ROUNDS = 12

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

function safeUser(row) {
  // Strip the password hash before sending to client
  const { password, ...user } = row
  return user
}

/* ─────────────────────────────────────────────────────────
   POST /api/auth/signup
   Body: { fullName, email, password, role }
───────────────────────────────────────────────────────── */
async function signup(req, res) {
  // 1. Validate input
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    })
  }

  const { fullName, email, password, role } = req.body

  try {
    // 2. Check if email already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    )
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      })
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    // 4. Insert user
    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, password, role)
       VALUES (?, ?, ?, ?)`,
      [fullName.trim(), email.toLowerCase(), hashedPassword, role]
    )

    // 5. Fetch the created user
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [result.insertId]
    )
    const newUser = rows[0]

    // 6. Issue JWT
    const token = signToken({ id: newUser.id, email: newUser.email, role: newUser.role })

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: safeUser(newUser),
    })
  } catch (err) {
    console.error('[signup error]', err)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/* ─────────────────────────────────────────────────────────
   POST /api/auth/login
   Body: { email, password }
───────────────────────────────────────────────────────── */
async function login(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    })
  }

  const { email, password } = req.body

  try {
    // 1. Find user by email
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()]
    )

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    const user = rows[0]

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    // 3. Issue JWT
    const token = signToken({ id: user.id, email: user.email, role: user.role })

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: safeUser(user),
    })
  } catch (err) {
    console.error('[login error]', err)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/* ─────────────────────────────────────────────────────────
   GET /api/auth/me
   Header: Authorization: Bearer <token>
───────────────────────────────────────────────────────── */
async function me(req, res) {
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
    console.error('[me error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { signup, login, me }
