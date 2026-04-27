const pool = require('../config/db')
const { saveBase64Image } = require('../utils/fileUpload')

/**
 * POST /api/products
 */
async function uploadProduct(req, res) {
  const { category, title, description, price, location, attributes, images_base64 } = req.body
  const seller_id = req.user.id

  if (!category || !title || !price || !location) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' })
  }

  let conn
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

    if (Array.isArray(images_base64) && images_base64.length > 0) {
      for (let i = 0; i < images_base64.length; i++) {
        const imageUrl = saveBase64Image(images_base64[i], 'products', `prod-${productId}-${i}`)
        await conn.query(
          `INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)`,
          [productId, imageUrl, i === 0 ? 1 : 0]
        )
      }
    }

    await conn.commit()
    conn.release()

    return res.status(201).json({
      success: true,
      message: 'Product uploaded and is pending admin review.',
      productId,
    })
  } catch (err) {
    if (conn) { await conn.rollback(); conn.release() }
    console.error('[uploadProduct error]', err)
    return res.status(500).json({ success: false, message: 'Failed to upload product.' })
  }
}

/**
 * GET /api/products
 * Query: ?status=approved&category=house_sell&seller_id=1
 *        &minPrice=1000&maxPrice=50000
 *        &beds=2&condition=New
 *        &q=search+term
 *        &sort=price_asc|price_desc|newest|oldest
 *        &page=1&limit=20
 */
async function getProducts(req, res) {
  try {
    const {
      status, category, seller_id,
      minPrice, maxPrice,
      beds, condition,
      q,
      sort = 'newest',
      page = 1, limit = 20,
    } = req.query

    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit))
    const pageSize = Math.min(100, parseInt(limit))

    let where = ' WHERE 1=1'
    const params = []

    if (status) { where += ' AND p.status = ?'; params.push(status) }
    if (category) { where += ' AND p.category = ?'; params.push(category) }
    if (seller_id) { where += ' AND p.seller_id = ?'; params.push(seller_id) }
    if (minPrice) { where += ' AND p.price >= ?'; params.push(parseFloat(minPrice)) }
    if (maxPrice) { where += ' AND p.price <= ?'; params.push(parseFloat(maxPrice)) }
    if (q) {
      const words = q.trim().split(/\s+/)
      where += ' AND ('
      words.forEach((w, index) => {
        if (index > 0) where += ' OR '
        where += '(p.title LIKE ? OR p.location LIKE ? OR p.description LIKE ?)'
        params.push(`%${w}%`, `%${w}%`, `%${w}%`)
      })
      where += ')'
    }
    // JSON attribute filters
    if (beds) { where += ` AND JSON_EXTRACT(p.attributes, '$.beds') = ?`; params.push(String(beds)) }
    if (condition) { where += ` AND JSON_EXTRACT(p.attributes, '$.condition') = ?`; params.push(condition) }

    const orderMap = {
      newest:     'p.created_at DESC',
      oldest:     'p.created_at ASC',
      price_asc:  'p.price ASC',
      price_desc: 'p.price DESC',
    }
    const orderBy = orderMap[sort] || 'p.created_at DESC'

    const baseQuery = `
      SELECT p.*,
             u.full_name as seller_name, u.avatar_url as seller_avatar, u.nid_verified as seller_verified,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as main_image
      FROM products p
      JOIN users u ON p.seller_id = u.id
      ${where}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?`

    const countQuery = `SELECT COUNT(*) as total FROM products p JOIN users u ON p.seller_id = u.id ${where}`

    const [rows] = await pool.query(baseQuery, [...params, pageSize, offset])
    const [countRows] = await pool.query(countQuery, params)
    const total = countRows[0].total

    const formatted = rows.map(r => ({
      ...r,
      attributes: r.attributes && typeof r.attributes === 'string' ? JSON.parse(r.attributes) : (r.attributes || {}),
    }))

    return res.json({
      success: true,
      products: formatted,
      pagination: {
        total,
        page: parseInt(page),
        limit: pageSize,
        pages: Math.ceil(total / pageSize),
      },
    })
  } catch (err) {
    console.error('[getProducts error]', err)
    return res.status(500).json({ success: false, message: 'Failed to fetch products.' })
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
             u.full_name as seller_name, u.avatar_url as seller_avatar,
             u.nid_verified as seller_verified, u.phone as seller_phone, u.email as seller_email
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.id = ?
    `, [id])

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' })

    const product = rows[0]
    product.attributes = product.attributes && typeof product.attributes === 'string'
      ? JSON.parse(product.attributes) : (product.attributes || {})

    const [images] = await pool.query(
      'SELECT image_url, is_primary FROM product_images WHERE product_id = ? ORDER BY is_primary DESC',
      [id]
    )
    product.images    = images.map(img => img.image_url)
    product.main_image = images.length > 0 ? images[0].image_url : null

    // Increment view count (fire and forget)
    pool.query('UPDATE products SET views = views + 1 WHERE id = ?', [id]).catch(() => {})

    // Related listings: same category, not this product, approved/sold
    const [related] = await pool.query(`
      SELECT p.id, p.title, p.price, p.location, p.category, p.status,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as main_image,
             u.nid_verified as seller_verified
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.category = ? AND p.id != ? AND p.status IN ('approved','sold')
      ORDER BY p.created_at DESC
      LIMIT 6
    `, [product.category, id])

    product.related = related

    return res.json({ success: true, product })
  } catch (err) {
    console.error('[getProductById error]', err)
    return res.status(500).json({ success: false, message: 'Failed to fetch product.' })
  }
}

/**
 * PATCH /api/products/:id  (seller edits own product)
 */
async function editProduct(req, res) {
  try {
    const { id } = req.params
    const { title, description, price, status } = req.body
    const seller_id = req.user.id

    const [rows] = await pool.query('SELECT seller_id FROM products WHERE id = ?', [id])
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' })
    if (rows[0].seller_id !== seller_id) return res.status(403).json({ success: false, message: 'Unauthorized to edit this product.' })

    const updates = []
    const params  = []
    if (title !== undefined)       { updates.push('title = ?');       params.push(title) }
    if (description !== undefined) { updates.push('description = ?'); params.push(description) }
    if (price !== undefined)       { updates.push('price = ?');       params.push(price) }
    if (status !== undefined)      { updates.push('status = ?');      params.push(status) }

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

/**
 * POST /api/products/admin/review  (admin only — see adminController)
 * Kept here for internal use; route is now protected in adminRoutes.
 */
async function reviewProduct(req, res) {
  const { product_id, status, admin_note } = req.body
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' })
  }
  try {
    await pool.query('UPDATE products SET status = ? WHERE id = ?', [status, product_id])
    return res.json({ success: true, message: `Product marked as ${status}.` })
  } catch (err) {
    console.error('[reviewProduct error]', err)
    return res.status(500).json({ success: false, message: 'Failed to update product.' })
  }
}

module.exports = { uploadProduct, getProducts, getProductById, editProduct, reviewProduct }
