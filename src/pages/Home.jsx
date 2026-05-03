import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, MapPin, ShoppingBag,
  ShieldCheck, UserCheck, Handshake, CheckCircle2,
  SlidersHorizontal, ChevronDown, X, ChevronLeft, ChevronRight, Heart, ArrowUpRight, ArrowRight,
  Building2, KeyRound, Sofa, Tv,
} from 'lucide-react'
import { useRef } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getProducts, toggleFavourite, getFavouriteStatus } from '../services/api'
import { useAuth } from '../context/AuthContext'

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
        .catch(() => {})
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

        <div className="flex flex-wrap items-center gap-1.5 mb-auto text-[10px] font-medium text-theme-muted">
          {attributes?.beds && <span className="bg-theme-bg px-2 py-0.5 rounded-md border border-theme-border">{attributes.beds} Beds</span>}
          {attributes?.baths && <span className="bg-theme-bg px-2 py-0.5 rounded-md border border-theme-border">{attributes.baths} Baths</span>}
          {attributes?.condition && <span className="bg-theme-bg px-2 py-0.5 rounded-md border border-theme-border">{attributes.condition}</span>}
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
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })
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
      setPagination(res.pagination || { total: 0, page: 1, pages: 1 })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, sort, minPrice, maxPrice, beds, condition])

  useEffect(() => { fetchProducts(1) }, [fetchProducts])

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
      <div className="pt-16 min-h-screen bg-theme-bg transition-colors duration-200">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden border-b border-theme-border bg-theme-bg">
          {/* Subtle decorative gradient blob (light mode) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-theme-primary/5 dark:bg-theme-primary/8 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-blue-500/4 dark:bg-blue-500/6 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

              {/* Left — copy & search */}
              <div className="space-y-6 lg:space-y-7 animate-slide-up">
                {/* Badge pill */}
                <div className="inline-flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 rounded-full text-[10px] font-bold text-theme-primary uppercase tracking-wider border border-theme-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-primary animate-pulse" />
                  New Listings Available
                </div>

                {/* Headline — serif font for editorial feel */}
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.1] text-theme-text">
                  Find the home that{' '}
                  <em className="italic text-theme-primary not-italic" style={{ fontStyle: 'italic' }}>loves</em>{' '}
                  you back.
                </h1>

                <p className="text-theme-muted text-base lg:text-lg leading-relaxed max-w-md">
                  Bangladesh's most trusted housing marketplace. Rent flats, buy properties, and furnish your home — all from verified sellers, zero brokerage.
                </p>

                {/* Search bar */}
                <div className="max-w-lg">
                  <div className="flex items-center bg-theme-card border border-theme-border rounded-full p-1.5 shadow-sm focus-within:shadow-md focus-within:border-theme-primary/40 transition-all">
                    <form onSubmit={handleSearch} className="flex gap-2 w-full items-center">
                      <div className="relative flex-1 flex items-center gap-3 px-4">
                        <Search size={18} className="text-theme-muted flex-shrink-0" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search by location, keyword…"
                          className="w-full border-none focus:ring-0 bg-transparent text-sm text-theme-text placeholder-theme-muted py-2 focus:outline-none"
                        />
                        {searchQuery && (
                          <button type="button" onClick={() => { setSearchQuery(''); fetchProducts(1) }}
                            className="text-theme-muted hover:text-theme-text p-1 rounded-full hover:bg-theme-bg transition-colors"
                            aria-label="Clear search">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      <button type="submit"
                        className="bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-text font-bold px-7 py-2.5 rounded-full text-sm whitespace-nowrap transition-all active:scale-95 shadow-sm">
                        Search
                      </button>
                    </form>
                  </div>
                </div>

                {/* Trending chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-theme-muted text-xs font-medium">Trending:</span>
                  {['Gulshan', 'Uttara', 'Sofa', 'Samsung', 'Bashundhara', 'Hatil'].map(chip => (
                    <button
                      key={chip}
                      onClick={() => { setSearchQuery(chip); fetchProducts(1) }}
                      className="px-3 py-1.5 bg-theme-card hover:bg-theme-primary/10 border border-theme-border hover:border-theme-primary/40
                        text-theme-muted hover:text-theme-primary text-xs font-medium rounded-full
                        transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Stat chips */}
                <div className="flex items-center gap-6 pt-1">
                  {[
                    { num: '100+', label: 'Verified Listings' },
                    { num: '0%', label: 'Brokerage Fee' },
                    { num: '24/7', label: 'Support' },
                  ].map(stat => (
                    <div key={stat.label} className="flex items-center gap-1.5">
                      <span className="text-theme-text font-black text-sm">{stat.num}</span>
                      <span className="text-[11px] font-medium text-theme-muted">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — hero image */}
              <div className="relative hidden lg:block">
                <div className="rounded-[40px] overflow-hidden relative max-h-[520px] aspect-[4/5]">
                  <img
                    src="/hero_luxury.png"
                    alt="Luxury Home"
                    className="w-full h-full object-cover object-center"
                  />
                  {/* Image gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
                </div>
                {/* Floating badge overlay */}
                <div className="absolute bottom-8 left-8 right-8 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl flex items-center gap-4 border border-white/20 dark:border-white/10">
                  <div className="bg-emerald-100 dark:bg-emerald-950/50 p-2.5 rounded-xl flex-shrink-0">
                    <ShieldCheck size={22} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-theme-text">Verified Listings</p>
                    <p className="text-[11px] text-theme-muted">NID-verified sellers · Zero brokerage</p>
                  </div>
                </div>
              </div>

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
                {pagination.total > 0 && (
                  <span className="text-xs text-theme-muted">{pagination.total.toLocaleString()} listings</span>
                )}
                <div className="relative">
                  <select value={sort} onChange={e => setSort(e.target.value)}
                    className="text-sm border border-theme-border rounded-xl px-3 py-2 bg-theme-card text-gray-700 dark:text-gray-300 focus:outline-none appearance-none pr-8">
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Expanded Filter Panel */}
            {showFilters && (
              <div className="bg-theme-card border border-theme-border rounded-2xl p-5 mb-6 animate-slide-up shadow-sm">
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
