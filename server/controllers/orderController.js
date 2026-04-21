const pool = require('../config/db')
const { createNotification } = require('./notificationController')

const BUYER_CANCELLATION_REASONS = {
  changed_mind: 'Changed mind',
  ordered_by_mistake: 'Ordered by mistake',
  found_better_option: 'Found a better option',
  delivery_taking_too_long: 'Delivery is taking too long',
  payment_or_budget_issue: 'Payment or budget issue',
  others: 'Others',
}

const SELLER_CANCELLATION_REASONS = {
  item_out_of_stock: 'Item is out of stock',
  listing_issue: 'Listing information issue',
  unable_to_fulfill: 'Unable to fulfill the order now',
  buyer_unreachable: 'Buyer is unreachable',
  logistics_issue: 'Logistics or delivery issue',
  others: 'Others',
}

/**
 * POST /api/orders  — place order from cart
 * Body: { shipping_address, phone, note? }
 */
async function placeOrder(req, res) {
  const { shipping_address, phone, note, delivery_type = 'inside' } = req.body
  if (!shipping_address || !phone) {
    return res.status(400).json({ success: false, message: 'Shipping address and phone are required.' })
  }

  const deliveryFee = delivery_type === 'outside' ? 50 : 20;

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

    // 3. Calculate total + Dynamic Delivery Fee
    const itemTotal = cartItems.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0)
    const totalAmount = itemTotal + deliveryFee
    const earnedPoints = Math.floor(itemTotal / 100) * 10 // 10 Points per ৳100 spent

    // 4. Create order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (buyer_id, total_amount, shipping_address, phone, note, delivery_fee) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, totalAmount, shipping_address.trim(), phone.trim(), note?.trim() || null, deliveryFee]
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
        `/orders/${orderId}`
      )
    }

    // 9. Notify buyer
    createNotification(
      req.user.id, 'order',
      'Order Confirmed! ✅',
      `Your order #${orderId} for ৳${totalAmount.toLocaleString()} has been placed successfully.`,
      `/orders/${orderId}`
    )
    if (earnedPoints > 0) {
      createNotification(
        req.user.id, 'system',
        'Reward Points Earned! 🎁',
        `You earned ${earnedPoints} points from your recent purchase.`,
        `/orders/${orderId}`
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
             u.full_name as seller_name, u.phone as seller_phone,
             r.id as review_id
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN users u ON oi.seller_id = u.id
      LEFT JOIN reviews r ON r.order_item_id = oi.id AND r.buyer_id = ?
      WHERE oi.order_id IN (?)
    `, [req.user.id, orderIds])

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
 * GET /api/orders/:id — buyer/seller/admin sees full order details
 */
async function getOrderById(req, res) {
  try {
    const orderId = parseInt(req.params.id)
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid order id.' })
    }

    const [orders] = await pool.query(`
      SELECT o.*,
             b.full_name as buyer_name, b.email as buyer_email, b.phone as buyer_phone, b.address as buyer_address, b.avatar_url as buyer_avatar
      FROM orders o
      JOIN users b ON b.id = o.buyer_id
      WHERE o.id = ?
      LIMIT 1
    `, [orderId])

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' })
    }

    const order = orders[0]
    const isBuyer = order.buyer_id === req.user.id
    const [sellerLinks] = await pool.query(
      'SELECT seller_id FROM order_items WHERE order_id = ? AND seller_id = ? LIMIT 1',
      [orderId, req.user.id]
    )
    const isSeller = sellerLinks.length > 0

    if (!req.user.is_admin && !isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'Forbidden. You are not associated with this order.' })
    }

    const [items] = await pool.query(`
      SELECT oi.*,
             p.title, p.status as product_status,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as main_image,
             s.full_name as seller_name, s.email as seller_email, s.phone as seller_phone, s.avatar_url as seller_avatar
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN users s ON s.id = oi.seller_id
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC
    `, [orderId])

    return res.json({
      success: true,
      order: {
        ...order,
        items,
        permissions: {
          is_buyer: isBuyer,
          is_seller: isSeller,
          is_admin: !!req.user.is_admin,
          can_cancel: ['pending', 'confirmed', 'shipped'].includes(order.status),
        },
      },
    })
  } catch (err) {
    console.error('[getOrderById error]', err)
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
              p.title, p.category, p.status as product_status,
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
  const {
    status,
    cancellation_reason = '',
    cancellation_note = '',
    acknowledged_consequences = false,
  } = req.body || {}
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

    if (req.user.is_admin) {
      await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id])
      return res.json({ success: true, message: `Order status updated to ${status}.` })
    }

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'Forbidden. You are not associated with this order.' })
    }

    // Sellers with items in this order may update to any valid status.
    // Non-seller callers (pure buyers) are restricted to cancellation only.
    if (!isSeller && status !== 'cancelled') {
      return res.status(403).json({ success: false, message: 'Buyers can only cancel orders.' })
    }

    if (order.status === status) {
      return res.json({ success: true, message: `Order is already ${status}.` })
    }

    if (status === 'cancelled') {
      if (!['pending', 'confirmed', 'shipped'].includes(order.status)) {
        return res.status(400).json({ success: false, message: 'This order can no longer be cancelled.' })
      }
      if (!cancellation_reason || typeof cancellation_reason !== 'string') {
        return res.status(400).json({ success: false, message: 'Cancellation reason is required.' })
      }
      if (!acknowledged_consequences) {
        return res.status(400).json({ success: false, message: 'You must agree to cancellation consequences.' })
      }
      if (cancellation_reason === 'others' && !String(cancellation_note || '').trim()) {
        return res.status(400).json({ success: false, message: 'Please provide cancellation details for Others.' })
      }
    }

    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id])

    let reopenedProducts = 0
    let pointsDeducted = 0
    let reviewsRemoved = 0

    if (status === 'cancelled' && order.status !== 'cancelled') {
      const [orderItems] = await pool.query(
        'SELECT product_id FROM order_items WHERE order_id = ?',
        [req.params.id]
      )
      for (const item of orderItems) {
        const [result] = await pool.query(
          "UPDATE products SET status = 'approved' WHERE id = ? AND status = 'sold'",
          [item.product_id]
        )
        reopenedProducts += result.affectedRows || 0
      }

      const [[{ item_total }]] = await pool.query(
        'SELECT COALESCE(SUM(price * quantity), 0) as item_total FROM order_items WHERE order_id = ?',
        [req.params.id]
      )
      const earnedPoints = Math.floor(Number(item_total || 0) / 100) * 10
      if (earnedPoints > 0) {
        await pool.query(
          'UPDATE users SET points = GREATEST(points - ?, 0) WHERE id = ?',
          [earnedPoints, order.buyer_id]
        )
        pointsDeducted = earnedPoints
      }

      const [deletedReviews] = await pool.query(
        'DELETE FROM reviews WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = ?)',
        [req.params.id]
      )
      reviewsRemoved = deletedReviews.affectedRows || 0
    }

    // Notify buyer about status change
    const statusMessages = {
      shipped: 'Your order has been shipped! 📦',
      delivered: 'Your order has been delivered! 🎉',
      cancelled: 'Your order has been cancelled.',
    }

    if (statusMessages[status] && status !== 'cancelled') {
      createNotification(
        orders[0].buyer_id, 'order',
        statusMessages[status],
        `Order #${req.params.id} status updated to ${status}.`,
        `/orders/${req.params.id}`
      )
    }

    if (status === 'cancelled') {
      const [actorRows] = await pool.query('SELECT full_name FROM users WHERE id = ? LIMIT 1', [req.user.id])
      const actorName = actorRows[0]?.full_name || (isBuyer ? 'Buyer' : 'Seller')
      const reasonMap = isBuyer ? BUYER_CANCELLATION_REASONS : SELLER_CANCELLATION_REASONS
      const reasonLabel = reasonMap[cancellation_reason] || cancellation_reason
      const reasonDetails = cancellation_reason === 'others' ? String(cancellation_note || '').trim() : ''
      const reportBody = [
        `Order #${req.params.id} was cancelled by ${actorName} (${isBuyer ? 'Buyer' : 'Seller'}).`,
        `Reason: ${reasonLabel}${reasonDetails ? ` — ${reasonDetails}` : ''}`,
        `Products restored to active: ${reopenedProducts}`,
        `Buyer points deducted: ${pointsDeducted}`,
        `Reviews removed: ${reviewsRemoved}`,
      ].join('\n')

      if (isBuyer) {
        const [sellerRows] = await pool.query(
          'SELECT DISTINCT seller_id FROM order_items WHERE order_id = ?',
          [req.params.id]
        )
        for (const row of sellerRows) {
          createNotification(
            row.seller_id,
            'order',
            'Order Cancelled by Buyer',
            reportBody,
            `/orders/${req.params.id}`
          )
        }
      } else if (isSeller) {
        createNotification(
          order.buyer_id,
          'order',
          'Order Cancelled by Seller',
          reportBody,
          `/orders/${req.params.id}`
        )
      }
    }

    return res.json({ success: true, message: `Order status updated to ${status}.` })
  } catch (err) {
    console.error('[updateOrderStatus error]', err)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { placeOrder, getMyOrders, getSellerOrders, getOrderById, updateOrderStatus }
