/**
 * api.js — centralized fetch wrapper for the Thikana backend.
 *
 * Base URL is set via Vite's proxy so we just use /api/* paths.
 * The proxy is configured in vite.config.js to forward to
 * http://localhost:5000 during development.
 */

const BASE_URL = '/api'

/**
 * Generic request helper.
 * Automatically attaches the JWT token if present in localStorage.
 */
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
    // Throw with the server's message so the UI can display it
    const error = new Error(data.message || 'Something went wrong.')
    error.status = res.status
    error.data   = data
    throw error
  }

  return data
}

/* ─── Auth ───────────────────────────────────────────────── */

/**
 * signup — POST /api/auth/signup
 * @param {{ fullName, email, password, role }} payload
 */
export async function signup(payload) {
  const data = await request('/auth/signup', { method: 'POST', body: payload })
  // Persist token
  if (data.token) localStorage.setItem('thikana_token', data.token)
  return data
}

/**
 * login — POST /api/auth/login
 * @param {{ email, password }} payload
 */
export async function login(payload) {
  const data = await request('/auth/login', { method: 'POST', body: payload })
  if (data.token) localStorage.setItem('thikana_token', data.token)
  return data
}

/**
 * getMe — GET /api/auth/me  (requires auth)
 */
export async function getMe() {
  return request('/auth/me')
}

/**
 * logout — remove token from storage
 */
export function logout() {
  localStorage.removeItem('thikana_token')
}

/**
 * isLoggedIn — check if a token exists in localStorage
 */
export function isLoggedIn() {
  return Boolean(localStorage.getItem('thikana_token'))
}

/* ─── Profile ────────────────────────────────────────────── */

/**
 * getProfile — GET /api/profile/me  (requires auth)
 */
export async function getProfile() {
  return request('/profile/me')
}

/**
 * updateProfile — PUT /api/profile/me  (requires auth)
 * @param {{ fullName?, phone?, address?, bio? }} payload
 */
export async function updateProfile(payload) {
  return request('/profile/me', { method: 'PUT', body: payload })
}

/**
 * uploadAvatar — PUT /api/profile/me/avatar
 * @param {string} base64Str - Base64 encoded image string
 */
export async function uploadAvatar(base64Str) {
  return request('/profile/me/avatar', { method: 'PUT', body: { avatar_base64: base64Str } })
}

/* ─── NID Verification ───────────────────────────────────── */

/**
 * getNidStatus — GET /api/nid/status
 */
export async function getNidStatus() {
  return request('/nid/status')
}

/**
 * submitNid — POST /api/nid/submit
 * @param {{ nid_number, nid_front_base64, nid_selfie_base64 }} payload
 */
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
