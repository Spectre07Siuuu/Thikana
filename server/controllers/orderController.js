const pool = require('../config/db')
const { createNotification } = require('./notificationController')

/**
 * POST /api/orders  — place order from cart
 * Body: { shipping_address, phone, note? }
 */
async function placeOrder(req, res) {
  const { shipping_address, phone, note } = req.body
  if (!shipping_address || !phone) {
    return res.status(400).json({ success: false, message: 'Shipping address and phone are required.' })
  }

  let conn
  try {
    conn = await pool.getConnection()
    await conn.beginTransaction()

    // 1. Get cart items
    const [cartItems] = await conn.query(`
      SELECT ci.*, p.price, p.title, p.status, p.seller_id, p.category
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `, [req.user.id])

    if (cartItems.length === 0) {
      conn.release()
      return res.status(400).json({ success: false, message: 'Your cart is empty.' })
    }

    // 2. Validate all items are still available
    const unavailable = cartItems.filter(i => i.status !== 'approved')
    if (unavailable.length > 0) {
      conn.release()
      return res.status(400).json({
        success: false,
        message: `Some items are no longer available: ${unavailable.map(i => i.title).join(', ')}`,
      })
    }

    // 3. Calculate total + Static ৳50 Delivery Fee
    const itemTotal = cartItems.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0)
    const totalAmount = itemTotal + 50
    const earnedPoints = Math.floor(itemTotal / 100) * 10 // 10 Points per ৳100 spent

    // 4. Create order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (buyer_id, total_amount, shipping_address, phone, note) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, totalAmount, shipping_address.trim(), phone.trim(), note?.trim() || null]
    )
    const orderId = orderResult.insertId

    // 5. Create order items + mark products as sold
    for (const item of cartItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, seller_id, price, quantity) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.seller_id, item.price, item.quantity]
      )
      await conn.query(
        'UPDATE products SET status = "sold" WHERE id = ?',
        [item.product_id]
      )
    }

    // 6. Clear cart & Award points
    await conn.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id])
    if (earnedPoints > 0) {
      await conn.query('UPDATE users SET points = points + ? WHERE id = ?', [earnedPoints, req.user.id])
    }

    await conn.commit()
    conn.release()

    // 7. Get buyer name for notifications
    const [buyers] = await pool.query('SELECT full_name FROM users WHERE id = ?', [req.user.id])
    const buyerName = buyers[0]?.full_name || 'A buyer'

    // 8. Notify sellers (fire and forget)
    const sellerIds = [...new Set(cartItems.map(i => i.seller_id))]
    for (const sellerId of sellerIds) {
      const sellerItems = cartItems.filter(i => i.seller_id === sellerId)
      const titles = sellerItems.map(i => i.title).join(', ')
      createNotification(
        sellerId, 'order',
        'New Order Received! 🛍️',
        `${buyerName} purchased: ${titles}`,
        `/profile`
      )
    }

    // 9. Notify buyer
    createNotification(
      req.user.id, 'order',
      'Order Confirmed! ✅',
      `Your order #${orderId} for ৳${totalAmount.toLocaleString()} has been placed successfully.`,
      `/profile`
    )
    if (earnedPoints > 0) {
      createNotification(
        req.user.id, 'system',
        'Reward Points Earned! 🎁',
        `You earned ${earnedPoints} points from your recent purchase.`,
        `/profile`
      )
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      orderId,
      total: totalAmount,
      earnedPoints,
    })
  } catch (err) {
    if (conn) { await conn.rollback(); conn.release() }
    console.error('[placeOrder error]', err)
    return res.status(500).json({ success: false, message: 'Failed to place order.' })
  }
}

/**
 * GET /api/orders — buyer's order history
 */
async function getMyOrders(req, res) {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC',
      [req.user.id]
    )

    if (orders.length === 0) return res.json({ success: true, orders: [] })

    // Single JOIN query for all items — no N+1
    const orderIds = orders.map(o => o.id)
    const [allItems] = await pool.query(`
      SELECT oi.*, p.title, p.category,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as main_image,
             u.full_name as seller_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN users u ON oi.seller_id = u.id
      WHERE oi.order_id IN (?)
    `, [orderIds])

    // Group items by order_id
    const itemMap = {}
    for (const item of allItems) {
      if (!itemMap[item.order_id]) itemMap[item.order_id] = []
      itemMap[item.order_id].push(item)
    }
    for (const order of orders) {
      order.items = itemMap[order.id] || []
    }

    return res.json({ success: true, orders })
  } catch (err) {
    console.error('[getMyOrders error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * GET /api/orders/seller — seller sees orders containing their products
 */
async function getSellerOrders(req, res) {
  try {
    const [items] = await pool.query(`
      SELECT oi.*, o.status as order_status, o.shipping_address, o.phone as buyer_phone, o.created_at as order_date,
             p.title, p.category,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as main_image,
             u.full_name as buyer_name, u.email as buyer_email
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      JOIN users u ON o.buyer_id = u.id
      WHERE oi.seller_id = ?
      ORDER BY o.created_at DESC
    `, [req.user.id])

    return res.json({ success: true, orders: items })
  } catch (err) {
    console.error('[getSellerOrders error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

/**
 * PATCH /api/orders/:id/status — update order status
 * Body: { status }
 */
async function updateOrderStatus(req, res) {
  const { status } = req.body
  const validStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' })
  }

  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id])
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found.' })

    const order = orders[0]

    // Verify the caller is either the buyer (allowed to cancel only) or a seller
    // who has items in this order (allowed to confirm/ship/deliver/cancel).
    const isBuyer = order.buyer_id === req.user.id
    const [sellerItems] = await pool.query(
      'SELECT id FROM order_items WHERE order_id = ? AND seller_id = ? LIMIT 1',
      [req.params.id, req.user.id]
    )
    const isSeller = sellerItems.length > 0

    if (!req.user.is_admin && !isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'Forbidden. You are not associated with this order.' })
    }

    if (req.user.is_admin) {
      await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id])
      return res.json({ success: true, message: `Order status updated to ${status}.` })
    }

    // Sellers with items in this order may update to any valid status.
    // Non-seller callers (pure buyers) are restricted to cancellation only.
    if (!isSeller && status !== 'cancelled') {
      return res.status(403).json({ success: false, message: 'Buyers can only cancel orders.' })
    }

    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id])

    // Notify buyer about status change
    const statusMessages = {
      shipped: 'Your order has been shipped! 📦',
      delivered: 'Your order has been delivered! 🎉',
      cancelled: 'Your order has been cancelled.',
    }

    if (statusMessages[status]) {
      createNotification(
        orders[0].buyer_id, 'order',
        statusMessages[status],
        `Order #${req.params.id} status updated to ${status}.`,
        `/profile`
      )
    }

    return res.json({ success: true, message: `Order status updated to ${status}.` })
  } catch (err) {
    console.error('[updateOrderStatus error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { placeOrder, getMyOrders, getSellerOrders, updateOrderStatus }
