const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const pool = require('./config/db')

let io = null

function normalizeRole(role) {
  return role === 'owner' ? 'seller' : role
}

function canUsersChat(sender, receiver) {
  if (!sender || !receiver) return { allowed: false, message: 'Chat participant not found.' }
  if (sender.is_admin || receiver.is_admin) return { allowed: false, message: 'Admins cannot use direct chat.' }
  if (!sender.nid_verified) return { allowed: false, message: 'Complete NID verification to chat.' }

  if (sender.role === 'buyer') {
    if (receiver.role !== 'seller') return { allowed: false, message: 'Buyers can only chat with sellers.' }
    if (!receiver.nid_verified) return { allowed: false, message: 'Seller must be NID verified for chat.' }
    return { allowed: true }
  }

  if (sender.role === 'seller') {
    if (receiver.role === 'seller') {
      if (!receiver.nid_verified) return { allowed: false, message: 'Seller must be NID verified for chat.' }
      return { allowed: true }
    }
    if (receiver.role === 'buyer') {
      if (!receiver.nid_verified) return { allowed: false, message: 'Buyer must be NID verified for chat.' }
      return { allowed: true }
    }
  }

  return { allowed: false, message: 'This chat is not allowed for your account type.' }
}

async function getUserAccount(userId) {
  const [rows] = await pool.query(
    'SELECT id, role, is_admin, nid_verified FROM users WHERE id = ? LIMIT 1',
    [userId]
  )
  if (rows.length === 0) return null
  const row = rows[0]
  return {
    id: row.id,
    role: normalizeRole(row.is_admin ? 'admin' : row.role),
    is_admin: !!row.is_admin,
    nid_verified: !!row.nid_verified,
  }
}

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  })

  // ── JWT Auth Middleware ──
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Authentication required'))

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const account = await getUserAccount(decoded.id)
      if (!account) return next(new Error('Account not found'))
      socket.user = {
        ...decoded,
        ...account,
      }
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  // ── Connection ──
  io.on('connection', (socket) => {
    const userId = socket.user.id
    socket.join(`user_${userId}`)
    console.log(`🔌 Socket connected: user ${userId}`)

    // Broadcast online status
    socket.broadcast.emit('user_online', { userId })

    // ── Send Message ──
    socket.on('send_message', async (data, callback) => {
      const { receiver_id, content, product_id, type, file_url, file_name } = data
      if (!receiver_id) return
      // For text messages, content is required; for file/voice, file_url is required
      if (type === 'text' && !content?.trim()) return
      if ((type === 'image' || type === 'file' || type === 'voice') && !file_url) return

      try {
        const sender = await getUserAccount(userId)
        const receiver = await getUserAccount(receiver_id)
        const chatCheck = canUsersChat(sender, receiver)
        if (!chatCheck.allowed) {
          if (callback) callback({ success: false, error: chatCheck.message })
          return
        }

        const msgType = type || 'text'
        const [result] = await pool.query(
          'INSERT INTO messages (sender_id, receiver_id, product_id, content, type, file_url, file_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, receiver_id, product_id || null, content?.trim() || null, msgType, file_url || null, file_name || null]
        )

        // Fetch full message with sender info
        const [msgs] = await pool.query(
          `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
           FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?`,
          [result.insertId]
        )
        const message = msgs[0]

        // Emit to receiver
        io.to(`user_${receiver_id}`).emit('new_message', message)

        // Also confirm to sender
        if (callback) callback({ success: true, message })

        // Emit unread MESSAGE count to receiver (NOT notification)
        const [[{ count }]] = await pool.query(
          'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0',
          [receiver_id]
        )
        io.to(`user_${receiver_id}`).emit('message_count', { count })

      } catch (err) {
        console.error('[socket send_message error]', err)
        if (callback) callback({ success: false, error: err.message })
      }
    })

    // ── Typing indicator ──
    socket.on('typing', ({ receiver_id }) => {
      io.to(`user_${receiver_id}`).emit('user_typing', { userId })
    })

    socket.on('stop_typing', ({ receiver_id }) => {
      io.to(`user_${receiver_id}`).emit('user_stop_typing', { userId })
    })

    // ── Mark messages as read ──
    socket.on('mark_read', async ({ sender_id }) => {
      try {
        await pool.query(
          'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
          [sender_id, userId]
        )
        // Notify sender that messages were read
        io.to(`user_${sender_id}`).emit('messages_read', { reader_id: userId })
      } catch (err) {
        console.error('[socket mark_read error]', err)
      }
    })

    // ── Disconnect ──
    socket.on('disconnect', () => {
      socket.broadcast.emit('user_offline', { userId })
      console.log(`🔌 Socket disconnected: user ${userId}`)
    })
  })

  return io
}

function getIO() {
  return io
}

module.exports = { initSocket, getIO }
