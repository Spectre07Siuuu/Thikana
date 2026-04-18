import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, ChevronDown, CheckCircle2 } from 'lucide-react'
import { signup as signupApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

/* ── Helpers ────────── */
function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) }
function getStrength(p) {
  if (!p) return { level: 0, label: '', color: '' }
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return [
    { level: 1, label: 'Weak',   color: 'bg-red-400' },
    { level: 2, label: 'Fair',   color: 'bg-yellow-400' },
    { level: 3, label: 'Good',   color: 'bg-blue-400' },
    { level: 4, label: 'Strong', color: 'bg-emerald-400' },
  ][Math.min(s, 4) - 1] || { level: 0, label: '', color: '' }
}
function validate(f) {
  const e = {}
  if (!f.fullName.trim() || f.fullName.length < 3) e.fullName = 'At least 3 characters'
  if (!f.email) e.email = 'Email is required'
  else if (!validateEmail(f.email)) e.email = 'Enter a valid email'
  if (!f.password || f.password.length < 6) e.password = 'At least 6 characters'
  if (f.password !== f.confirmPassword) e.confirmPassword = 'Passwords do not match'
  if (!f.role) e.role = 'Please select a role'
  if (!f.agreedToTerms) e.agreedToTerms = 'You must agree to the terms'
  return e
}
const ROLES = [
  { value: 'buyer',  label: '🏠 Buyer — Looking to rent or buy' },
  { value: 'seller', label: '🏷️ Seller — Selling home goods' },
  { value: 'owner',  label: '🔑 Owner — Listing my property' },
]

/* ── Page ─────────────────────────────────────────────── */
export default function Signup() {
  const navigate = useNavigate()
  const auth     = useAuth()

  const [fields, setFields] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', role: '', agreedToTerms: false,
  })
  const [errors,       setErrors]       = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [serverError,  setServerError]  = useState('')
  const [success,      setSuccess]      = useState(false)

  const strength = getStrength(fields.password)

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setFields(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
    if (serverError)  setServerError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setServerError('')
    const errs = validate(fields)
    if (Object.keys(errs).length) {
      setErrors(errs)
      // Scroll to top of form so user sees errors
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setLoading(true)
    try {
      const data = await signupApi({ fullName: fields.fullName, email: fields.email, password: fields.password, role: fields.role })
      if (data.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(data.email)}`, { replace: true })
        return
      }
      // Fallback: already verified (shouldn't happen with new backend)
      if (data.token && data.user) {
        auth.login(data.user)
        setSuccess(true)
        setTimeout(() => navigate('/'), 1800)
      }
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center animate-slide-up">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800
            rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={38} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account Created!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Welcome to Thikana. Redirecting you home…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <div className="max-w-md mx-auto px-4 py-8">

        {/* Logo + heading */}
        <div className="text-center mb-5">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <Logo size={34} />
            <span className="text-xl font-extrabold text-gray-900 dark:text-white">Thikana</span>
          </Link>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Create account</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Start your journey — completely free.</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800
          rounded-2xl shadow-sm p-6">

          {/* Server error — at TOP of card so immediately visible */}
          {serverError && (
            <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border
              border-red-200 dark:border-red-800 rounded-xl text-red-600 text-sm text-center">
              {serverError}
            </div>
          )}



          <form id="signup-form" onSubmit={handleSubmit} noValidate className="space-y-3.5">

            {/* Full Name */}
            <Field label="Full Name" error={errors.fullName}>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input id="signup-fullname" name="fullName" type="text" autoComplete="name"
                  value={fields.fullName} onChange={handleChange} placeholder="John Denial"
                  className={`input-field pl-10 ${errors.fullName ? 'border-red-400' : ''}`} />
              </div>
            </Field>

            {/* Email */}
            <Field label="Email" error={errors.email}>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input id="signup-email" name="email" type="email" autoComplete="email"
                  value={fields.email} onChange={handleChange} placeholder="you@example.com"
                  className={`input-field pl-10 ${errors.email ? 'border-red-400' : ''}`} />
              </div>
            </Field>

            {/* Role */}
            <Field label="I am a…" error={errors.role}>
              <div className="relative">
                <select id="signup-role" name="role" value={fields.role} onChange={handleChange}
                  className={`input-field appearance-none pr-10 ${errors.role ? 'border-red-400' : ''}`}>
                  <option value="">Select your role</option>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </Field>

            {/* Password */}
            <Field label="Password" error={errors.password}>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input id="signup-password" name="password"
                  type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                  value={fields.password} onChange={handleChange} placeholder="Min. 6 characters"
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-400' : ''}`} />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400
                    hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {fields.password && (
                <div className="flex gap-1 mt-1.5">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300
                      ${i <= strength.level ? strength.color : 'bg-gray-200 dark:bg-gray-700'}`} />
                  ))}
                </div>
              )}
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm Password" error={errors.confirmPassword}>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input id="signup-confirm" name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'} autoComplete="new-password"
                  value={fields.confirmPassword} onChange={handleChange}
                  placeholder="Repeat your password"
                  className={`input-field pl-10 pr-10 ${errors.confirmPassword ? 'border-red-400' : ''}`} />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400
                    hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            {/* Terms */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input id="signup-terms" name="agreedToTerms" type="checkbox"
                    checked={fields.agreedToTerms} onChange={handleChange} className="sr-only peer" />
                  <div className="w-4.5 h-4.5 w-5 h-5 rounded border border-gray-300 dark:border-gray-600
                    peer-checked:bg-orange-500 peer-checked:border-orange-500
                    transition-all flex items-center justify-center">
                    {fields.agreedToTerms && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  I agree to Thikana's{' '}
                  <Link to="/terms" className="text-orange-500 hover:underline">Terms</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-orange-500 hover:underline">Privacy Policy</Link>
                </span>
              </label>
              {errors.agreedToTerms && (
                <p role="alert" className="text-red-500 text-xs mt-1 ml-8">⚠ {errors.agreedToTerms}</p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" id="signup-submit-btn" disabled={loading}
              className="w-full btn-primary justify-center py-2.5 mt-1 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading
                ? <span className="flex items-center gap-2"><Spinner /> Creating Account…</span>
                : <><span>Create Account</span><ArrowRight size={15} /></>
              }
            </button>
          </form>

          {/* NID notice — compact */}
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border
            border-emerald-100 dark:border-emerald-900 rounded-xl flex items-start gap-2">
            <ShieldCheck size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-700 dark:text-emerald-400 text-xs leading-relaxed">
              <strong>NID Verification</strong> — verify your National ID after sign-up to unlock a trusted badge.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-500 hover:text-orange-600 font-semibold">Sign in</Link>
        </p>
        <p className="text-center text-gray-400 text-xs mt-3 flex items-center justify-center gap-1.5">
          <ShieldCheck size={11} className="text-emerald-500" />
          Protected with end-to-end encryption
        </p>
      </div>
    </div>
  )
}

/* ── Shared field wrapper ─── */
function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      {children}
      {error && <p role="alert" className="text-red-500 text-xs mt-1">⚠ {error}</p>}
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

