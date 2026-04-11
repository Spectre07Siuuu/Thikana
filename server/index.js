require('dotenv').config()
const express = require('express')
const cors    = require('cors')

// ─── Route imports ────────────────────────────────────────
const authRoutes = require('./routes/authRoutes')

const app  = express()
const PORT = process.env.PORT || 5000

/* ─── Global Middleware ──────────────────────────────────── */
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/* ─── API Routes ─────────────────────────────────────────── */
app.use('/api/auth', authRoutes)

/* ─── Health Check ───────────────────────────────────────── */
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: '🏠 Thikana API is running',
    timestamp: new Date().toISOString(),
  })
})

/* ─── 404 Handler ────────────────────────────────────────── */
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' })
})

/* ─── Global Error Handler ───────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error('[unhandled error]', err)
  res.status(500).json({ success: false, message: 'Internal server error.' })
})

/* ─── Start ──────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀 Thikana API running on http://localhost:${PORT}`)
  console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`)
})
