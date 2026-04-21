/**
 * api.js — centralized fetch wrapper for the Thikana backend.
 */

const BASE_URL = '/api'

async function request(endpoint, { method = 'GET', body, token } = {}) {
 const storedToken = token || localStorage.getItem('thikana_token')
 const headers = { 'Content-Type': 'application/json' }
 if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`

 const res = await fetch(`${BASE_URL}${endpoint}`, {
  method,
  headers,
  body: body ? JSON.stringify(body) : undefined,
 })

 const data = await res.json()
 if (!res.ok) {
  const error = new Error(data.message || 'Something went wrong.')
  error.status = res.status
  error.data  = data
  throw error
 }
 return data
}

/* ─── Auth ───────────────────────────────────────────────── */

export async function signup(payload) {
 return request('/auth/signup', { method: 'POST', body: payload })
}

export async function verifyEmail(payload) {
 const data = await request('/auth/verify-email', { method: 'POST', body: payload })
 if (data.token) localStorage.setItem('thikana_token', data.token)
 return data
}

export async function resendOtp(email) {
 return request('/auth/resend-otp', { method: 'POST', body: { email } })
}

export async function login(payload) {
 const data = await request('/auth/login', { method: 'POST', body: payload })
 if (data.token) localStorage.setItem('thikana_token', data.token)
 return data
}

export async function getMe() {
 return request('/auth/me')
}

export function logout() {
 localStorage.removeItem('thikana_token')
}

export function isLoggedIn() {
 return Boolean(localStorage.getItem('thikana_token'))
}

export async function forgotPassword(email) {
 return request('/auth/forgot-password', { method: 'POST', body: { email } })
}

export async function resetPassword(payload) {
 return request('/auth/reset-password', { method: 'POST', body: payload })
}

export async function changePassword(payload) {
 return request('/auth/change-password', { method: 'POST', body: payload })
}

/* ─── Profile ────────────────────────────────────────────── */

export async function getProfile() {
 return request('/profile/me')
}

export async function updateProfile(payload) {
 return request('/profile/me', { method: 'PUT', body: payload })
}

export async function uploadAvatar(base64Str) {
 return request('/profile/me/avatar', { method: 'PUT', body: { avatar_base64: base64Str } })
}

/* ─── NID Verification ───────────────────────────────────── */

export async function getNidStatus() {
 return request('/nid/status')
}

export async function submitNid(payload) {
 return request('/nid/submit', { method: 'POST', body: payload })
}

/* ─── Products ────────────────────────────────────────────── */

export async function getProducts(params = {}) {
 const query = new URLSearchParams(params).toString()
 return request(`/products${query ? '?' + query : ''}`)
}

export async function uploadProduct(payload) {
 return request('/products', { method: 'POST', body: payload })
}

export async function getProductById(id) {
 return request(`/products/${id}`)
}

export async function editProduct(id, payload) {
 return request(`/products/${id}`, { method: 'PATCH', body: payload })
}

/* ─── Favourites ─────────────────────────────────────────── */

export async function getFavourites() {
 return request('/favourites')
}

export async function toggleFavourite(productId) {
 return request(`/favourites/${productId}`, { method: 'POST' })
}

export async function getFavouriteStatus(productId) {
 return request(`/favourites/${productId}/status`)
}

/* ─── Inquiries ──────────────────────────────────────────── */

export async function sendInquiry(payload) {
 return request('/inquiries', { method: 'POST', body: payload })
}

export async function getSellerInquiries() {
 return request('/inquiries/seller')
}

export async function getUnreadInquiryCount() {
 return request('/inquiries/unread-count')
}

export async function markInquiryRead(id) {
 return request(`/inquiries/${id}/read`, { method: 'PATCH' })
}

/* ─── Reviews ────────────────────────────────────────────── */

export async function addReview(payload) {
 return request('/reviews', { method: 'POST', body: payload })
}

export async function getProductReviews(productId) {
 return request(`/reviews/product/${productId}`)
}

/* ─── Cart ───────────────────────────────────────────────── */

export async function getCart() {
 return request('/cart')
}

export async function getCartCount() {
 return request('/cart/count')
}

export async function addToCart(productId) {
 return request('/cart', { method: 'POST', body: { product_id: productId } })
}

export async function removeFromCart(cartItemId) {
 return request(`/cart/${cartItemId}`, { method: 'DELETE' })
}

export async function clearCart() {
 return request('/cart', { method: 'DELETE' })
}

/* ─── Orders ─────────────────────────────────────────────── */

export async function placeOrder(payload) {
 return request('/orders', { method: 'POST', body: payload })
}

export async function getMyOrders() {
 return request('/orders')
}

export async function getSellerOrders() {
 return request('/orders/seller')
}

export async function getOrderById(orderId) {
 return request(`/orders/${orderId}`)
}

export async function updateOrderStatus(orderId, statusOrPayload) {
 const payload = typeof statusOrPayload === 'string'
  ? { status: statusOrPayload }
  : (statusOrPayload || {})
 return request(`/orders/${orderId}/status`, { method: 'PATCH', body: payload })
}

/* ─── Messages ───────────────────────────────────────────── */

export async function getConversations() {
 return request('/messages/conversations')
}

export async function getMessageHistory(userId, params = {}) {
 const query = new URLSearchParams(params).toString()
 return request(`/messages/${userId}${query ? '?' + query : ''}`)
}

export async function sendMsg(payload) {
 return request('/messages', { method: 'POST', body: payload })
}

export async function markConversationRead(userId) {
 return request(`/messages/${userId}/read`, { method: 'PATCH' })
}

export async function getUnreadMessageCount() {
 return request('/messages/unread-count')
}

/* ─── Notifications ──────────────────────────────────────── */

export async function getNotifications(params = {}) {
 const query = new URLSearchParams(params).toString()
 return request(`/notifications${query ? '?' + query : ''}`)
}

export async function getNotificationUnreadCount() {
 return request('/notifications/unread-count')
}

export async function markNotificationRead(id) {
 return request(`/notifications/${id}/read`, { method: 'PATCH' })
}

export async function markAllNotificationsRead() {
 return request('/notifications/read-all', { method: 'PATCH' })
}

/* ─── Admin ──────────────────────────────────────────────── */

export async function getAdminStats() {
 return request('/admin/stats')
}

export async function getAdminProducts(params = {}) {
 const q = new URLSearchParams(params).toString()
 return request(`/admin/products${q ? '?' + q : ''}`)
}

export async function adminReviewProduct(payload) {
 return request('/admin/products/review', { method: 'POST', body: payload })
}

export async function getAdminNid(params = {}) {
 const q = new URLSearchParams(params).toString()
 return request(`/admin/nid${q ? '?' + q : ''}`)
}

export async function adminReviewNid(payload) {
 return request('/admin/nid/review', { method: 'POST', body: payload })
}
