const express = require('express')
const { uploadProduct, getProducts, reviewProduct, getProductById, editProduct } = require('../controllers/productController')
const { verifyToken } = require('../middleware/authMiddleware')

const router = express.Router()

// GET /api/products
// Fetch all products (supports ?status=...&category=...)
router.get('/', getProducts)

// POST /api/products
// Upload a new product (Sellers only)
router.post('/', verifyToken, uploadProduct)

// GET /api/products/:id
// Fetch a single product detailing
router.get('/:id', getProductById)

// PATCH /api/products/:id
// Edit product (Sellers only)
router.patch('/:id', verifyToken, editProduct)

// POST /api/products/admin/review
// Unprotected for testing purposes. Approve or reject products.
router.post('/admin/review', reviewProduct)

module.exports = router
