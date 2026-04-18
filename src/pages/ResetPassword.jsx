import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { resetPassword } from '../services/api'
import Logo from '../components/Logo'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token     = params.get('token') || ''
  const email     = params.get('email') || ''

  const [form, setForm]       = useState({ newPassword: '', confirmPassword: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)

  useEffect(() => {
    if (!token || !email) setError('Invalid or missing reset link. Please request a new one.')
  }, [token, email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.newPassword || form.newPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    setError('')
    try {
      await resetPassword({ email, token, newPassword: form.newPassword })
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err) {
      setError(err.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="w-full max-w-md text-center animate-slide-up">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={38} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Password reset!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Redirecting you to sign in…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-8 transition-colors duration-200">
      <div className="w-full max-w-md animate-slide-up">

        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Logo size={36} />
            <span className="text-xl font-extrabold text-gray-900 dark:text-white">Thikana</span>
          </Link>
          <div className="w-14 h-14 bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={26} className="text-orange-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Set new password</h1>
          {email && <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">for {email}</p>}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-7">
          {error && (
            <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={e => { setForm(f => ({ ...f, newPassword: e.target.value })); setError('') }}
                  placeholder="At least 6 characters"
                  className="input-field pr-11"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm new password</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={e => { setForm(f => ({ ...f, confirmPassword: e.target.value })); setError('') }}
                placeholder="Repeat your new password"
                className="input-field"
              />
            </div>

            <button type="submit" disabled={loading || !token}
              className="w-full btn-primary justify-center py-2.5 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? <><Spinner /> Resetting…</> : 'Reset password'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-orange-500 hover:text-orange-600 font-semibold transition-colors">
            <ArrowLeft size={13} /> Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  )
}
