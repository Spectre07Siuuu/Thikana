const pool = require('../config/db')

/**
 * GET /api/admin/products?status=pending&page=1
 */
async function getPendingProducts(req, res) {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)

    const [rows] = await pool.query(`
      SELECT p.*, u.full_name as seller_name, u.email as seller_email,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as main_image
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [status, parseInt(limit), offset])

    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM products WHERE status = ?', [status])

    return res.json({ success: true, products: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } })
  } catch (err) {
    console.error('[admin.getPendingProducts]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * POST /api/admin/products/review
 * Body: { product_id, status, admin_note }
 */
async function reviewProduct(req, res) {
  const { product_id, status, admin_note } = req.body
  if (!product_id || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'product_id and valid status required.' })
  }
  try {
    await pool.query('UPDATE products SET status = ? WHERE id = ?', [status, product_id])
    return res.json({ success: true, message: `Product marked as ${status}.` })
  } catch (err) {
    console.error('[admin.reviewProduct]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * GET /api/admin/nid?status=pending&page=1
 */
async function getPendingNid(req, res) {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)

    const [rows] = await pool.query(`
      SELECT n.*, u.full_name, u.email, u.phone
      FROM nid_submissions n
      JOIN users u ON n.user_id = u.id
      WHERE n.status = ?
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `, [status, parseInt(limit), offset])

    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM nid_submissions WHERE status = ?', [status])

    return res.json({ success: true, submissions: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } })
  } catch (err) {
    console.error('[admin.getPendingNid]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * POST /api/admin/nid/review
 * Body: { submission_id, status, admin_note }
 */
async function reviewNid(req, res) {
  const { submission_id, status, admin_note } = req.body
  if (!submission_id || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'submission_id and valid status required.' })
  }
  try {
    const [subs] = await pool.query('SELECT user_id FROM nid_submissions WHERE id = ?', [submission_id])
    if (subs.length === 0) return res.status(404).json({ success: false, message: 'Submission not found.' })

    await pool.query(
      'UPDATE nid_submissions SET status = ?, admin_note = ?, reviewed_at = NOW() WHERE id = ?',
      [status, admin_note || null, submission_id]
    )
    await pool.query('UPDATE users SET nid_verified = ? WHERE id = ?', [status === 'approved' ? 1 : 0, subs[0].user_id])

    return res.json({ success: true, message: `NID submission marked as ${status}.` })
  } catch (err) {
    console.error('[admin.reviewNid]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * GET /api/admin/stats
 */
async function getStats(req, res) {
  try {
    const [[{ users }]]       = await pool.query('SELECT COUNT(*) as users FROM users')
    const [[{ products }]]    = await pool.query('SELECT COUNT(*) as products FROM products')
    const [[{ pending_prod }]] = await pool.query(`SELECT COUNT(*) as pending_prod FROM products WHERE status = 'pending'`)
    const [[{ pending_nid }]]  = await pool.query(`SELECT COUNT(*) as pending_nid FROM nid_submissions WHERE status = 'pending'`)
    const [[{ inquiries }]]   = await pool.query('SELECT COUNT(*) as inquiries FROM inquiries')
    return res.json({ success: true, stats: { users, products, pending_prod, pending_nid, inquiries } })
  } catch (err) {
    console.error('[admin.getStats]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { getPendingProducts, reviewProduct, getPendingNid, reviewNid, getStats }
