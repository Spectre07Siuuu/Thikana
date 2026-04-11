import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Menu, X, ChevronDown, User, LogOut, Settings,
  ShoppingCart, Bell, ShieldCheck, Sun, Moon,
} from 'lucide-react'
import { useAuth }  from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Logo from './Logo'

/* ─── Nav links: use plain <a> for hash anchors so browser scrolls correctly ── */
const NAV_LINKS = [
  { label: 'Home',        href: '/',            hash: false },
  { label: 'Properties',  href: '#properties',  hash: true  },
  { label: 'Marketplace', href: '#marketplace', hash: true  },
  { label: 'About',       href: '#about',       hash: true  },
]

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('')
}

const ROLE_COLORS = {
  buyer:  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  seller: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  owner:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
}

export default function Navbar() {
  const { user, logout }      = useAuth()
  const { dark, toggleTheme } = useTheme()
  const navigate              = useNavigate()

  const [scrolled,    setScrolled]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => { logout(); setProfileOpen(false); navigate('/') }

  /* ─── helper: is the current pathname '/' for Home active state ─── */
  const isHome = typeof window !== 'undefined' && window.location.pathname === '/'

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
      bg-white dark:bg-gray-950 ${scrolled ? 'shadow-md dark:shadow-gray-900/60' : 'shadow-sm dark:border-b dark:border-gray-800'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ─── */}
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="Thikana home">
            <Logo size={34} />
            <span className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">
              Thikana
            </span>
          </Link>

          {/* ── Desktop Nav ─── */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map(({ label, href, hash }) =>
              hash ? (
                /* hash links: plain anchor so browser scrolls on same page */
                <a key={label} href={href}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                    text-gray-600 dark:text-gray-400 hover:text-orange-500 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  {label}
                </a>
              ) : (
                <Link key={label} to={href}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                    text-orange-500 bg-orange-50 dark:bg-orange-950/40">
                  {label}
                </Link>
              )
            )}
          </nav>

          {/* ── Right Actions ─── */}
          <div className="flex items-center gap-1.5">

            {/* Theme Toggle */}
            <button
              id="theme-toggle"
              onClick={toggleTheme}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400
                hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-800
                transition-all duration-200"
            >
              {dark
                ? <Sun size={18} className="text-yellow-400" />
                : <Moon size={18} />
              }
            </button>

            {/* Cart */}
            <button aria-label="Cart"
              className="hidden sm:flex p-2 rounded-lg text-gray-500 dark:text-gray-400
                hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
              <ShoppingCart size={18} />
            </button>

            {/* Notifications */}
            <button aria-label="Notifications"
              className="hidden sm:flex p-2 rounded-lg text-gray-500 dark:text-gray-400
                hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full" />
            </button>

            {/* ── Auth ─── */}
            {user ? (
              <div ref={profileRef} className="relative">
                <button
                  id="profile-menu-btn"
                  onClick={() => setProfileOpen(v => !v)}
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full
                    border border-gray-200 dark:border-gray-700
                    hover:border-orange-300 dark:hover:border-orange-700
                    hover:bg-orange-50 dark:hover:bg-orange-950/30
                    transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600
                    flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {getInitials(user.full_name)}
                  </div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200
                    max-w-[100px] truncate hidden sm:block">
                    {user.full_name?.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200
                    ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 dropdown-panel py-2 animate-fade-in" role="menu">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600
                          flex items-center justify-center text-white font-bold text-sm">
                          {getInitials(user.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                            {user.full_name}
                          </p>
                          <p className="text-gray-400 text-xs truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize
                          ${ROLE_COLORS[user.role] || ROLE_COLORS.buyer}`}>
                          {user.role}
                        </span>
                        {user.nid_verified
                          ? <span className="badge-nid text-[10px]"><ShieldCheck size={10} /> NID Verified</span>
                          : <button className="text-[10px] text-orange-500 hover:underline">Verify NID →</button>
                        }
                      </div>
                    </div>

                    <div className="py-1">
                      <DropItem icon={<User size={15}/>}     label="My Profile" onClick={() => { navigate('/profile'); setProfileOpen(false) }} />
                      <DropItem icon={<Settings size={15}/>} label="Settings"   onClick={() => { navigate('/settings'); setProfileOpen(false) }} />
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-800 pt-1">
                      <button id="logout-btn" onClick={handleLogout} role="menuitem"
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500
                          hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium">
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300
                    hover:text-orange-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button id="mobile-menu-toggle" onClick={() => setMobileOpen(v => !v)}
              aria-expanded={mobileOpen} aria-label="Toggle menu"
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400
                hover:text-orange-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Drawer ─── */}
      <div className={`md:hidden overflow-hidden bg-white dark:bg-gray-950
        border-t border-gray-100 dark:border-gray-800 transition-all duration-300
        ${mobileOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ label, href, hash }) =>
            hash ? (
              <a key={label} href={href} onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-300
                  hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30
                  font-medium text-sm transition-colors">
                {label}
              </a>
            ) : (
              <Link key={label} to={href} onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-orange-500 bg-orange-50
                  dark:bg-orange-950/30 font-medium text-sm">
                {label}
              </Link>
            )
          )}

          <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-2">
            {user ? (
              <div>
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600
                    flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(user.full_name)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{user.full_name}</p>
                    <p className="text-gray-400 text-xs capitalize">{user.role}</p>
                  </div>
                </div>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500
                    font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)}
                  className="block text-center px-4 py-2.5 rounded-xl border
                    border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300
                    font-medium text-sm hover:border-orange-300">
                  Sign In
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)}
                  className="btn-primary justify-center">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function DropItem({ icon, label, onClick }) {
  return (
    <button onClick={onClick} role="menuitem"
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
        text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60
        hover:text-orange-500 transition-colors">
      <span className="text-gray-400">{icon}</span>
      {label}
    </button>
  )
}
