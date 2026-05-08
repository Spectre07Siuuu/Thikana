import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, MapPin, ShoppingBag,
  ShieldCheck, Handshake, PackageCheck,
  UserCheck, CheckCircle2,
  SlidersHorizontal, ChevronDown, X, ChevronLeft, ChevronRight, Heart, ArrowUpRight, ArrowRight,
  Building2, KeyRound, Sofa, Tv,
} from 'lucide-react'
import { useRef } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getProducts, toggleFavourite, getFavouriteStatus, getPublicStats } from '../services/api'
import { useAuth } from '../context/AuthContext'

function BlurText({ text, className }) {
  const words = text.split(' ')
  return (
    <p className={`flex flex-wrap ${className}`} style={{ rowGap: '0.1em' }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: 'blur(10px)', opacity: 0, y: 50 }}
          whileInView={{ filter: ['blur(10px)', 'blur(5px)', 'blur(0px)'], opacity: [0, 0.5, 1], y: [50, -5, 0] }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.7, times: [0, 0.5, 1], ease: 'easeOut', delay: (i * 100) / 1000 }}
          style={{ display: 'inline-block', marginRight: '0.28em' }}
        >
          {word}
        </motion.span>
      ))}
    </p>
  )
}

const formatPrice = (price) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(price)

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
]

const CAT_SUBTITLES = {
  house_sell: 'Exclusive homes and properties ready for new owners.',
  house_rent: 'Flexible living spaces in prime locations across Bangladesh.',
  furniture: 'Curated pieces to transform your house into a home.',
  appliance: 'Upgrade your daily life with trusted brands.',
}

