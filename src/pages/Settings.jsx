import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Moon, Sun, Bell, Shield, LogOut, Trash2, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { changePassword } from '../services/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Settings() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { dark, toggleTheme } = useTheme()

  const [pwForm, setPwForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPw, setShowPw]   = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  if (!user) {
    if (typeof window !== 'undefined') navigate('/login')
    return null
  }

  const handlePwChange = async (e) => {
    e.preventDefault()
    if (!pwForm.currentPassword) { setPwError('Current password is required.'); return }
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) { setPwError('New password must be at least 6 characters.'); return }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('Passwords do not match.'); return }

    setPwLoading(true)
    setPwError('')
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      setPwSuccess(true)
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (err) {
      setPwError(err.message || 'Failed to update password.')
    } finally {
      setPwLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12 transition-colors">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 animate-fade-in">

          <div className="flex items-center gap-3 mb-6">
            <Link to="/profile" className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-white dark:hover:bg-gray-900 border border-transparent hover:border-gray-200 dark:hover:border-gray-800 transition-all">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
          </div>

          <div className="space-y-4">

            {/* Appearance */}
            <Section title="Appearance">
              <SettingRow
                icon={dark ? <Moon size={17} className="text-indigo-400" /> : <Sun size={17} className="text-yellow-400" />}
                label="Dark Mode"
                description={dark ? 'Currently using dark theme' : 'Currently using light theme'}
                action={
                  <button onClick={toggleTheme}
                    className={`relative w-11 h-6 rounded-full transition-colors ${dark ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${dark ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                }
              />
            </Section>

            {/* Security */}
            <Section title="Security">
              <div className="p-5">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
                  <Lock size={15} className="text-orange-500" /> Change Password
                </h3>
                {pwError && <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-600 text-xs">{pwError}</div>}
                {pwSuccess && <div className="mb-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-600 text-xs flex items-center gap-1.5"><CheckCircle size={13} /> Password updated!</div>}
                <form onSubmit={handlePwChange} className="space-y-3">
                  <PwInput label="Current Password" id="cur-pw" showPw={showPw} value={pwForm.currentPassword} onChange={v => setPwForm(p => ({ ...p, currentPassword: v }))} placeholder="Your current password" />
                  <PwInput label="New Password" id="new-pw" showPw={showPw} value={pwForm.newPassword} onChange={v => setPwForm(p => ({ ...p, newPassword: v }))} placeholder="At least 6 characters" />
                  <PwInput label="Confirm New Password" id="confirm-pw" showPw={showPw} value={pwForm.confirmPassword} onChange={v => setPwForm(p => ({ ...p, confirmPassword: v }))} placeholder="Repeat password" />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                      <input type="checkbox" className="rounded" checked={showPw} onChange={() => setShowPw(v => !v)} />
                      {showPw ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Show</>}
                    </label>
                    <button type="submit" disabled={pwLoading} className="btn-primary text-xs py-2 px-4 disabled:opacity-70">
                      {pwLoading ? 'Saving…' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            </Section>

            {/* Notifications — placeholder */}
            <Section title="Notifications">
              <SettingRow
                icon={<Bell size={17} className="text-blue-400" />}
                label="Email Notifications"
                description="Receive email updates about your listings and inquiries"
                action={<span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Coming soon</span>}
              />
            </Section>

            {/* Account */}
            <Section title="Account">
              <SettingRow
                icon={<Shield size={17} className="text-emerald-400" />}
                label="NID Verification"
                description={user.nid_verified ? 'Your identity is verified' : 'Verify your identity for a trust badge'}
                action={
                  user.nid_verified
                    ? <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">Verified</span>
                    : <Link to="/verify-nid" className="text-xs text-orange-500 hover:text-orange-600 font-semibold">Verify now →</Link>
                }
              />
              <div className="border-t border-gray-100 dark:border-gray-800">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-5 py-4 text-sm text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors rounded-b-2xl">
                  <LogOut size={16} /> Sign out of Thikana
                </button>
              </div>
            </Section>

            {/* Links */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-400 pt-2">
              <Link to="/terms"   className="hover:text-orange-500 transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-orange-500 transition-colors">Privacy Policy</Link>
              <span>Thikana v1.0</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
      <h2 className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        {title}
      </h2>
      {children}
    </div>
  )
}

function SettingRow({ icon, label, description, action }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 gap-4">
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">{icon}</span>
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

function PwInput({ label, id, showPw, value, onChange, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <input id={id} type={showPw ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} className="input-field py-2 text-sm" />
    </div>
  )
}
