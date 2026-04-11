import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react'
import { login as loginApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) }
function validate({ email, password }) {
  const e = {}
  if (!email)            e.email    = 'Email is required'
  else if (!validateEmail(email)) e.email = 'Enter a valid email'
  if (!password)         e.password = 'Password is required'
  else if (password.length < 6) e.password = 'At least 6 characters'
  return e
}

export default function Login() {
  const navigate = useNavigate()
  const auth     = useAuth()

  const [fields,       setFields]       = useState({ email: '', password: '' })
  const [errors,       setErrors]       = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [serverError,  setServerError]  = useState('')

  const handleChange = e => {
    const { name, value } = e.target
    setFields(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
    if (serverError)  setServerError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setServerError('')
    const errs = validate(fields)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const data = await loginApi({ email: fields.email, password: fields.password })
      auth.login(data.user)
      navigate('/')
    } catch (err) {
      setServerError(err.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center
      bg-gray-50 dark:bg-gray-950 px-4 py-8 transition-colors duration-200">
      <div className="w-full max-w-md animate-slide-up">

        {/* Logo + heading */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <Logo size={36} />
            <span className="text-xl font-extrabold text-gray-900 dark:text-white">Thikana</span>
          </Link>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Sign in to your Thikana account
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800
          rounded-2xl shadow-sm p-7">



          {serverError && (
            <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border
              border-red-200 dark:border-red-800 rounded-xl text-red-600 text-sm text-center">
              {serverError}
            </div>
          )}

          <form id="login-form" onSubmit={handleSubmit} noValidate className="space-y-3.5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium
                text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input id="login-email" name="email" type="email" autoComplete="email"
                  value={fields.email} onChange={handleChange}
                  placeholder="you@example.com"
                  className={`input-field pl-10 ${errors.email ? 'border-red-400 focus:border-red-400' : ''}`} />
              </div>
              {errors.email && <p role="alert" className="text-red-500 text-xs mt-1">⚠ {errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-orange-500 hover:text-orange-600 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input id="login-password" name="password"
                  type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  value={fields.password} onChange={handleChange}
                  placeholder="Enter your password"
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-400 focus:border-red-400' : ''}`} />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  aria-label="Toggle password"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400
                    hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p role="alert" className="text-red-500 text-xs mt-1">⚠ {errors.password}</p>}
            </div>

            {/* Submit */}
            <button type="submit" id="login-submit-btn" disabled={loading}
              className="w-full btn-primary justify-center py-2.5 mt-1 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading
                ? <span className="flex items-center gap-2"><Spinner /> Signing in…</span>
                : <><span>Sign in</span><ArrowRight size={15} /></>
              }
            </button>
          </form>
        </div>

        {/* Footer links */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          Don't have an account?{' '}
          <Link to="/signup" className="text-orange-500 hover:text-orange-600 font-semibold">
            Sign up free
          </Link>
        </p>
        <p className="text-center text-gray-400 text-xs mt-3 flex items-center justify-center gap-1.5">
          <ShieldCheck size={11} className="text-emerald-500" />
          Protected with end-to-end encryption
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