function SmallProductCard({ product }) {
  const { id, title, location, price, category, main_image, attributes, seller_verified, status } = product
  const isRent = category === 'house_rent'
  const [isLiked, setIsLiked] = useState(Boolean(product.is_favourited))
  const { user } = useAuth()

  useEffect(() => {
    if (product.is_favourited !== undefined) {
      setIsLiked(Boolean(product.is_favourited))
      return
    }
    if (user && user.role === 'buyer') {
      getFavouriteStatus(id)
        .then(res => { if (res.success) setIsLiked(res.saved) })
        .catch(() => { })
    }
  }, [id, product.is_favourited, user])

  const handleToggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return alert('Please log in to save favourites.')
    if (user.role !== 'buyer') return alert('Only buyers can save favourites.')

    const prev = isLiked
    setIsLiked(!prev)
    try {
      const res = await toggleFavourite(id)
      if (!res.success) setIsLiked(prev)
    } catch (err) {
      setIsLiked(prev)
    }
  }

  return (
    <Link to={`/product/${id}`}
      className="group bg-theme-card rounded-[28px] overflow-hidden border border-theme-border
        hover:shadow-xl hover:shadow-theme-primary/10 dark:hover:shadow-theme-primary/8
        hover:border-theme-primary/25 hover:-translate-y-1
        transition-all duration-500 ease-out flex flex-col">

      {/* Image */}
      <div className="relative overflow-hidden h-48 flex-shrink-0 bg-theme-bg">
        {main_image ? (
          <img src={main_image} alt={title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-theme-muted">
            <ShoppingBag size={32} className="opacity-30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Category + sold badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <span className="bg-white/90 dark:bg-black/50 backdrop-blur text-theme-text dark:text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full w-fit border border-theme-border/50 shadow-sm">
            {category.replaceAll('_', ' ')}
          </span>
          {status === 'sold' && (
            <span className="bg-rose-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-full shadow w-fit border border-rose-400/30">SOLD</span>
          )}
        </div>

        {/* Heart button */}
        <button
          onClick={handleToggle}
          className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center
            transition-all duration-300 backdrop-blur-xl border
            ${isLiked
              ? 'bg-rose-500/90 border-rose-400/30 text-white scale-100 opacity-100'
              : 'bg-black/30 border-white/10 text-white opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 hover:bg-rose-500/80'}`}
          aria-label="Save listing"
        >
          <Heart size={14} className={isLiked ? 'fill-current' : ''} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 lg:p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-theme-text text-sm leading-snug line-clamp-2 group-hover:text-theme-primary transition-colors duration-300">{title}</h3>
          {seller_verified === 1 && (
            <span className="flex-shrink-0 mt-0.5 bg-emerald-50 dark:bg-emerald-950/50 p-1 rounded-full" title="Verified Seller">
              <ShieldCheck size={12} className="text-emerald-500" />
            </span>
          )}
        </div>

        <p className="text-[11px] text-theme-muted mb-3 flex items-center gap-1">
          <MapPin size={10} className="text-theme-primary flex-shrink-0" />
          <span className="truncate">{location}</span>
        </p>

        <div className="flex flex-wrap items-center gap-1.5 mb-auto text-[10px] font-medium">
          {attributes?.beds && <span className="glass-tag">{attributes.beds} Beds</span>}
          {attributes?.baths && <span className="glass-tag">{attributes.baths} Baths</span>}
          {attributes?.condition && <span className="glass-tag">{attributes.condition}</span>}
        </div>

        {/* Price row */}
        <div className="mt-4 pt-3 border-t border-theme-border/60 flex items-center justify-between">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs font-medium text-theme-muted">৳</span>
            <span className="font-black text-xl text-theme-primary leading-none">{formatPrice(price)}</span>
            {isRent && <span className="text-[10px] font-semibold text-theme-muted uppercase ml-0.5">/mo</span>}
          </div>
          <div className="w-8 h-8 rounded-full border border-theme-border flex items-center justify-center text-theme-muted
            group-hover:border-theme-primary group-hover:text-theme-primary group-hover:bg-theme-primary/10 transition-all duration-300">
            <ArrowUpRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  // categoryPages tracks { [catId]: pageNumber } — absent means collapsed (show 6)
  const [categoryPages, setCategoryPages] = useState({})
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [beds, setBeds] = useState('')
  const [condition, setCondition] = useState('')
  const [products, setProducts] = useState([])
  const [publicStats, setPublicStats] = useState({ verified_sellers: '--', total_products: '--' })
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(null)
  const categoryRefs = useRef({})

  const categories = [
    { id: 'house_sell', label: 'Properties for Sale', shortLabel: 'For Sale', icon: Building2 },
    { id: 'house_rent', label: 'Properties to Rent', shortLabel: 'For Rent', icon: KeyRound },
    { id: 'furniture', label: 'Premium Furniture', shortLabel: 'Furniture', icon: Sofa },
    { id: 'appliance', label: 'Home Appliances', shortLabel: 'Appliances', icon: Tv },
  ]

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = {
        status: 'approved',
        sort,
        page,
        limit: 100,
      }
      if (searchQuery.trim()) params.q = searchQuery.trim()
      if (minPrice) params.minPrice = minPrice
      if (maxPrice) params.maxPrice = maxPrice
      if (beds) params.beds = beds
      if (condition) params.condition = condition

      const res = await getProducts(params)
      setProducts(res.products || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, sort, minPrice, maxPrice, beds, condition])

  useEffect(() => { fetchProducts(1) }, [fetchProducts])

  useEffect(() => {
    getPublicStats().then(res => {
      if (res.success) setPublicStats(res)
    }).catch(() => {})
  }, [])

  // IntersectionObserver to auto-highlight the active category as user scrolls
  useEffect(() => {
    const observers = []
    categories.forEach(cat => {
      const el = document.getElementById(cat.id)
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveCategory(cat.id)
        },
        { rootMargin: '-120px 0px -60% 0px', threshold: 0.1 }
      )
      observer.observe(el)
      observers.push(observer)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [products])

  const scrollToCategory = (catId) => {
    const el = document.getElementById(catId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveCategory(catId)
    }
  }

  const handleSearch = (e) => { e.preventDefault(); fetchProducts(1) }

  const hasFilters = minPrice || maxPrice || beds || condition || sort !== 'newest'
  const clearFilters = () => { setMinPrice(''); setMaxPrice(''); setBeds(''); setCondition(''); setSort('newest') }

  return (
    <>
      <Navbar />
      <div className="bg-theme-bg transition-colors duration-200">

        {/* ── HERO ── */}
        <section className="relative w-full min-h-screen flex flex-col overflow-hidden">
          {/* Gradient base */}
          <div
            className="absolute inset-0 z-0"
            style={{
              background: 'linear-gradient(135deg, rgb(var(--hero-grad-from)) 0%, rgb(var(--hero-grad-mid)) 50%, rgb(var(--hero-grad-to)) 100%)'
            }}
          />

          {/* Decorative liquid-glass blobs */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Large soft blob top-right */}
            <div
              style={{
                position: 'absolute', width: '55vw', height: '55vw',
                top: '-18%', right: '-15%',
                borderRadius: '40% 60% 55% 45% / 50% 45% 55% 50%',
                background: 'rgb(var(--glass-blob-1) / 0.22)',
                filter: 'blur(60px)',
              }}
            />
            {/* Medium blob bottom-left */}
            <div
              style={{
                position: 'absolute', width: '38vw', height: '38vw',
                bottom: '-12%', left: '-8%',
                borderRadius: '60% 40% 45% 55% / 45% 60% 40% 55%',
                background: 'rgb(var(--glass-blob-2) / 0.28)',
                filter: 'blur(50px)',
              }}
            />
            {/* Small accent blob center */}
            <div
              style={{
                position: 'absolute', width: '22vw', height: '22vw',
                top: '30%', left: '40%',
                borderRadius: '50% 50% 40% 60% / 60% 40% 60% 40%',
                background: 'rgb(var(--glass-blob-1) / 0.12)',
                filter: 'blur(40px)',
              }}
            />
            {/* Glass grid overlay */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center justify-center flex-1" style={{ paddingTop: 'calc(64px + 2.5rem)', paddingBottom: '2.5rem' }}>
            <div className="flex flex-col items-center text-center w-full">

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-serif leading-[0.9] text-white max-w-4xl tracking-[-2px] sm:tracking-[-3px] mb-6">
                <span className="block animate-title-1">Find the home that</span>
                <span className="block animate-title-2 italic">
                  <span className="text-gold-shimmer">loves</span>
                  <span className="text-white"> you back.</span>
                </span>
              </h1>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, ease: 'easeOut' }}
                className="text-white/75 text-base md:text-lg font-body font-light leading-relaxed max-w-xl mx-auto mb-8"
              >
                Bangladesh’s most trusted housing marketplace. Rent flats, buy properties, and furnish your home — all from verified sellers, zero brokerage.
              </motion.p>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.82, ease: 'easeOut' }}
                className="w-full max-w-2xl mb-6"
              >
                <div className="liquid-glass rounded-full p-1.5 w-full flex items-center">
                  <form onSubmit={handleSearch} className="flex gap-2 w-full items-center">
                    <div className="flex-1 flex items-center gap-3 px-4">
                      <Search size={18} className="text-white/60 flex-shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by location, keyword…"
                        className="w-full border-none focus:ring-0 bg-transparent text-base text-white placeholder-white/40 py-2.5 focus:outline-none font-body"
                      />
                      {searchQuery && (
                        <button type="button" onClick={() => { setSearchQuery(''); fetchProducts(1) }}
                          className="text-white/60 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
                          aria-label="Clear search">
                          <X size={15} />
                        </button>
                      )}
                    </div>
                    <button type="submit"
                      className="font-bold px-7 py-3 rounded-full text-sm whitespace-nowrap transition-all active:scale-95 flex items-center gap-2"
                      style={{ background: 'rgb(var(--theme-primary))', color: 'rgb(var(--theme-primary-text))' }}
                    >
                      Search <ArrowRight size={15} />
                    </button>
                  </form>
                </div>
              </motion.div>

              {/* Trending chips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.8 }}
                className="flex flex-wrap justify-center items-center gap-2 mb-5"
              >
                <span className="text-white/50 text-xs font-medium font-body mr-1">Trending:</span>
                {['Gulshan', 'Uttara', 'Sofa', 'Samsung', 'Bashundhara', 'Hatil'].map(chip => (
                  <button
                    key={chip}
                    onClick={() => { setSearchQuery(chip); fetchProducts(1) }}
                    className="liquid-glass px-3 py-1.5 hover:bg-white/15 text-white/80 hover:text-white text-xs font-medium rounded-full transition-all duration-200 hover:scale-105 active:scale-95 font-body"
                  >
                    {chip}
                  </button>
                ))}
              </motion.div>

              {/* Stats row — INLINE, no overlap */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.15, ease: 'easeOut' }}
                className="flex flex-wrap justify-center items-stretch gap-3 w-full max-w-2xl"
              >
                {/* Verified Sellers */}
                <div
                  className="flex items-center gap-3 flex-1 min-w-[150px] px-5 py-4 rounded-2xl"
                  style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <ShieldCheck className="h-6 w-6 flex-shrink-0" style={{ color: 'rgb(var(--theme-primary))' }} />
                  <div className="text-left">
                    <div className="font-heading font-bold text-white text-2xl leading-none">{publicStats.verified_sellers}</div>
                    <div className="text-[11px] font-body font-light mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>Verified Sellers</div>
                  </div>
                </div>

                {/* Live Listings */}
                <div
                  className="flex items-center gap-3 flex-1 min-w-[150px] px-5 py-4 rounded-2xl"
                  style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <PackageCheck className="h-6 w-6 flex-shrink-0" style={{ color: 'rgb(var(--theme-primary))' }} />
                  <div className="text-left">
                    <div className="font-heading font-bold text-white text-2xl leading-none">{publicStats.total_products}</div>
                    <div className="text-[11px] font-body font-light mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>Live Listings</div>
                  </div>
                </div>

                {/* Brokerage Fee */}
                <div
                  className="flex items-center gap-3 flex-1 min-w-[150px] px-5 py-4 rounded-2xl"
                  style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <Handshake className="h-6 w-6 flex-shrink-0" style={{ color: 'rgb(var(--theme-primary))' }} />
                  <div className="text-left">
                    <div className="font-heading font-bold text-white text-2xl leading-none">0 BDT</div>
                    <div className="text-[11px] font-body font-light mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>Brokerage Fee</div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>




        {/* STICKY CATEGORY QUICK-NAV */}
        <nav className="sticky top-16 z-30 bg-theme-bg/80 backdrop-blur-xl border-b border-theme-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3">
              {categories.map(cat => {
                const Icon = cat.icon
                const catProducts = products.filter(p => p.category === cat.id)
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300
            ${isActive
                        ? 'bg-theme-primary text-theme-primary-text shadow-lg shadow-theme-primary/20'
                        : 'text-theme-muted hover:text-theme-text hover:bg-theme-card border border-transparent hover:border-theme-border'}`}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{cat.shortLabel}</span>
                    <span className="sm:hidden">{cat.shortLabel}</span>
                    {catProducts.length > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center transition-colors duration-300
             ${isActive ? 'bg-white/20 text-theme-primary-text' : 'bg-theme-bg text-theme-muted'}`}>
                        {catProducts.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </nav>

        {/* LISTINGS */}
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setShowFilters(v => !v)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all
          ${showFilters || hasFilters ? 'border-theme-primary/50 text-theme-primary-hover bg-theme-primary/10 dark:bg-orange-950/30' : 'border-theme-border text-theme-muted bg-theme-card hover:border-orange-300'}`}>
                  <SlidersHorizontal size={14} /> Filters
                  {hasFilters && <span className="w-2 h-2 rounded-full bg-theme-primary" />}
                </button>
                {hasFilters && (
                  <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-theme-muted hover:text-red-500 transition-colors">
                    <X size={12} /> Clear filters
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {products.length > 0 && (
                  <span className="text-xs text-theme-muted">{products.length.toLocaleString()} listings</span>
                )}
                <div className="relative">
                  <select value={sort} onChange={e => setSort(e.target.value)}
                    className="text-sm border border-theme-border rounded-xl px-3 py-2 glass-panel text-theme-text focus:outline-none appearance-none pr-8 cursor-pointer">
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Expanded Filter Panel */}
            {showFilters && (
              <div className="glass-panel p-5 mb-6 animate-slide-up">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="filter-min-price" className="block text-xs font-semibold text-theme-muted mb-1.5">Min Price (৳)</label>
                    <input id="filter-min-price" type="number" placeholder="e.g. 5000" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="input-field py-2 text-sm" />
                  </div>
                  <div>
                    <label htmlFor="filter-max-price" className="block text-xs font-semibold text-theme-muted mb-1.5">Max Price (৳)</label>
                    <input id="filter-max-price" type="number" placeholder="e.g. 100000" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="input-field py-2 text-sm" />
                  </div>
                  <div>
                    <label htmlFor="filter-beds" className="block text-xs font-semibold text-theme-muted mb-1.5">Bedrooms</label>
                    <select id="filter-beds" value={beds} onChange={e => setBeds(e.target.value)} className="input-field py-2 text-sm">
                      <option value="">Any</option>
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="filter-condition" className="block text-xs font-semibold text-theme-muted mb-1.5">Condition</label>
                    <select id="filter-condition" value={condition} onChange={e => setCondition(e.target.value)} className="input-field py-2 text-sm">
                      <option value="">Any</option>
                      {['New', 'Like New', 'Good', 'Fair', 'Poor'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="space-y-12 animate-fade-in">
                {[1, 2].map(section => (
                  <div key={section}>
                    {/* Skeleton Section Header */}
                    <div className="flex items-end justify-between mb-8">
                      <div>
                        <div className="h-7 w-48 bg-theme-border/60 rounded-lg animate-pulse mb-2" />
                        <div className="h-4 w-64 bg-theme-border/40 rounded-md animate-pulse" />
                      </div>
                      <div className="h-5 w-20 bg-theme-border/30 rounded-full animate-pulse" />
                    </div>
                    {/* Skeleton Cards Grid — vertical card shape */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-theme-card rounded-[28px] overflow-hidden border border-theme-border flex flex-col">
                          {/* Skeleton Image */}
                          <div className="bg-theme-border/30 h-48 relative overflow-hidden">
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                          </div>
                          {/* Skeleton Content */}
                          <div className="p-4 flex flex-col flex-1">
                            <div className="h-4 w-4/5 bg-theme-border/50 rounded-md mb-2 animate-pulse" />
                            <div className="h-3 w-3/5 bg-theme-border/30 rounded-md mb-3 animate-pulse" />
                            <div className="flex gap-1.5 mb-auto">
                              <div className="h-5 w-14 bg-theme-border/30 rounded-md animate-pulse" />
                              <div className="h-5 w-14 bg-theme-border/30 rounded-md animate-pulse" />
                            </div>
                            <div className="mt-4 pt-3 border-t border-theme-border/40 flex items-center justify-between">
                              <div className="h-7 w-28 bg-theme-primary/10 rounded-md animate-pulse" />
                              <div className="h-8 w-8 bg-theme-border/30 rounded-full animate-pulse" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="animate-fade-in space-y-16">
                {categories.map(cat => {
                  const catProducts = products.filter(p => p.category === cat.id);
                  if (catProducts.length === 0) return null;

                  const currentPage = categoryPages[cat.id]; // undefined if collapsed
                  const isExpanded = currentPage !== undefined;
                  const itemsPerPage = 12;

                  const visibleProducts = isExpanded
                    ? catProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    : catProducts.slice(0, 6);

                  const totalPages = Math.ceil(catProducts.length / itemsPerPage);

                  return (
                    <section key={cat.id} id={cat.id} className="scroll-mt-24">
                      {/* Section header — inspiration style */}
                      <div className="flex items-end justify-between mb-8">
                        <div>
                          <h2 className="text-2xl font-black text-theme-text">{cat.label}</h2>
                          <p className="text-theme-muted text-sm mt-1">{CAT_SUBTITLES[cat.id]}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {!isExpanded && catProducts.length > 6 && (
                            <button onClick={() => setCategoryPages(prev => ({ ...prev, [cat.id]: 1 }))}
                              className="text-theme-primary text-sm font-semibold flex items-center gap-1 hover:underline transition-all">
                              View All <ArrowRight size={14} />
                            </button>
                          )}
                          <span className="text-xs font-bold text-theme-primary bg-theme-primary/10 dark:bg-orange-950/40 px-3 py-1.5 rounded-full border border-theme-primary/20">{catProducts.length} listings</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
                        {visibleProducts.map((prod) => (
                          <div key={prod.id} className="col-span-1">
                            <SmallProductCard product={prod} />
                          </div>
                        ))}
                      </div>

                      {/* In-category Pagination */}
                      {isExpanded && totalPages > 1 && (
                        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                          <button
                            onClick={() => setCategoryPages(prev => ({ ...prev, [cat.id]: Math.max(1, currentPage - 1) }))}
                            disabled={currentPage === 1}
                            className="p-2.5 rounded-xl border border-theme-border text-theme-text hover:bg-theme-card disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <ChevronLeft size={18} />
                          </button>

                          {[...Array(totalPages)].map((_, i) => {
                            const p = i + 1;
                            if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                              return (
                                <button
                                  key={p}
                                  onClick={() => setCategoryPages(prev => ({ ...prev, [cat.id]: p }))}
                                  className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === p
                                    ? 'bg-theme-primary text-white shadow-lg'
                                    : 'bg-theme-card border border-theme-border text-theme-muted hover:border-theme-primary hover:text-theme-primary'}`}
                                >
                                  {p}
                                </button>
                              )
                            }
                            if (p === currentPage - 2 || p === currentPage + 2) {
                              return <span key={p} className="text-theme-muted px-1">...</span>;
                            }
                            return null;
                          })}

                          <button
                            onClick={() => setCategoryPages(prev => ({ ...prev, [cat.id]: Math.min(totalPages, currentPage + 1) }))}
                            disabled={currentPage === totalPages}
                            className="p-2.5 rounded-xl border border-theme-border text-theme-text hover:bg-theme-card disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <ChevronRight size={18} />
                          </button>

                          <button
                            onClick={() => setCategoryPages(prev => {
                              const newState = { ...prev };
                              delete newState[cat.id];
                              return newState;
                            })}
                            className="ml-4 text-xs font-bold text-rose-500 hover:underline uppercase tracking-wider"
                          >
                            Collapse
                          </button>
                        </div>
                      )}
                    </section>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-theme-card rounded-3xl border border-theme-border">
                <ShoppingBag size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                <h3 className="text-lg font-bold text-theme-text mb-2">No listings found</h3>
                <p className="text-theme-muted text-sm mb-4">Try adjusting your search or filters.</p>
                {hasFilters && <button onClick={clearFilters} className="btn-secondary text-sm py-2 px-5">Clear filters</button>}
              </div>
            )}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="about" className="py-20 bg-theme-card/50 border-t border-theme-border relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-14">
              <p className="section-label text-theme-primary font-bold uppercase tracking-wider text-sm mb-2">Simple Process</p>
              <h2 className="font-serif text-3xl lg:text-4xl text-theme-text">How Thikana Works</h2>
              <p className="text-theme-muted text-sm mt-3 max-w-md mx-auto leading-relaxed">No brokers, no hidden costs — just trust and transparency.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {/* Connecting line (desktop only) */}
              <div className="hidden lg:block absolute top-[72px] left-[12%] right-[12%] h-px border-t-2 border-dashed border-theme-border z-0" />
              {[
                { icon: Search, color: 'bg-theme-primary/15 dark:bg-orange-950/50 text-theme-primary', hoverColor: 'group-hover:bg-theme-primary group-hover:text-white', num: '01', title: 'Search & Filter', desc: 'Browse verified listings by price, location, and type.' },
                { icon: UserCheck, color: 'bg-blue-100 dark:bg-blue-950/50 text-blue-500', hoverColor: 'group-hover:bg-blue-500 group-hover:text-white', num: '02', title: 'Verify & Trust', desc: 'NID-verified listings and trust badges ensure authenticity.' },
                { icon: Handshake, color: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-500', hoverColor: 'group-hover:bg-emerald-500 group-hover:text-white', num: '03', title: 'Connect Directly', desc: 'Message sellers directly, schedule visits — zero brokerage.' },
                { icon: CheckCircle2, color: 'bg-purple-100 dark:bg-purple-950/50 text-purple-500', hoverColor: 'group-hover:bg-purple-500 group-hover:text-white', num: '04', title: 'Move In & Shop', desc: 'Finalize your home and furnish it — one trusted platform.' },
              ].map(({ icon: Icon, color, hoverColor, num, title, desc }, idx) => (
                <div key={num}
                  className="group relative z-10 p-6 rounded-[28px] bg-theme-card border border-theme-border
           hover:border-theme-primary/30 dark:hover:border-orange-900
           hover:shadow-xl hover:shadow-theme-primary/5 dark:hover:shadow-theme-primary/10
           transition-all duration-500 hover:-translate-y-1"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className={`w-14 h-14 ${color} ${hoverColor} rounded-2xl flex items-center justify-center mb-5
           group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm`}>
                    <Icon size={22} />
                  </div>
                  <p className="text-theme-border text-5xl font-black mb-2 leading-none group-hover:text-theme-primary/20 transition-colors duration-500">{num}</p>
                  <h3 className="text-theme-text font-bold text-base mb-2 group-hover:text-theme-primary transition-colors duration-300">{title}</h3>
                  <p className="text-theme-muted text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  )
}
