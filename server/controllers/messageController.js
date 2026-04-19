const pool = require('../config/db')

/**
 * GET /api/messages/conversations
 * Returns unique conversation partners with last message preview and unread count
 */
async function getConversations(req, res) {
  try {
    const userId = req.user.id

    const [rows] = await pool.query(`
      SELECT 
        partner_id,
        u.full_name as partner_name,
        u.avatar_url as partner_avatar,
        u.nid_verified as partner_verified,
        last_message,
        last_message_at,
        unread_count,
        product_id,
        p.title as product_title
      FROM (
        SELECT
          CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as partner_id,
          (SELECT content FROM messages m2 
           WHERE (m2.sender_id = ? AND m2.receiver_id = CASE WHEN messages.sender_id = ? THEN messages.receiver_id ELSE messages.sender_id END)
              OR (m2.receiver_id = ? AND m2.sender_id = CASE WHEN messages.sender_id = ? THEN messages.receiver_id ELSE messages.sender_id END)
           ORDER BY m2.created_at DESC LIMIT 1
          ) as last_message,
          MAX(messages.created_at) as last_message_at,
          SUM(CASE WHEN messages.receiver_id = ? AND messages.is_read = 0 THEN 1 ELSE 0 END) as unread_count,
          (SELECT m3.product_id FROM messages m3 
           WHERE ((m3.sender_id = ? AND m3.receiver_id = CASE WHEN messages.sender_id = ? THEN messages.receiver_id ELSE messages.sender_id END)
              OR (m3.receiver_id = ? AND m3.sender_id = CASE WHEN messages.sender_id = ? THEN messages.receiver_id ELSE messages.sender_id END))
             AND m3.product_id IS NOT NULL
           ORDER BY m3.created_at DESC LIMIT 1
          ) as product_id
        FROM messages
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY partner_id
      ) as convos
      JOIN users u ON u.id = convos.partner_id
      LEFT JOIN products p ON p.id = convos.product_id
      ORDER BY last_message_at DESC
    `, [userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId])

    return res.json({ success: true, conversations: rows })
  } catch (err) {
    console.error('[getConversations error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * GET /api/messages/:userId?product_id=X&page=1&limit=50
 * Returns message history between current user and :userId
 */
async function getMessages(req, res) {
  try {
    const userId = req.user.id
    const partnerId = req.params.userId
    const { product_id, page = 1, limit = 50 } = req.query
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)

    let where = '((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))'
    const params = [userId, partnerId, partnerId, userId]

    if (product_id) {
      where += ' AND product_id = ?'
      params.push(product_id)
    }

    const [rows] = await pool.query(
      `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE ${where}
       ORDER BY m.created_at ASC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    )

    // Get partner info
    const [partners] = await pool.query(
      'SELECT id, full_name, avatar_url, nid_verified FROM users WHERE id = ?',
      [partnerId]
    )

    return res.json({
      success: true,
      messages: rows,
      partner: partners[0] || null,
    })
  } catch (err) {
    console.error('[getMessages error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * POST /api/messages  — send a message (REST fallback, primary is via Socket.io)
 * Body: { receiver_id, content, product_id? }
 */
async function sendMessage(req, res) {
  const { receiver_id, content, product_id } = req.body
  if (!receiver_id || !content?.trim()) {
    return res.status(400).json({ success: false, message: 'Receiver and message content are required.' })
  }
  if (receiver_id === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot message yourself.' })
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, product_id, content) VALUES (?, ?, ?, ?)',
      [req.user.id, receiver_id, product_id || null, content.trim()]
    )

    const [msg] = await pool.query(
      `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
       FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?`,
      [result.insertId]
    )

    return res.status(201).json({ success: true, message: msg[0] })
  } catch (err) {
    console.error('[sendMessage error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * PATCH /api/messages/:userId/read  — mark all messages from userId as read
 */
async function markConversationRead(req, res) {
  try {
    await pool.query(
      'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
      [req.params.userId, req.user.id]
    )
    return res.json({ success: true })
  } catch (err) {
    console.error('[markConversationRead error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * GET /api/messages/unread-count
 */
async function getUnreadMessageCount(req, res) {
  try {
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0',
      [req.user.id]
    )
    return res.json({ success: true, count })
  } catch (err) {
    console.error('[getUnreadMessageCount error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { getConversations, getMessages, sendMessage, markConversationRead, getUnreadMessageCount }
