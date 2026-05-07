const pool = require('../config/db')
const { createNotification } = require('./notificationController')

async function getPendingProducts(req, res) {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)
    const { rows } = await pool.query(`
      SELECT p.*, u.full_name as seller_name, u.email as seller_email,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as main_image
      FROM products p JOIN users u ON p.seller_id = u.id
      WHERE p.status = $1 ORDER BY p.created_at DESC LIMIT $2 OFFSET $3
    `, [status, parseInt(limit), offset])
    const { rows: countRows } = await pool.query('SELECT COUNT(*) as total FROM products WHERE status = $1', [status])
    const total = parseInt(countRows[0].total)
    return res.json({ success: true, products: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } })
  } catch (err) {
    console.error('[admin.getPendingProducts]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

async function reviewProduct(req, res) {
  const { product_id, status, admin_note } = req.body
  if (!product_id || !['approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'product_id and valid status required.' })
  try {
    const { rows: prods } = await pool.query('SELECT seller_id, title FROM products WHERE id = $1', [product_id])
    await pool.query('UPDATE products SET status = $1 WHERE id = $2', [status, product_id])
    if (prods.length > 0) {
      const notifType = status === 'approved' ? 'product_approved' : 'product_rejected'
      const emoji = status === 'approved' ? '✅' : '❌'
      createNotification(prods[0].seller_id, notifType, `Listing ${status} ${emoji}`, `Your listing "${prods[0].title}" has been ${status} by admin.${admin_note ? ' Note: ' + admin_note : ''}`, status === 'approved' ? `/product/${product_id}` : '/profile')
    }
    return res.json({ success: true, message: `Product marked as ${status}.` })
  } catch (err) {
    console.error('[admin.reviewProduct]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

async function getPendingNid(req, res) {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)
    const { rows } = await pool.query(`
      SELECT n.*, u.full_name, u.email, u.phone
      FROM nid_submissions n JOIN users u ON n.user_id = u.id
      WHERE n.status = $1 ORDER BY n.created_at DESC LIMIT $2 OFFSET $3
    `, [status, parseInt(limit), offset])
    const { rows: countRows } = await pool.query('SELECT COUNT(*) as total FROM nid_submissions WHERE status = $1', [status])
    const total = parseInt(countRows[0].total)
    return res.json({ success: true, submissions: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } })
  } catch (err) {
    console.error('[admin.getPendingNid]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

async function reviewNid(req, res) {
  const { submission_id, status, admin_note } = req.body
  if (!submission_id || !['approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'submission_id and valid status required.' })
  try {
    const { rows: subs } = await pool.query('SELECT user_id FROM nid_submissions WHERE id = $1', [submission_id])
    if (subs.length === 0) return res.status(404).json({ success: false, message: 'Submission not found.' })
    await pool.query('UPDATE nid_submissions SET status = $1, admin_note = $2, reviewed_at = NOW() WHERE id = $3', [status, admin_note || null, submission_id])
    await pool.query('UPDATE users SET nid_verified = $1 WHERE id = $2', [status === 'approved', subs[0].user_id])
    const emoji = status === 'approved' ? '🎉' : '⚠️'
    createNotification(subs[0].user_id, status === 'approved' ? 'nid_approved' : 'nid_rejected', `NID Verification ${status === 'approved' ? 'Approved' : 'Rejected'} ${emoji}`, `Your identity verification has been ${status}.${admin_note ? ' Admin note: ' + admin_note : ''}`, '/profile')
    return res.json({ success: true, message: `NID submission marked as ${status}.` })
  } catch (err) {
    console.error('[admin.reviewNid]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

async function getStats(req, res) {
  try {
    const { rows: [{ users }] } = await pool.query('SELECT COUNT(*) as users FROM users')
    const { rows: [{ products }] } = await pool.query('SELECT COUNT(*) as products FROM products')
    const { rows: [{ pending_prod }] } = await pool.query("SELECT COUNT(*) as pending_prod FROM products WHERE status = 'pending'")
    const { rows: [{ pending_nid }] } = await pool.query("SELECT COUNT(*) as pending_nid FROM nid_submissions WHERE status = 'pending'")
    const { rows: [{ inquiries }] } = await pool.query('SELECT COUNT(*) as inquiries FROM inquiries')
    return res.json({ success: true, stats: { users: parseInt(users), products: parseInt(products), pending_prod: parseInt(pending_prod), pending_nid: parseInt(pending_nid), inquiries: parseInt(inquiries) } })
  } catch (err) {
    console.error('[admin.getStats]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { getPendingProducts, reviewProduct, getPendingNid, reviewNid, getStats }
