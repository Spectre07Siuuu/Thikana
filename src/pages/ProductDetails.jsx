import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Tag, Box, Sofa, Package, ShieldCheck, CheckCircle, ChevronLeft, ChevronRight, Phone, Mail, User, ShoppingBag
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getProductById } from '../services/api'

// Format currency
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(price)
}

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ProductDetails() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    setLoading(true)
    getProductById(id)
      .then(res => setProduct(res.product))
      .catch(err => setError(err.message || 'Failed to load product'))
      .finally(() => setLoading(false))
  }, [id])

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

  const { title, location, price, description, category, created_at, status, attributes, seller_name, seller_verified, seller_avatar, seller_phone, seller_email, images } = product

  const nextImage = () => setCurrentImageIndex(i => (i + 1) % images.length)
  const prevImage = () => setCurrentImageIndex(i => (i === 0 ? images.length - 1 : i - 1))

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">

          {/* Breadcrumb / Back */}
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors">
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Left Column: Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm group border border-gray-200 dark:border-gray-800">
                {images && images.length > 0 ? (
                  <>
                    <img src={images[currentImageIndex]} alt={title} className="w-full h-full object-cover transition-transform duration-500" />
                    
                    {images.length > 1 && (
                      <>
                        <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 dark:text-white hover:bg-orange-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-md">
                          <ChevronLeft size={20} />
                        </button>
                        <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 dark:text-white hover:bg-orange-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-md">
                          <ChevronRight size={20} />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 rounded-full bg-black/30 backdrop-blur-md">
                          {images.map((_, idx) => (
                            <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`} />
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
                
                {/* Status Badge */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                    {category.replace('_', ' ')}
                  </span>
                  {status === 'sold' && (
                    <span className="bg-rose-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md shadow-rose-500/20">
                      Sold Out
                    </span>
                  )}
                </div>
              </div>
              
              {/* Thumbnail strip */}
              {images && images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                  {images.map((img, idx) => (
                    <button key={idx} onClick={() => setCurrentImageIndex(idx)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden snap-center border-2 transition-all
                        ${idx === currentImageIndex ? 'border-orange-500 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                      <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Details */}
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
                <p className="text-2xl font-black text-rose-500">
                  ৳{formatPrice(price)}
                </p>
                {category === 'house_rent' && <span className="text-sm font-semibold text-gray-400">/month</span>}
              </div>

              {/* Action Buttons for Furniture & Appliances */}
              {(category === 'furniture' || category === 'appliance') && (
                <div className="flex items-center gap-3 mb-8">
                  <button className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <ShoppingBag size={18} /> Buy Now
                  </button>
                  <button className="flex-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                    Add to Cart
                  </button>
                </div>
              )}

              {/* Attributes Grid */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(attributes || {}).map(([key, value]) => {
                    if (!value) return null
                    return (
                      <div key={key} className="p-4 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 flex flex-col">
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{key.replace('_', ' ')}</span>
                        <span className="text-base font-bold text-gray-900 dark:text-white capitalize">{value}</span>
                      </div>
                    )
                  })}
                  {(!attributes || Object.keys(attributes).length === 0) && (
                    <p className="text-gray-500 col-span-2 text-sm">No specific attributes provided.</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-8 flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Description</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                  {description || 'No description provided by the seller.'}
                </p>
              </div>

              {/* Seller Card */}
              <div className="p-5 mt-auto rounded-3xl bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-950/20 dark:to-rose-950/20 border border-orange-100 dark:border-orange-900/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex flex-shrink-0 items-center justify-center shadow-sm">
                      {seller_avatar ? (
                        <img src={seller_avatar} alt={seller_name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="text-gray-500" size={24} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {seller_name}
                        {seller_verified === 1 && (
                          <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck size={12} /> Verified
                          </span>
                        )}
                      </h4>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Seller</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <a href={`tel:${seller_phone || ''}`} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-sm ${!seller_phone ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-none' : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-800'}`}>
                    <Phone size={16} className="text-emerald-500" /> Call
                  </a>
                  <a href={`mailto:${seller_email || ''}`} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-sm ${!seller_email ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-none' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}>
                    <Mail size={16} className={seller_email ? "text-white" : "text-gray-400"} /> Email
                  </a>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
