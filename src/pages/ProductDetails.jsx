import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
 ArrowLeft, MapPin, Package, ShieldCheck, ChevronLeft, ChevronRight,
 Phone, Mail, User, ShoppingBag, Heart, MessageSquare, Eye, ShoppingCart, Check, Star
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getProductById, toggleFavourite, getFavouriteStatus, getProductReviews } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const formatPrice = (price) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(price)
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

export default function ProductDetails() {
 const { id }  = useParams()
 const navigate = useNavigate()
 const { user } = useAuth()
 const { addToCart, cartCount } = useCart()

 const [product, setProduct]       = useState(null)
 const [loading, setLoading]       = useState(true)
 const [error, setError]         = useState('')
 const [currentImageIndex, setCurrentImageIndex] = useState(0)
 const [saved, setSaved]         = useState(false)
 const [savePending, setSavePending]   = useState(false)
 const [inCart, setInCart]        = useState(false)
 const [addingToCart, setAddingToCart]  = useState(false)

 const [reviews, setReviews]       = useState([])
 const [avgRating, setAvgRating]     = useState(0)
 const [totalReviews, setTotalReviews]  = useState(0)

 useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  setLoading(true)
  setCurrentImageIndex(0)
  getProductById(id)
   .then(res => setProduct(res.product))
   .catch(err => setError(err.message || 'Failed to load product'))
   .finally(() => setLoading(false))

  getProductReviews(id)
   .then(res => {
    setReviews(res.reviews || [])
    setAvgRating(res.avgRating || 0)
    setTotalReviews(res.total || 0)
   })
   .catch(console.error)
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

 const handleAddToCart = async () => {
  if (!user) { navigate('/login'); return }
  if (user.is_admin || user.role !== 'buyer') { return }
  setAddingToCart(true)
  try {
   const res = await addToCart(parseInt(id))
   setInCart(true)
  } catch (err) {
   console.error(err)
  } finally {
   setAddingToCart(false)
  }
 }

 const handleBuyNow = async () => {
  if (!user) { navigate('/login'); return }
  if (user.is_admin || user.role !== 'buyer') { return }
  if (user.nid_verified !== 1) { navigate('/verify-nid'); return }
  setAddingToCart(true)
  try {
   await addToCart(parseInt(id))
   navigate('/checkout')
  } catch (err) {
   console.error(err)
  } finally {
   setAddingToCart(false)
  }
 }

 const handleMessage = () => {
  if (!user) { navigate('/login'); return }
  if (user.is_admin || !['buyer', 'seller'].includes(user.role)) return
  if (user.nid_verified !== 1) { navigate('/verify-nid'); return }
  navigate(`/messages?user=${product.seller_id}&product=${id}`)
 }

 if (loading) {
  return (
   <>
    <Navbar />
    <div className="min-h-screen flex items-center justify-center pt-16 bg-theme-bg">
     <div className="w-10 h-10 border-3 border-theme-primary border-t-transparent rounded-full animate-spin" />
    </div>
   </>
  )
 }

 if (error || !product) {
  return (
   <>
    <Navbar />
    <div className="min-h-screen pt-24 px-4 text-center bg-theme-bg">
     <div className="max-w-md mx-auto bg-theme-card rounded-3xl p-8 border border-theme-border">
      <h2 className="text-xl font-bold text-theme-text mb-2">Oops!</h2>
      <p className="text-theme-muted mb-6">{error || 'Product not found.'}</p>
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
 const isBuyer = user?.role === 'buyer' && !user?.is_admin
 const isCartable = ['furniture', 'appliance'].includes(category) && !isSeller && status !== 'sold' && isBuyer

 return (
  <>
   <Navbar />
   <main className="min-h-screen bg-theme-bg pt-24 pb-16">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">

     {/* Back */}
     <div className="mb-6 flex items-center justify-between">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-theme-muted hover:text-theme-primary transition-colors">
       <ArrowLeft size={16} /> Back to Home
      </Link>
      {views > 0 && (
       <span className="flex items-center gap-1 text-xs text-theme-muted">
        <Eye size={12} /> {views} views
       </span>
      )}
     </div>

     <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">

      {/* ── Image Gallery ── */}
      <div className="space-y-4">
       <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm group border border-theme-border">
        {images && images.length > 0 ? (
         <>
          <img src={images[currentImageIndex]} alt={title} className="w-full h-full object-cover transition-transform duration-500" />
          {images.length > 1 && (
           <>
            <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 bg-theme-card/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-theme-primary hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-md">
             <ChevronLeft size={20} />
            </button>
            <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 bg-theme-card/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-theme-primary hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-md">
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
         <div className="w-full h-full flex flex-col items-center justify-center text-theme-muted">
          <Package size={48} className="mb-2 opacity-50" />
          <p>No images available</p>
         </div>
        )}

        <div className="absolute top-4 left-4 flex gap-2">
         {category && (
          <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
           {category.replace('_', ' ')}
          </span>
         )}
         {status === 'sold' && (
          <span className="bg-rose-500 text-white text-xs font-bold uppercase px-3 py-1.5 rounded-full">Sold Out</span>
         )}
        </div>

        {/* Favourite button */}
        <button onClick={handleToggleFavourite} disabled={savePending}
         className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all
          ${saved ? 'bg-rose-500 text-white' : 'bg-white/80 bg-theme-card/80 text-theme-muted hover:text-rose-500'}`}>
         <Heart size={18} className={saved ? 'fill-current' : ''} />
        </button>
       </div>

       {images && images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
         {images.map((img, idx) => (
          <button key={idx} onClick={() => setCurrentImageIndex(idx)}
           className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden snap-center border-2 transition-all
            ${idx === currentImageIndex ? 'border-theme-primary shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}>
           <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
          </button>
         ))}
        </div>
       )}
      </div>

      {/* ── Details ── */}
      <div className="flex flex-col">
       <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-theme-text leading-snug">{title}</h1>
        <div className="flex items-center gap-3 mt-2 text-sm text-theme-muted font-medium">
         <span className="flex items-center gap-1"><MapPin size={14} className="text-theme-primary" /> {location}</span>
         <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
         <span>Posted {formatDate(created_at)}</span>
        </div>
       </div>

       <div className="mb-6 flex items-baseline gap-2">
        <p className="text-2xl font-black text-rose-500">৳{formatPrice(price)}</p>
        {category === 'house_rent' && <span className="text-sm font-semibold text-theme-muted">/month</span>}
       </div>

       {/* Buy Now / Cart for goods */}
       {isCartable && (
        <div className="flex items-center gap-3 mb-6">
         <button onClick={handleBuyNow} disabled={addingToCart}
          className="flex-1 bg-gray-900 dark:bg-white text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50">
          <ShoppingBag size={18} /> Buy Now
         </button>
         {inCart ? (
          <Link to="/cart"
           className="flex items-center gap-2 py-3 px-4 rounded-xl border font-semibold text-sm transition-all
            border-emerald-400 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30">
           <Check size={16} /> In Cart
          </Link>
         ) : (
          <button onClick={handleAddToCart} disabled={addingToCart}
           className="flex items-center gap-2 py-3 px-4 rounded-xl border font-semibold text-sm transition-all
            border-theme-border text-gray-600 dark:text-gray-300 hover:border-orange-300 hover:text-theme-primary disabled:opacity-50">
           <ShoppingCart size={16} /> Add to Cart
          </button>
         )}
         <button onClick={handleToggleFavourite}
          className={`flex items-center gap-2 py-3 px-4 rounded-xl border font-semibold text-sm transition-all
           ${saved ? 'border-rose-400 text-rose-500 bg-rose-50 dark:bg-rose-950/30' : 'border-theme-border text-gray-600 dark:text-gray-300 hover:border-rose-300'}`}>
          <Heart size={16} className={saved ? 'fill-current' : ''} />
         </button>
        </div>
       )}

       {/* Attributes */}
       {attributes && Object.keys(attributes).length > 0 && (
        <div className="mb-6">
         <h3 className="text-base font-bold text-theme-text mb-3">Specifications</h3>
         <div className="grid grid-cols-2 gap-3">
          {Object.entries(attributes).map(([key, value]) => !value ? null : (
           <div key={key} className="p-3 rounded-xl bg-gray-100/70 dark:bg-gray-800/70 flex flex-col">
            <span className="text-[10px] text-theme-muted font-semibold uppercase tracking-wider">{key.replace('_', ' ')}</span>
            <span className="text-sm font-bold text-theme-text capitalize mt-0.5">{value}</span>
           </div>
          ))}
         </div>
        </div>
       )}

       {/* Description */}
       <div className="mb-6">
        <h3 className="text-base font-bold text-theme-text mb-2">Description</h3>
        <p className="text-theme-muted text-sm leading-relaxed whitespace-pre-line">
         {description || 'No description provided.'}
        </p>
       </div>

       {/* Seller Card */}
       <div className="mt-auto p-5 rounded-3xl bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-950/20 dark:to-rose-950/20 border border-orange-100 dark:border-orange-900/30">
        <div className="flex items-center gap-3 mb-4">
         <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
          {seller_avatar ? <img src={seller_avatar} alt={seller_name} className="w-full h-full object-cover" /> : <User size={24} className="text-theme-muted" />}
         </div>
         <div>
          <h4 className="font-bold text-theme-text flex items-center gap-1.5 text-sm">
           {seller_name}
           {seller_verified === 1 && (
            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
             <ShieldCheck size={10} /> Verified
            </span>
           )}
          </h4>
          <p className="text-xs text-theme-muted mt-0.5">Listed this property</p>
         </div>
        </div>

        {!isSeller && (
         <div className="grid grid-cols-3 gap-2">
          {seller_phone && (
           <a href={`tel:${seller_phone}`}
            className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-semibold text-xs bg-theme-card border border-theme-border text-gray-700 dark:text-gray-300 hover:border-emerald-300 hover:text-emerald-600 transition-all">
            <Phone size={15} className="text-emerald-500" /> Call
           </a>
          )}
          {seller_email && (
           <a href={`mailto:${seller_email}`}
            className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-semibold text-xs bg-theme-primary text-white hover:bg-orange-600 transition-all">
            <Mail size={15} /> Email
           </a>
          )}
          <button onClick={handleMessage}
           className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-semibold text-xs bg-theme-card border border-theme-border text-gray-700 dark:text-gray-300 hover:border-blue-300 hover:text-blue-600 transition-all">
           <MessageSquare size={15} className="text-blue-500" /> Message
          </button>
         </div>
        )}
       </div>
      </div>
     </div>

     {/* ── Product Reviews ── */}
     <div className="mt-14 mb-10 pt-10 border-t border-theme-border">
      <h2 className="text-lg font-bold text-theme-text mb-6">Customer Reviews</h2>
      
      {totalReviews === 0 ? (
       <div className="text-center py-10 bg-theme-card rounded-3xl border border-theme-border">
        <Star size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
        <p className="text-sm font-medium text-theme-muted">No reviews yet for this product.</p>
        <p className="text-xs text-theme-muted mt-1">Be the first to review after purchasing!</p>
       </div>
      ) : (
       <div className="grid lg:grid-cols-[300px_1fr] gap-8">
        {/* Summary */}
        <div className="bg-theme-primary/10 dark:bg-orange-950/20 p-6 rounded-3xl border border-orange-100 dark:border-orange-900/30 text-center h-fit">
         <p className="text-5xl font-black text-theme-primary mb-2">{avgRating}</p>
         <div className="flex justify-center gap-1 mb-2 text-amber-400">
          {[1,2,3,4,5].map(star => (
           <span key={star} className={star <= Math.round(avgRating) ? '' : 'text-gray-300 dark:text-gray-700'}>★</span>
          ))}
         </div>
         <p className="text-sm text-theme-muted font-medium">Based on {totalReviews} review{totalReviews > 1 ? 's' : ''}</p>
        </div>

        {/* Review List */}
        <div className="space-y-4">
         {reviews.map(review => (
          <div key={review.id} className="bg-theme-card p-5 rounded-2xl border border-theme-border shadow-sm">
           <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
              {review.buyer_avatar ? <img src={review.buyer_avatar} className="w-full h-full object-cover" alt="" /> : <User size={20} className="m-auto mt-2 text-theme-muted" />}
             </div>
             <div>
              <p className="text-sm font-bold text-theme-text">{review.buyer_name}</p>
              <p className="text-[10px] text-theme-muted">{formatDate(review.created_at)}</p>
             </div>
            </div>
            <div className="flex text-amber-400 text-sm">
             {[...Array(5)].map((_, i) => (
              <span key={i} className={i < review.rating ? '' : 'text-gray-200 dark:text-gray-700'}>★</span>
             ))}
            </div>
           </div>
           {review.comment && (
            <p className="text-sm text-theme-muted leading-relaxed bg-theme-bg/50 p-4 rounded-xl">
             {review.comment}
            </p>
           )}
          </div>
         ))}
        </div>
       </div>
      )}
     </div>

     {/* ── Related Listings ── */}
     {related && related.length > 0 && (
      <div className="mt-14">
       <h2 className="text-lg font-bold text-theme-text mb-4">Similar Listings</h2>
       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {related.map(r => (
         <Link key={r.id} to={`/product/${r.id}`} className="card p-3 group">
          <div className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden mb-2">
           {r.main_image
            ? <img src={r.main_image} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center text-theme-muted"><Package size={20} /></div>
           }
          </div>
          <p className="text-xs font-semibold text-theme-text truncate">{r.title}</p>
          <p className="text-xs font-bold text-theme-primary mt-0.5">৳{formatPrice(r.price)}</p>
         </Link>
        ))}
       </div>
      </div>
     )}
    </div>
   </main>
   <Footer />
  </>
 )
}
