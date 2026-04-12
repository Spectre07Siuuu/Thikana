const pool = require('../config/db')
const { saveBase64Image } = require('../utils/fileUpload')
const { validationResult } = require('express-validator')

/**
 * POST /api/products
 * Body: { category, title, description, price, location, attributes (object), images_base64 (array of strings) }
 */
async function uploadProduct(req, res) {
  const { category, title, description, price, location, attributes, images_base64 } = req.body
  const seller_id = req.user.id

  if (!category || !title || !price || !location) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' })
  }

  let conn;
  try {
    conn = await pool.getConnection()
    await conn.beginTransaction()

    const attrsJson = attributes ? JSON.stringify(attributes) : null

    const [insertProd] = await conn.query(
      `INSERT INTO products (seller_id, category, title, description, price, location, attributes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [seller_id, category, title, description || '', price, location, attrsJson]
    )

    const productId = insertProd.insertId

    // Handle images
    if (images_base64 && Array.isArray(images_base64) && images_base64.length > 0) {
      for (let i = 0; i < images_base64.length; i++) {
        const base64Str = images_base64[i]
        const isPrimary = i === 0 ? 1 : 0
        const imageUrl = saveBase64Image(base64Str, 'products', `prod-${productId}-${i}`)

        await conn.query(
          `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)`,
          [productId, imageUrl, isPrimary]
        )
      }
    }

    await conn.commit()
    conn.release()

    // ─── DEV ONLY: Auto-approve after 10 seconds ───
    setTimeout(async () => {
      try {
        await pool.query('UPDATE products SET status = "approved" WHERE id = ? AND status = "pending"', [productId])
        console.log(`[Auto-Approve] Product ${productId} automatically approved!`)
      } catch (e) {
        console.error('[Auto-Approve error]', e)
      }
    }, 10000)

    return res.status(201).json({
      success: true,
      message: 'Product uploaded successfully and is pending admin review.',
      productId
    })

  } catch (err) {
    if (conn) {
      await conn.rollback()
      conn.release()
    }
    console.error('[uploadProduct error]', err)
    return res.status(500).json({ success: false, message: 'Failed to upload product.' })
  }
}

/**
 * GET /api/products
 * Query args: ?status=approved&category=house_sell
 */
async function getProducts(req, res) {
  try {
    const { status, category, seller_id } = req.query

    let query = `
      SELECT p.*,
             u.full_name as seller_name, u.avatar_url as seller_avatar, u.nid_verified as seller_verified,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as main_image,
             NULL as seller_rating
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE 1=1
    `

    const params = []

    if (status) {
      query += ' AND p.status = ?'
      params.push(status)
    }

    if (category) {
      query += ' AND p.category = ?'
      params.push(category)
    }

    if (seller_id) {
      query += ' AND p.seller_id = ?'
      params.push(seller_id)
    }

    query += ' ORDER BY p.created_at DESC'

    const [rows] = await pool.query(query, params)

    // Decode JSON attributes
    const formatted = rows.map(r => ({
      ...r,
      attributes:
        r.attributes && typeof r.attributes === 'string'
          ? JSON.parse(r.attributes)
          : (r.attributes || {})
    }))

    return res.json({ success: true, products: formatted })

  } catch (err) {
    console.error('[getProducts error]', err)
    return res.status(500).json({ success: false, message: 'Failed to fetch products.' })
  }
}

/**
 * POST /api/products/admin/review
 * Body: { product_id, status }
 */
async function reviewProduct(req, res) {
  const { product_id, status } = req.body

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' })
  }

  try {
    await pool.query(
      'UPDATE products SET status = ? WHERE id = ?',
      [status, product_id]
    )

    return res.json({
      success: true,
      message: `Product successfully marked as ${status}.`
    })

  } catch (err) {
    console.error('[reviewProduct error]', err)
    return res.status(500).json({ success: false, message: 'Failed to update product.' })
  }
}

/**
 * GET /api/products/:id
 */
async function getProductById(req, res) {
  try {
    const { id } = req.params

    const [rows] = await pool.query(`
      SELECT p.*,
             u.full_name as seller_name, u.avatar_url as seller_avatar, u.nid_verified as seller_verified, u.phone as seller_phone, u.email as seller_email
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.id = ?
    `, [id])

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' })
    }

    const product = rows[0]
    product.attributes = product.attributes && typeof product.attributes === 'string'
      ? JSON.parse(product.attributes)
      : (product.attributes || {})

    // Fetch images
    const [images] = await pool.query('SELECT image_url, is_primary FROM product_images WHERE product_id = ? ORDER BY is_primary DESC', [id])
    product.images = images.map(img => img.image_url)
    product.main_image = images.length > 0 ? images[0].image_url : null

    return res.json({ success: true, product })
  } catch (err) {
    console.error('[getProductById error]', err)
    return res.status(500).json({ success: false, message: 'Failed to fetch product.' })
  }
}

/**
 * PATCH /api/products/:id
 * Body: { title, description, price, status }
 */
async function editProduct(req, res) {
  try {
    const { id } = req.params
    const { title, description, price, status } = req.body
    const seller_id = req.user.id

    // Check ownership
    const [rows] = await pool.query('SELECT seller_id FROM products WHERE id = ?', [id])
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' })
    if (rows[0].seller_id !== seller_id) return res.status(403).json({ success: false, message: 'Unauthorized to edit this product.' })

    const updates = []
    const params = []

    if (title !== undefined) { updates.push('title = ?'); params.push(title) }
    if (description !== undefined) { updates.push('description = ?'); params.push(description) }
    if (price !== undefined) { updates.push('price = ?'); params.push(price) }
    if (status !== undefined) { updates.push('status = ?'); params.push(status) }

    if (updates.length > 0) {
      params.push(id)
      await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params)
    }

    return res.json({ success: true, message: 'Product updated successfully.' })
  } catch (err) {
    console.error('[editProduct error]', err)
    return res.status(500).json({ success: false, message: 'Failed to update product.' })
  }
}

module.exports = {
  uploadProduct,
  getProducts,
  reviewProduct,
  getProductById,
  editProduct
}