const express = require('express')
const { uploadProduct, getProducts, reviewProduct, getProductById, editProduct } = require('../controllers/productController')
const { verifyToken, requireAdmin, requireRole } = require('../middleware/authMiddleware')

const router = express.Router()

// GET /api/products
// Fetch all products (supports ?status=...&category=...)
router.get('/', getProducts)

// POST /api/products
// Upload a new product (Sellers and Owners only)
router.post('/', verifyToken, requireRole('seller', 'owner'), uploadProduct)

// GET /api/products/:id
// Fetch a single product detailing
router.get('/:id', getProductById)

// PATCH /api/products/:id
// Edit product (Sellers/Owners only — ownership also verified in controller)
router.patch('/:id', verifyToken, requireRole('seller', 'owner'), editProduct)

// POST /api/products/admin/review
// Admin-only: approve or reject products.
router.post('/admin/review', verifyToken, requireAdmin, reviewProduct)

module.exports = router

