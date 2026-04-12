import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Pencil, ShieldCheck, CalendarDays, ChevronRight,
  ShoppingBag, Heart, Star, Award,
  DollarSign, BarChart3, ClipboardList,
  Package, MessageSquare, Plus,
  Bookmark, MapPin, CreditCard, Bell,
  HelpCircle, Settings, LogOut, X, User, Phone, Home as HomeIcon,
  FileText, Camera,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getProfile, updateProfile, uploadAvatar, getNidStatus, getProducts, editProduct } from '../services/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

/* ── Helpers ──────────────────────────────────────────────── */
function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('')
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/* ── Role config ─────────────────────────────────────────── */
const ROLE_BADGE = {
  buyer:  { label: 'Verified Buyer',  cls: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-200 dark:border-blue-800' },
  seller: { label: 'Verified Seller', cls: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 border-purple-200 dark:border-purple-800' },
  owner:  { label: 'Verified Owner',  cls: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200 dark:border-emerald-800' },
}

const AVATAR_GRADIENT = {
  buyer:  'from-blue-400 to-indigo-600',
  seller: 'from-purple-400 to-fuchsia-600',
  owner:  'from-emerald-400 to-teal-600',
}

/* ── Mock stats ──────────────────────────────────────────── */
const BUYER_STATS = [
  { icon: ShoppingBag, value: 12,    label: 'Orders',    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
  { icon: Heart,       value: 18,    label: 'Favorites', color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/40' },
  { icon: Star,        value: 9,     label: 'Reviews',   color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
  { icon: Award,       value: 252,   label: 'Points',    color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' },
]

const SELLER_STATS = [
  { icon: DollarSign,    value: '৳24,500', label: 'Total Sales',     color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40', sub: '+12.4% this month' },
  { icon: BarChart3,     value: '98%',     label: 'Response Rate',   color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40', sub: 'Average response: 4 hrs' },
  { icon: ClipboardList, value: 42,        label: 'Active Listings', color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40' },
]

/* ── Buyer menu items ────────────────────────────────────── */
const BUYER_MENU = [
  { icon: ShoppingBag, label: 'My Orders' },
  { icon: Bookmark,    label: 'Saved Listings' },
  { icon: MessageSquare, label: 'My Reviews' },
  { icon: MapPin,      label: 'Address Book' },
  { icon: CreditCard,  label: 'Payment Method' },
  { icon: Bell,        label: 'Notifications' },
  { icon: HelpCircle,  label: 'Help & Support' },
  { icon: Settings,    label: 'Settings' },
]

/* ── Seller tabs ─────────────────────────────────────────── */
const SELLER_TABS = [
  { key: 'products', icon: Package,        label: 'My Products' },
  { key: 'orders',   icon: ShoppingBag,    label: 'Orders' },
  { key: 'messages', icon: MessageSquare,  label: 'Messages' },
]


/* ══════════════════════════════════════════════════════════
   PROFILE PAGE
═══════════════════════════════════════════════════════════ */
export default function Profile() {
  const navigate  = useNavigate()
  const { user, logout, refreshUser, loading: authLoading } = useAuth()

  const [profile, setProfile]       = useState(null)
  const [nidSubmission, setNidSubmission] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [editOpen, setEditOpen]     = useState(false)
  const [activeTab, setActiveTab]   = useState('products')

  const [products, setProducts]     = useState([])

  /* ── Fetch profile on mount ── */
  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }
    Promise.all([
      getProfile(), 
      getNidStatus(),
      getProducts({ seller_id: user.id }).catch(() => ({ products: [] }))
    ])
      .then(([profData, nidData, prodData]) => {
        setProfile(profData.user)
        setNidSubmission(nidData.submission)
        setProducts(prodData.products || [])
      })
      .catch((err) => {
        console.error(err)
        navigate('/login')
      })
      .finally(() => setLoading(false))
  }, [user, navigate])

  const fetchSellerProducts = () => {
    if (!user) return
    getProducts({ seller_id: user.id })
      .then(res => setProducts(res.products || []))
      .catch(console.error)
  }

  const handleLogout = () => { logout(); navigate('/') }

  const isSeller = profile?.role === 'seller' || profile?.role === 'owner'

  /* ── Loading state ── */
  if (authLoading || loading || !profile) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 pt-16">
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading profile…</p>
          </div>
        </div>
      </>
    )
  }

  const roleBadge = ROLE_BADGE[profile.role] || ROLE_BADGE.buyer
  const avatarGrad = AVATAR_GRADIENT[profile.role] || AVATAR_GRADIENT.buyer

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-16 pb-12 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Page Header Bar ────────────────────── */}
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <Link to="/"
                className="p-2 rounded-lg text-gray-400 hover:text-orange-500
                  hover:bg-white dark:hover:bg-gray-900 border border-transparent
                  hover:border-gray-200 dark:hover:border-gray-800 transition-all duration-200">
                <ArrowLeft size={18} />
              </Link>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">My Profile</h1>
            </div>
            <button onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30
                border border-orange-200 dark:border-orange-800
                transition-all duration-200 active:scale-95">
              <Pencil size={14} />
              Edit Profile
            </button>
          </div>

          {/* ── Profile Card ──────────────────────── */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800
            rounded-2xl shadow-sm p-6 sm:p-8 mb-6 animate-slide-up">

            {/* Avatar + Info */}
            <div className="flex flex-col items-center text-center">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${avatarGrad}
                flex items-center justify-center text-white text-3xl font-bold
                ring-4 ring-white dark:ring-gray-900 shadow-lg mb-4 overflow-hidden relative group`}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getInitials(profile.full_name)
                )}
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {profile.full_name}
              </h2>
              <p className="text-gray-400 text-sm mt-0.5">{profile.email}</p>
              {profile.address && (
                <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                  <MapPin size={11} /> {profile.address}
                </p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                {profile.is_verified ? (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold
                    px-3 py-1 rounded-full border ${roleBadge.cls}`}>
                    <ShieldCheck size={12} /> {roleBadge.label}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium
                    px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700
                    text-gray-500 bg-gray-50 dark:bg-gray-800 capitalize">
                    {profile.role}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-400
                  bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full border
                  border-gray-100 dark:border-gray-700">
                  <CalendarDays size={11} /> Member Since {formatDate(profile.created_at)}
                </span>
                
                {/* NID Badge/Button */}
                {profile.nid_verified ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold
                    px-3 py-1 rounded-full border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck size={12} /> NID Verified
                  </span>
                ) : nidSubmission?.status === 'pending' ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium
                    px-3 py-1 rounded-full border bg-orange-50 dark:bg-orange-950/20 text-orange-500 border-orange-200 dark:border-orange-800/50">
                    NID Pending Review
                  </span>
                ) : (
                  <Link to="/verify-nid" className="inline-flex items-center gap-1 text-xs font-semibold
                    px-3 py-1 rounded-full border bg-blue-50 dark:bg-blue-950/30 text-blue-600 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
                    Verify Identity →
                  </Link>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-4 max-w-md leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* ── Stats Row ─────────────────────────── */}
          <div className={`grid gap-3 mb-6 animate-slide-up ${
            isSeller ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'
          }`} style={{ animationDelay: '60ms' }}>
            {(isSeller ? SELLER_STATS : BUYER_STATS).map(({ icon: Icon, value, label, color, sub }) => (
              <div key={label} className="stat-card group">
                <div className={`w-10 h-10 rounded-xl ${color}
                  flex items-center justify-center mx-auto mb-2.5
                  group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={18} />
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                {sub && <p className="text-[10px] text-emerald-500 font-medium mt-1">{sub}</p>}
              </div>
            ))}
          </div>

          {/* ── Role-specific Content ─────────────── */}
          {isSeller ? <SellerContent activeTab={activeTab} setActiveTab={setActiveTab} products={products} refreshProducts={fetchSellerProducts} /> : <BuyerContent onLogout={handleLogout} />}

        </div>
      </main>
      <Footer />

      {/* ── Edit Profile Modal ── */}
      {editOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={(updatedUser) => {
            setProfile(updatedUser)
            refreshUser()
            setEditOpen(false)
          }}
        />
      )}
    </>
  )
}

/* ══════════════════════════════════════════════════════════
   BUYER CONTENT — Menu list style
═══════════════════════════════════════════════════════════ */
function BuyerContent({ onLogout }) {
  return (
    <div className="space-y-2 animate-slide-up" style={{ animationDelay: '120ms' }}>
      {BUYER_MENU.map(({ icon: Icon, label }) => (
        <button key={label} className="menu-item w-full">
          <span className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-800
            flex items-center justify-center text-gray-400 flex-shrink-0">
            <Icon size={16} />
          </span>
          <span className="flex-1 text-left">{label}</span>
          <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
        </button>
      ))}
      <button onClick={onLogout} className="menu-item-danger w-full mt-2">
        <span className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/30
          flex items-center justify-center text-red-400 flex-shrink-0">
          <LogOut size={16} />
        </span>
        <span className="flex-1 text-left">Logout</span>
        <ChevronRight size={16} className="text-red-200 dark:text-red-900" />
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   SELLER CONTENT — Tabs + product grid
═══════════════════════════════════════════════════════════ */
function SellerContent({ activeTab, setActiveTab, products, refreshProducts }) {
  return (
    <div className="animate-slide-up" style={{ animationDelay: '120ms' }}>
      {/* Tab bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800
        rounded-2xl shadow-sm mb-4">
        <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-2">
          {SELLER_TABS.map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium
                border-b-2 transition-all duration-200 -mb-px
                ${activeTab === key
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}

          <div className="flex-1" />
          <Link to="/upload-product" className="btn-primary text-xs py-2 px-3.5 mr-2 my-2 inline-flex items-center gap-1.5 focus:outline-none">
            <Plus size={14} /> Add New Product
          </Link>
        </div>

        {/* Tab content */}
        <div className="p-5">
          {activeTab === 'products' && <ProductsTab products={products} refreshProducts={refreshProducts} />}
          {activeTab === 'orders'   && <PlaceholderTab label="Orders" />}
          {activeTab === 'messages' && <PlaceholderTab label="Messages" />}
        </div>
      </div>
    </div>
  )
}

function ProductsTab({ products, refreshProducts }) {
  const [editingProduct, setEditingProduct] = useState(null)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(p => (
          <div key={p.id} className="card p-4 group relative">
            {/* Action Overlay */}
            <div className="absolute top-6 right-6 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => setEditingProduct(p)} className="p-2 bg-white text-gray-700 hover:text-orange-500 rounded-full shadow-md">
                 <Pencil size={14} />
               </button>
            </div>

            {/* Main Image */}
            <div className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 mb-3 flex items-center justify-center overflow-hidden relative
              transition-all duration-300">
              {p.main_image ? (
                <img src={p.main_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <Package size={28} className="text-gray-300 dark:text-gray-600
                  group-hover:text-orange-300 dark:group-hover:text-orange-700 transition-colors" />
              )}
            </div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 pr-2">
                <Link to={`/product/${p.id}`} className="text-sm font-semibold text-gray-900 dark:text-white truncate hover:text-orange-500 hover:underline block">{p.title}</Link>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">{p.category.replace('_', ' ')}</p>
              </div>
              <span className={`text-[10px] whitespace-nowrap font-bold px-2 py-0.5 rounded-full uppercase
                ${p.status === 'approved' || p.status === 'active'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                  : p.status === 'pending'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-500 border border-orange-200 dark:border-orange-800'
                  : p.status === 'sold'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200 dark:border-rose-800'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700'}`}>
                {p.status}
              </span>
            </div>
            <p className="text-base font-bold text-orange-500 mt-2">৳{p.price.toLocaleString()}</p>
          </div>
        ))}

        {/* Add-new card */}
      <Link to="/upload-product" className="border-2 border-dashed border-gray-200 dark:border-gray-700
        rounded-2xl p-4 flex flex-col items-center justify-center gap-2 min-h-[200px]
        text-gray-400 hover:border-orange-300 dark:hover:border-orange-700
        hover:text-orange-500 hover:bg-orange-50/30 dark:hover:bg-orange-950/10
        transition-all duration-200 group">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800
          flex items-center justify-center group-hover:bg-orange-100 dark:group-hover:bg-orange-950/30
          transition-colors">
          <Plus size={22} />
        </div>
        <p className="text-sm font-medium">Add New Item</p>
        <p className="text-xs text-gray-300 dark:text-gray-600">List your product here</p>
      </Link>
    </div>
      
      {editingProduct && (
        <EditProductModal 
          product={editingProduct} 
          onClose={() => setEditingProduct(null)} 
          onSuccess={() => { setEditingProduct(null); refreshProducts(); }} 
        />
      )}
    </>
  )
}

function PlaceholderTab({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800
        flex items-center justify-center mb-3">
        <FileText size={24} />
      </div>
      <p className="text-sm font-medium">No {label.toLowerCase()} yet</p>
      <p className="text-xs mt-1">Your {label.toLowerCase()} will appear here</p>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   EDIT PROFILE MODAL
═══════════════════════════════════════════════════════════ */
function EditProfileModal({ profile, onClose, onSaved }) {
  const [form, setForm] = useState({
    fullName: profile.full_name || '',
    phone:    profile.phone || '',
    address:  profile.address || '',
    bio:      profile.bio || '',
  })
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [avatarDataUrl, setAvatarDataUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || '')

  const handleChange = e => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (error) setError('')
  }

  const handleAvatarChange = e => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setAvatarPreview(ev.target.result)
      setAvatarDataUrl(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.fullName.trim() || form.fullName.length < 3) {
      setError('Name must be at least 3 characters.')
      return
    }
    setSaving(true)
    setError('')
    try {
      let finalUser = null;
      if (avatarDataUrl) {
        const { user } = await uploadAvatar(avatarDataUrl)
        finalUser = user;
      }
      
      const { user } = await updateProfile(form)
      finalUser = user; // latest update

      setSuccess(true)
      setTimeout(() => onSaved(finalUser), 600)
    } catch (err) {
      setError(err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 animate-fade-in" />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900
        rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800
        animate-modal-in max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
          border-b border-gray-100 dark:border-gray-800 sticky top-0
          bg-white dark:bg-gray-900 z-10">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Profile</h3>
          <button onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800
              rounded-xl text-red-600 text-sm text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800
              rounded-xl text-emerald-600 text-sm text-center">
              ✓ Profile updated successfully!
            </div>
          )}

          {/* Avatar Edit */}
          <div className="flex flex-col items-center justify-center py-2">
            <label className="relative cursor-pointer group block">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${AVATAR_GRADIENT[profile.role] || AVATAR_GRADIENT.buyer}
                flex items-center justify-center text-white text-2xl font-bold
                overflow-hidden border-2 border-gray-100 dark:border-gray-800 shadow-sm`}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  getInitials(profile.full_name)
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 
                transition-opacity flex items-center justify-center text-white">
                <Camera size={20} />
              </div>
              <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleAvatarChange} />
            </label>
            <p className="text-[10px] text-gray-400 mt-2">Click to change picture</p>
          </div>

          <ModalField icon={<User size={15} />} label="Full Name">
            <input name="fullName" value={form.fullName} onChange={handleChange}
              placeholder="Your full name" className="input-field pl-10" />
          </ModalField>

          <ModalField icon={<Phone size={15} />} label="Phone">
            <input name="phone" value={form.phone} onChange={handleChange}
              placeholder="e.g. 01712345678" className="input-field pl-10" />
          </ModalField>

          <ModalField icon={<MapPin size={15} />} label="Address">
            <input name="address" value={form.address} onChange={handleChange}
              placeholder="e.g. Banani, Dhaka" className="input-field pl-10" />
          </ModalField>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bio</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
              placeholder="Tell us about yourself…"
              className="input-field resize-none" />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-medium
                text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800
                transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="btn-primary py-2.5 disabled:opacity-70 disabled:cursor-not-allowed">
              {saving
                ? <span className="flex items-center gap-2"><ModalSpinner /> Saving…</span>
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalField({ icon, label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </span>
        {children}
      </div>
    </div>
  )
}

function ModalSpinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════
   EDIT PRODUCT MODAL
═══════════════════════════════════════════════════════════ */
function EditProductModal({ product, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: product.title || '',
    price: product.price || '',
    description: product.description || '',
    status: product.status || 'approved'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await editProduct(product.id, formData)
      onSuccess()
    } catch (err) {
      setError(err.message || 'Failed to update product.')
      setLoading(false)
    }
  }

  // Prevent scroll on body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl
        border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh] animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Product</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto">
          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
              {error}
            </div>
          )}

          <form id="edit-prod-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required
                className="input-field py-2" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Price (BDT)</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} required
                className="input-field py-2" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
              <select name="status" value={formData.status} onChange={handleChange}
                className="input-field py-2">
                <option value="approved">Active</option>
                <option value="sold">Mark as Sold Out</option>
                <option value="pending">Hide (Pending Review)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="4"
                className="input-field py-2 min-h-[100px] resize-y" />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex gap-3 justify-end bg-gray-50 dark:bg-gray-900/50 rounded-b-3xl">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button type="submit" form="edit-prod-form" disabled={loading}
            className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2">
            {loading ? <ModalSpinner /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
