const pool = require('../config/db')

/**
 * GET /api/cart
 */
async function getCart(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT ci.id as cart_item_id, ci.quantity, ci.created_at as added_at,
             p.id as product_id, p.title, p.price, p.location, p.category, p.status, p.seller_id,
             u.full_name as seller_name, u.nid_verified as seller_verified,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as main_image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN users u ON p.seller_id = u.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `, [req.user.id])

    const total = rows.reduce((sum, r) => sum + parseFloat(r.price) * r.quantity, 0)

    return res.json({ success: true, items: rows, total })
  } catch (err) {
    console.error('[getCart error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * POST /api/cart  — { product_id }
 */
async function addToCart(req, res) {
  const { product_id } = req.body
  if (!product_id) return res.status(400).json({ success: false, message: 'Product ID required.' })

  try {
    // Validate product
    const [prods] = await pool.query(
      'SELECT id, category, status, seller_id FROM products WHERE id = ?', [product_id]
    )
    if (prods.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' })

    const prod = prods[0]
    if (!['furniture', 'appliance'].includes(prod.category)) {
      return res.status(400).json({ success: false, message: 'Only furniture and appliance items can be added to cart.' })
    }
    if (prod.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'This product is not available for purchase.' })
    }
    if (prod.seller_id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot buy your own product.' })
    }

    // Check if already in cart
    const [existing] = await pool.query(
      'SELECT id FROM cart_items WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    )
    if (existing.length > 0) {
      return res.json({ success: true, message: 'Already in cart.', alreadyInCart: true })
    }

    await pool.query(
      'INSERT INTO cart_items (user_id, product_id) VALUES (?, ?)',
      [req.user.id, product_id]
    )

    // Get updated count
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) as count FROM cart_items WHERE user_id = ?', [req.user.id]
    )

    return res.status(201).json({ success: true, message: 'Added to cart!', cartCount: count })
  } catch (err) {
    console.error('[addToCart error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * DELETE /api/cart/:id  — remove one cart item
 */
async function removeFromCart(req, res) {
  try {
    await pool.query(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    )
    return res.json({ success: true, message: 'Removed from cart.' })
  } catch (err) {
    console.error('[removeFromCart error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * DELETE /api/cart  — clear entire cart
 */
async function clearCart(req, res) {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id])
    return res.json({ success: true, message: 'Cart cleared.' })
  } catch (err) {
    console.error('[clearCart error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * GET /api/cart/count
 */
async function getCartCount(req, res) {
  try {
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) as count FROM cart_items WHERE user_id = ?', [req.user.id]
    )
    return res.json({ success: true, count })
  } catch (err) {
    console.error('[getCartCount error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { getCart, addToCart, removeFromCart, clearCart, getCartCount }
