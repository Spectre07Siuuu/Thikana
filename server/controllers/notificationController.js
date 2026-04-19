const pool = require('../config/db')

/**
 * Helper: create a notification (used by other controllers)
 */
async function createNotification(userId, type, title, body, link = null) {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, body || null, link]
    )
  } catch (err) {
    console.error('[createNotification error]', err)
  }
}

/**
 * GET /api/notifications?page=1&limit=20
 */
async function getNotifications(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)

    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, parseInt(limit), offset]
    )
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
      [req.user.id]
    )

    return res.json({ success: true, notifications: rows, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } })
  } catch (err) {
    console.error('[getNotifications error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * GET /api/notifications/unread-count
 */
async function getUnreadCount(req, res) {
  try {
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    )
    return res.json({ success: true, count })
  } catch (err) {
    console.error('[getUnreadCount error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * PATCH /api/notifications/:id/read
 */
async function markRead(req, res) {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    )
    return res.json({ success: true })
  } catch (err) {
    console.error('[markRead error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * PATCH /api/notifications/read-all
 */
async function markAllRead(req, res) {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    )
    return res.json({ success: true })
  } catch (err) {
    console.error('[markAllRead error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { createNotification, getNotifications, getUnreadCount, markRead, markAllRead }
