require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const path    = require('path')

const authRoutes      = require('./routes/authRoutes')
const profileRoutes   = require('./routes/profileRoutes')
const nidRoutes       = require('./routes/nidRoutes')
const productRoutes   = require('./routes/productRoutes')
const favouriteRoutes = require('./routes/favouriteRoutes')
const inquiryRoutes   = require('./routes/inquiryRoutes')
const adminRoutes     = require('./routes/adminRoutes')

const app  = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth',       authRoutes)
app.use('/api/profile',    profileRoutes)
app.use('/api/nid',        nidRoutes)
app.use('/api/products',   productRoutes)
app.use('/api/favourites', favouriteRoutes)
app.use('/api/inquiries',  inquiryRoutes)
app.use('/api/admin',      adminRoutes)

app.get('/api/health', (_req, res) => res.json({ success: true, message: '🏠 Thikana API is running', timestamp: new Date().toISOString() }))
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found.' }))
app.use((err, _req, res, _next) => { console.error('[unhandled error]', err); res.status(500).json({ success: false, message: 'Internal server error.' }) })

app.listen(PORT, () => {
  console.log(`\n🚀 Thikana API running on http://localhost:${PORT}`)
  console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`)
})
