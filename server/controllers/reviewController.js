const { validationResult } = require('express-validator')
const pool = require('../config/db')
const { createNotification } = require('./notificationController')

/**
 * POST /api/reviews
 * Body: { order_item_id, rating, comment }
 */
async function addReview(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() })

  const { order_item_id, rating, comment } = req.body
  const buyerId = req.user.id

  try {
    // Check if order item belongs to buyer and get details
    const [orders] = await pool.query(`
      SELECT oi.id, oi.product_id, oi.seller_id, o.buyer_id
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.id = ? AND o.buyer_id = ?
    `, [order_item_id, buyerId])

    if (orders.length === 0) {
      return res.status(403).json({ success: false, message: 'Invalid order item or unauthorized.' })
    }

    const { product_id, seller_id } = orders[0]

    // Insert review
    await pool.query(
      'INSERT INTO reviews (order_item_id, buyer_id, seller_id, product_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [order_item_id, buyerId, seller_id, product_id, rating, comment?.trim() || null]
    )

    // Notify seller
    createNotification(
      seller_id, 'system',
      'New Product Review! ⭐',
      `You received a ${rating}-star review for one of your products.`,
      `/product/${product_id}`
    )

    return res.status(201).json({ success: true, message: 'Review added successfully!' })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'You have already reviewed this item.' })
    }
    console.error('[addReview error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * GET /api/reviews/product/:id
 */
async function getProductReviews(req, res) {
  try {
    const { id } = req.params
    const [reviews] = await pool.query(`
      SELECT r.id, r.rating, r.comment, r.created_at,
             u.full_name as buyer_name, u.avatar_url as buyer_avatar
      FROM reviews r
      JOIN users u ON r.buyer_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [id])

    // Calculate stats
    const total = reviews.length
    const avgRating = total > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : 0

    return res.json({ success: true, reviews, avgRating, total })
  } catch (err) {
    console.error('[getProductReviews error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = {
  addReview,
  getProductReviews,
}
