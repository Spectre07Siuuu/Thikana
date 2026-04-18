import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Package, ShieldCheck, ChevronLeft, ChevronRight,
  Phone, Mail, User, ShoppingBag, Heart, MessageSquare, Send, X, Eye,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getProductById, toggleFavourite, getFavouriteStatus, sendInquiry } from '../services/api'
import { useAuth } from '../context/AuthContext'

const formatPrice = (price) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(price)
const formatDate  = (d) => d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

export default function ProductDetails() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [product, setProduct]             = useState(null)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [saved, setSaved]                 = useState(false)
  const [savePending, setSavePending]     = useState(false)
  const [showInquiry, setShowInquiry]     = useState(false)

  useEffect(() => {
    setLoading(true)
    setCurrentImageIndex(0)
    getProductById(id)
      .then(res => setProduct(res.product))
      .catch(err => setError(err.message || 'Failed to load product'))
      .finally(() => setLoading(false))
  }, [id])

  // Fetch favourite status when user is logged in
  useEffect(() => {
    if (!user || !id) return
    getFavouriteStatus(id).then(data => setSaved(data.saved)).catch(() => {})
  }, [user, id])

  const handleToggleFavourite = async () => {
    if (!user) { navigate('/login'); return }
    setSavePending(true)
    try {
      const res = await toggleFavourite(id)
      setSaved(res.saved)
    } catch (err) {
      console.error(err)
    } finally {
      setSavePending(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-16 bg-gray-50 dark:bg-gray-950">
          <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    )
  }

  if (error || !product) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 px-4 text-center bg-gray-50 dark:bg-gray-950">
          <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Oops!</h2>
            <p className="text-gray-500 mb-6">{error || 'Product not found.'}</p>
            <Link to="/" className="btn-primary py-2 px-6">Back to Home</Link>
          </div>
        </div>
      </>
    )
  }

  const {
    title, location, price, description, category, created_at, status, attributes,
    seller_name, seller_verified, seller_avatar, seller_phone, seller_email, seller_id,
    images, related, views,
  } = product

  const nextImage = () => setCurrentImageIndex(i => (i + 1) % images.length)
  const prevImage = () => setCurrentImageIndex(i => (i === 0 ? images.length - 1 : i - 1))

  const isSeller = user?.id === seller_id

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">

          {/* Back */}
          <div className="mb-6 flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors">
              <ArrowLeft size={16} /> Back to Home
            </Link>
            {views > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Eye size={12} /> {views} views
              </span>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">

            {/* ── Image Gallery ── */}
            <div className="space-y-4">
              <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm group border border-gray-200 dark:border-gray-800">
                {images && images.length > 0 ? (
                  <>
                    <img src={images[currentImageIndex]} alt={title} className="w-full h-full object-cover transition-transform duration-500" />
                    {images.length > 1 && (
                      <>
                        <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-md">
                          <ChevronLeft size={20} />
                        </button>
                        <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-md">
                          <ChevronRight size={20} />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 rounded-full bg-black/30 backdrop-blur-md">
                          {images.map((_, idx) => (
                            <button key={idx} onClick={() => setCurrentImageIndex(idx)}
                              className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Package size={48} className="mb-2 opacity-50" />
                    <p>No images available</p>
                  </div>
                )}

                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                    {category.replace('_', ' ')}
                  </span>
                  {status === 'sold' && (
                    <span className="bg-rose-500 text-white text-xs font-bold uppercase px-3 py-1.5 rounded-full">Sold Out</span>
                  )}
                </div>

                {/* Favourite button */}
                <button onClick={handleToggleFavourite} disabled={savePending}
                  className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all
                    ${saved ? 'bg-rose-500 text-white' : 'bg-white/80 dark:bg-gray-900/80 text-gray-500 hover:text-rose-500'}`}>
                  <Heart size={18} className={saved ? 'fill-current' : ''} />
                </button>
              </div>

              {images && images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                  {images.map((img, idx) => (
                    <button key={idx} onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden snap-center border-2 transition-all
                        ${idx === currentImageIndex ? 'border-orange-500 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                      <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Details ── */}
            <div className="flex flex-col">
              <div className="mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-snug">{title}</h1>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 font-medium">
                  <span className="flex items-center gap-1"><MapPin size={14} className="text-orange-500" /> {location}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                  <span>Posted {formatDate(created_at)}</span>
                </div>
              </div>

              <div className="mb-6 flex items-baseline gap-2">
                <p className="text-2xl font-black text-rose-500">৳{formatPrice(price)}</p>
                {category === 'house_rent' && <span className="text-sm font-semibold text-gray-400">/month</span>}
              </div>

              {/* Buy Now / Cart for goods */}
              {(category === 'furniture' || category === 'appliance') && !isSeller && status !== 'sold' && (
                <div className="flex items-center gap-3 mb-6">
                  <button className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <ShoppingBag size={18} /> Buy Now
                  </button>
                  <button onClick={handleToggleFavourite}
                    className={`flex items-center gap-2 py-3 px-4 rounded-xl border font-semibold text-sm transition-all
                      ${saved ? 'border-rose-400 text-rose-500 bg-rose-50 dark:bg-rose-950/30' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-rose-300'}`}>
                    <Heart size={16} className={saved ? 'fill-current' : ''} />
                    {saved ? 'Saved' : 'Save'}
                  </button>
                </div>
              )}

              {/* Attributes */}
              {attributes && Object.keys(attributes).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Specifications</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(attributes).map(([key, value]) => !value ? null : (
                      <div key={key} className="p-3 rounded-xl bg-gray-100/70 dark:bg-gray-800/70 flex flex-col">
                        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{key.replace('_', ' ')}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white capitalize mt-0.5">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                  {description || 'No description provided.'}
                </p>
              </div>

              {/* Seller Card */}
              <div className="mt-auto p-5 rounded-3xl bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-950/20 dark:to-rose-950/20 border border-orange-100 dark:border-orange-900/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                    {seller_avatar ? <img src={seller_avatar} alt={seller_name} className="w-full h-full object-cover" /> : <User size={24} className="text-gray-500" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-sm">
                      {seller_name}
                      {seller_verified === 1 && (
                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck size={10} /> Verified
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">Listed this property</p>
                  </div>
                </div>

                {!isSeller && (
                  <div className="grid grid-cols-3 gap-2">
                    {seller_phone && (
                      <a href={`tel:${seller_phone}`}
                        className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-semibold text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-emerald-300 hover:text-emerald-600 transition-all">
                        <Phone size={15} className="text-emerald-500" /> Call
                      </a>
                    )}
                    {seller_email && (
                      <a href={`mailto:${seller_email}`}
                        className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-semibold text-xs bg-orange-500 text-white hover:bg-orange-600 transition-all">
                        <Mail size={15} /> Email
                      </a>
                    )}
                    <button onClick={() => { if (!user) { navigate('/login'); return } setShowInquiry(true) }}
                      className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-semibold text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 hover:text-blue-600 transition-all">
                      <MessageSquare size={15} className="text-blue-500" /> Message
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Related Listings ── */}
          {related && related.length > 0 && (
            <div className="mt-14">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Similar Listings</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {related.map(r => (
                  <Link key={r.id} to={`/product/${r.id}`} className="card p-3 group">
                    <div className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden mb-2">
                      {r.main_image
                        ? <img src={r.main_image} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={20} /></div>
                      }
                    </div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{r.title}</p>
                    <p className="text-xs font-bold text-orange-500 mt-0.5">৳{formatPrice(r.price)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* ── Inquiry Modal ── */}
      {showInquiry && (
        <InquiryModal
          product={product}
          onClose={() => setShowInquiry(false)}
        />
      )}
    </>
  )
}

/* ── Inquiry Modal ── */
function InquiryModal({ product, onClose }) {
  const { user } = useAuth()
  const [msg, setMsg]       = useState('')
  const [phone, setPhone]   = useState(user?.phone || '')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [sent, setSent]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!msg.trim()) { setError('Please write a message.'); return }
    setLoading(true)
    setError('')
    try {
      await sendInquiry({ product_id: product.id, message: msg.trim(), sender_phone: phone.trim() || undefined })
      setSent(true)
    } catch (err) {
      setError(err.message || 'Failed to send inquiry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 animate-fade-in" />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 animate-modal-in max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare size={16} className="text-orange-500" /> Contact Seller
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Send size={24} className="text-emerald-500" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">Message Sent!</h4>
              <p className="text-sm text-gray-500">The seller will contact you soon.</p>
              <button onClick={onClose} className="mt-4 btn-primary text-sm py-2 px-5">Close</button>
            </div>
          ) : (
            <>
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xl mb-4">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">About: <span className="text-gray-900 dark:text-white">{product.title}</span></p>
              </div>

              {error && (
                <div className="mb-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Your phone (optional)</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="01700000000" className="input-field py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message <span className="text-red-400">*</span></label>
                  <textarea value={msg} onChange={e => { setMsg(e.target.value); setError('') }} rows={4}
                    placeholder={`Hi, I'm interested in "${product.title}". Is it still available?`}
                    className="input-field resize-none text-sm" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 btn-primary justify-center py-2.5 text-sm disabled:opacity-70">
                    {loading ? 'Sending…' : <><Send size={14} /> Send Message</>}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
