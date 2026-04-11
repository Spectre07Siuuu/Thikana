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
