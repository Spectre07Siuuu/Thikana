import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Menu, X, ChevronDown, User, LogOut, Settings,
  ShoppingCart, Bell, ShieldCheck, Sun, Moon, MessageSquare, RefreshCcw,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useCart } from '../context/CartContext'
import { useNotifications } from '../context/NotificationContext'
import { useSocket } from '../context/SocketContext'
import Logo from './Logo'

/* ─── Nav links ─── */
const NAV_LINKS = [
  { label: 'Home', href: '/', hash: false },
  { label: 'Buy Flats', href: '#house_sell', hash: true },
  { label: 'Rent Houses', href: '#house_rent', hash: true },
  { label: 'Furniture', href: '#furniture', hash: true },
  { label: 'Appliances', href: '#appliance', hash: true },
  { label: 'About', href: '#about', hash: true },
]

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('')
}

const ROLE_COLORS = {
  buyer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  seller: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  admin: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
}

export default function Navbar() {
  const { user, logout, appMode, toggleAppMode } = useAuth()
  const { dark, toggleTheme } = useTheme()
  const { cartCount } = useCart()
  const { unreadCount } = useNotifications()
  const { unreadMsgCount } = useSocket()
  const navigate = useNavigate()

  const canUseSellerMode = user?.role === 'seller' && !user?.is_admin
  const canUseBuyerMode = user?.role === 'buyer' && !user?.is_admin
  const displayRole = user?.is_admin ? 'admin' : user?.role

  const currentLinks = appMode === 'selling' && canUseSellerMode
    ? [
      { label: 'Dashboard', href: '/profile', hash: false },
      { label: 'Upload Property', href: '/upload-product', hash: false }
    ]
    : NAV_LINKS

  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
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

  const location = useLocation()
  const currentPath = location.pathname
  const currentHash = location.hash
  const isHome = currentPath === '/'

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
   bg-theme-bg ${scrolled ? 'shadow-md dark:shadow-gray-900/60' : 'shadow-sm dark:border-b dark:border-gray-800'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ─── */}
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="Thikana home">
            <Logo size={34} />
            <span className="text-lg font-extrabold text-theme-text tracking-tight">
              Thikana
            </span>
          </Link>

          {/* ── Desktop Nav ─── */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {currentLinks.map(({ label, href, hash }) => {
              const target = hash ? (isHome ? href : `/${href}`) : href
              const isActive = hash
                ? isHome && currentHash === href
                : currentPath === href && currentHash === ''

              return hash ? (
                <a key={label} href={target}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
          ${isActive ? 'text-theme-primary bg-theme-primary/10 dark:bg-orange-950/40' : 'text-theme-muted hover:text-theme-primary hover:bg-theme-bg dark:hover:bg-gray-800/60'}`}>
                  {label}
                </a>
              ) : (
                <Link key={label} to={target}
                  onClick={() => {
                    if (href === '/') window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
          ${isActive ? 'text-theme-primary bg-theme-primary/10 dark:bg-orange-950/40' : 'text-theme-muted hover:text-theme-primary hover:bg-theme-bg dark:hover:bg-gray-800/60'}`}>
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* ── Right Actions ─── */}
          <div className="flex items-center gap-1.5">

            {/* Theme Toggle */}
            <button
              id="theme-toggle"
              onClick={toggleTheme}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-theme-muted
        hover:text-theme-primary hover:bg-gray-100 dark:hover:bg-gray-800
        transition-all duration-200"
            >
              {dark
                ? <Sun size={18} className="text-yellow-400" />
                : <Moon size={18} />
              }
            </button>

            {user && (
              <>
                {/* Messages */}
                {!user?.is_admin && user?.nid_verified === 1 && (
                  <Link to="/messages" aria-label="Messages"
                    className="hidden sm:flex p-2 rounded-lg text-theme-muted
            hover:text-theme-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 relative">
                    <MessageSquare size={18} />
                    {unreadMsgCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-950">
                        {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Cart */}
                {appMode === 'buying' && canUseBuyerMode && (
                  <Link to="/cart" aria-label="Cart"
                    className="hidden sm:flex p-2 rounded-lg text-theme-muted
           hover:text-theme-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 relative">
                    <ShoppingCart size={18} />
                    {cartCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-theme-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-950">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Notifications */}
                <Link to="/notifications" aria-label="Notifications"
                  className="hidden sm:flex p-2 rounded-lg text-theme-muted
          hover:text-theme-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 relative">
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-950">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {/* ── Auth ─── */}
            {user ? (
              <div ref={profileRef} className="relative">
                <button
                  id="profile-menu-btn"
                  onClick={() => setProfileOpen(v => !v)}
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full
          border border-theme-border
          hover:border-orange-300 dark:hover:border-orange-700
          hover:bg-theme-primary/10 dark:hover:bg-orange-950/30
          transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600
          flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(user.full_name)
                    )}
                  </div>
                  <span className="text-sm font-medium text-theme-text
          max-w-[100px] truncate hidden sm:block">
                    {user.full_name?.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} className={`text-theme-muted transition-transform duration-200
          ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 dropdown-panel py-2 animate-fade-in" role="menu">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-theme-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600
             flex items-center justify-center text-white font-bold text-sm overflow-hidden border border-theme-primary/30">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(user.full_name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-theme-text text-sm truncate">
                            {user.full_name}
                          </p>
                          <p className="text-theme-muted text-xs truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize
              ${ROLE_COLORS[displayRole] || ROLE_COLORS.buyer}`}>
                          {displayRole}
                        </span>
                        {user.nid_verified
                          ? <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full"><ShieldCheck size={10} /> NID Verified</span>
                          : user.nid_status === 'pending'
                            ? <span className="inline-flex items-center gap-1 text-[10px] bg-theme-primary/10 dark:bg-orange-950/40 text-theme-primary border border-theme-primary/30 dark:border-orange-800 px-2 py-0.5 rounded-full">NID Pending</span>
                            : <Link to="/verify-nid" onClick={() => setProfileOpen(false)} className="text-[10px] text-blue-500 hover:text-blue-600 font-medium hover:underline">Verify NID →</Link>
                        }
                      </div>
                    </div>

                    <div className="py-1">
                      <DropItem icon={<User size={15} />} label="My Profile" onClick={() => { navigate('/profile'); setProfileOpen(false) }} />
                      <DropItem icon={<Settings size={15} />} label="Settings" onClick={() => { navigate('/settings'); setProfileOpen(false) }} />
                      {canUseSellerMode && (
                        <DropItem icon={<RefreshCcw size={15} />} label={appMode === 'buying' ? 'Switch to Selling' : 'View as Buyer'} onClick={() => { toggleAppMode(); setProfileOpen(false) }} />
                      )}
                      {!!user?.is_admin && (
                        <DropItem icon={<ShieldCheck size={15} />} label="Admin Panel" onClick={() => { navigate('/admin'); setProfileOpen(false) }} />
                      )}
                    </div>

                    <div className="border-t border-theme-border pt-1">
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
          hover:text-theme-primary hover:bg-theme-bg dark:hover:bg-gray-800 transition-colors">
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button id="mobile-menu-toggle" onClick={() => setMobileOpen(v => !v)}
              aria-expanded={mobileOpen} aria-label="Toggle menu"
              className="md:hidden p-2 rounded-lg text-theme-muted
        hover:text-theme-primary hover:bg-theme-bg dark:hover:bg-gray-800 transition-colors">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Drawer ─── */}
      <div className={`md:hidden overflow-hidden bg-theme-bg
    border-t border-theme-border transition-all duration-300
    ${mobileOpen ? 'max-h-[500px]' : 'max-h-0'}`}>
        <div className="px-4 py-3 space-y-1">
          {currentLinks.map(({ label, href, hash }) => {
            const target = hash ? (isHome ? href : `/${href}`) : href
            const isActive = hash
              ? isHome && currentHash === href
              : currentPath === href && currentHash === ''

            return hash ? (
              <a key={label} href={target} onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 rounded-xl font-medium text-sm transition-colors
         ${isActive ? 'text-theme-primary bg-theme-primary/10 dark:bg-orange-950/30' : 'text-gray-700 dark:text-gray-300 hover:text-theme-primary hover:bg-theme-primary/10 dark:hover:bg-orange-950/30'}`}>
                {label}
              </a>
            ) : (
              <Link key={label} to={target} onClick={() => {
                setMobileOpen(false);
                if (href === '/') window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
                className={`block px-4 py-2.5 rounded-xl font-medium text-sm transition-colors
         ${isActive ? 'text-theme-primary bg-theme-primary/10 dark:bg-orange-950/30' : 'text-gray-700 dark:text-gray-300 hover:text-theme-primary hover:bg-theme-primary/10 dark:hover:bg-orange-950/30'}`}>
                {label}
              </Link>
            )
          })}

          {/* Mobile-only links for logged-in users */}
          {user && (
            <div className="space-y-1 pt-2 border-t border-theme-border">
              {!user?.is_admin && user?.nid_verified === 1 && (
                <Link to="/messages" onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 rounded-xl font-medium text-sm text-gray-700 dark:text-gray-300 hover:text-theme-primary hover:bg-theme-primary/10 dark:hover:bg-orange-950/30">
                  Messages
                </Link>
              )}
              {appMode === 'buying' && canUseBuyerMode && (
                <Link to="/cart" onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 rounded-xl font-medium text-sm text-gray-700 dark:text-gray-300 hover:text-theme-primary hover:bg-theme-primary/10 dark:hover:bg-orange-950/30">
                  Cart {cartCount > 0 && `(${cartCount})`}
                </Link>
              )}
              <Link to="/notifications" onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-xl font-medium text-sm text-gray-700 dark:text-gray-300 hover:text-theme-primary hover:bg-theme-primary/10 dark:hover:bg-orange-950/30">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </Link>
            </div>
          )}

          <div className="border-t border-theme-border pt-3 mt-2">
            {user ? (
              <div>
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600
          flex items-center justify-center text-white font-bold text-sm overflow-hidden border border-theme-primary/30">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(user.full_name)
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-theme-text text-sm">{user.full_name}</p>
                    <p className="text-theme-muted text-xs capitalize">{displayRole}</p>
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
          border-theme-border text-gray-700 dark:text-gray-300
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
    text-gray-700 dark:text-gray-300 hover:bg-theme-bg dark:hover:bg-gray-800/60
    hover:text-theme-primary transition-colors">
      <span className="text-theme-muted">{icon}</span>
      {label}
    </button>
  )
}
