const express = require('express')
const rateLimit = require('express-rate-limit')
const { uploadProduct, getProducts, reviewProduct, getProductById, editProduct } = require('../controllers/productController')
const { verifyToken, requireAdmin, requireRole } = require('../middleware/authMiddleware')

const router = express.Router()

// General rate limiter for write/auth-checking product endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
})

// More permissive limiter for public read endpoints
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
})

// GET /api/products
// Fetch all products (supports ?status=...&category=...)
router.get('/', readLimiter, getProducts)

// POST /api/products
// Upload a new product (Sellers and Owners only)
router.post('/', apiLimiter, verifyToken, requireRole('seller', 'owner'), uploadProduct)

// GET /api/products/:id
// Fetch a single product detailing
router.get('/:id', readLimiter, getProductById)

// PATCH /api/products/:id
// Edit product (Sellers/Owners only — ownership also verified in controller)
router.patch('/:id', apiLimiter, verifyToken, requireRole('seller', 'owner'), editProduct)

// POST /api/products/admin/review
// Admin-only: approve or reject products.
router.post('/admin/review', apiLimiter, verifyToken, requireAdmin, reviewProduct)

module.exports = router

