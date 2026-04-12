import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getMe, logout as apiLogout } from '../services/api'

/**
 * AuthContext — global auth state accessible throughout the app.
 * Provides: user, loading, login (setter), logout
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true) // true on first mount while verifying token

  // On mount: if a token exists, fetch the current user from /api/auth/me
  useEffect(() => {
    const token = localStorage.getItem('thikana_token')
    if (!token) {
      setLoading(false)
      return
    }

    getMe()
      .then((data) => setUser(data.user))
      .catch(() => {
        // Token invalid / expired — clear it
        localStorage.removeItem('thikana_token')
      })
      .finally(() => setLoading(false))
  }, [])

  /** Call this after a successful login/signup API response */
  const login = useCallback((userData) => {
    setUser(userData)
  }, [])

  /** Clear user & token */
  const logout = useCallback(() => {
    apiLogout()   // removes token from localStorage
    setUser(null)
  }, [])

  /** Re-fetch user from server (e.g. after profile edit) */
  const refreshUser = useCallback(async () => {
    try {
      const data = await getMe()
      setUser(data.user)
    } catch {
      // token gone — leave as-is
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Convenience hook */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
