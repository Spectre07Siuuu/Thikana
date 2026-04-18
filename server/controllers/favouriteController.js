const pool = require('../config/db')

/**
 * GET /api/favourites — list user's saved listings
 */
async function getFavourites(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.title, p.price, p.location, p.category, p.status,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as main_image,
             u.nid_verified as seller_verified,
             f.created_at as saved_at
      FROM favourites f
      JOIN products p ON f.product_id = p.id
      JOIN users u ON p.seller_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [req.user.id])
    return res.json({ success: true, favourites: rows })
  } catch (err) {
    console.error('[getFavourites error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * POST /api/favourites/:productId — toggle save/unsave
 */
async function toggleFavourite(req, res) {
  const { productId } = req.params
  try {
    const [existing] = await pool.query(
      'SELECT id FROM favourites WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    )
    if (existing.length > 0) {
      await pool.query('DELETE FROM favourites WHERE user_id = ? AND product_id = ?', [req.user.id, productId])
      return res.json({ success: true, saved: false, message: 'Removed from saved listings.' })
    } else {
      await pool.query('INSERT INTO favourites (user_id, product_id) VALUES (?, ?)', [req.user.id, productId])
      return res.json({ success: true, saved: true, message: 'Added to saved listings.' })
    }
  } catch (err) {
    console.error('[toggleFavourite error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * GET /api/favourites/:productId/status — check if saved
 */
async function getFavouriteStatus(req, res) {
  const { productId } = req.params
  try {
    const [rows] = await pool.query(
      'SELECT id FROM favourites WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    )
    return res.json({ success: true, saved: rows.length > 0 })
  } catch (err) {
    console.error('[getFavouriteStatus error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { getFavourites, toggleFavourite, getFavouriteStatus }
