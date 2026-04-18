import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, MapPin, Home as HomeIcon, ShoppingBag, Bed,
  Bath, Square, CalendarDays, ShieldCheck, Tag, LayoutGrid, UserCheck, Handshake, CheckCircle2,
  SlidersHorizontal, ChevronDown, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getProducts } from '../services/api'

const formatPrice = (price) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(price)

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest first' },
  { value: 'oldest',     label: 'Oldest first' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
]

function SmallProductCard({ product }) {
  const { id, title, location, price, category, main_image, attributes, seller_verified, status } = product
  const isRent = category === 'house_rent'
  
  return (
    <Link to={`/product/${id}`} className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all duration-300 flex flex-col h-full relative">
      <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 relative overflow-hidden flex-shrink-0">
        {main_image ? (
          <img src={main_image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ShoppingBag size={28} className="opacity-50" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full w-fit">
            {category.replace('_', ' ')}
          </span>
          {status === 'sold' && (
            <span className="bg-rose-500 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shadow-md w-fit">SOLD OUT</span>
          )}
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug mb-1 line-clamp-2 min-h-[2.5rem]">{title}</h3>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
          <MapPin size={10} className="text-orange-500 flex-shrink-0" /><span className="truncate">{location}</span>
        </p>
        <div className="flex flex-wrap items-center gap-1 mb-3 text-[10px] font-medium text-gray-500 dark:text-gray-400">
          {attributes?.beds && <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{attributes.beds} Beds</span>}
          {attributes?.baths && <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{attributes.baths} Baths</span>}
          {attributes?.condition && <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{attributes.condition}</span>}
        </div>
        <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
          <p className="text-base font-black text-rose-500">
            ৳{formatPrice(price)}{isRent && <span className="text-[10px] font-semibold text-rose-400">/mo</span>}
          </p>
          {seller_verified === 1 && <ShieldCheck size={14} className="text-emerald-500" />}
        </div>
      </div>
    </Link>
  )
}

export default function Home() {
  const [activeTab,    setActiveTab]    = useState('all')
  const [searchQuery,  setSearchQuery]  = useState('')
  const [sort,         setSort]         = useState('newest')
  const [showFilters,  setShowFilters]  = useState(false)
  const [minPrice,     setMinPrice]     = useState('')
  const [maxPrice,     setMaxPrice]     = useState('')
  const [beds,         setBeds]         = useState('')
  const [condition,    setCondition]    = useState('')
  const [products,     setProducts]     = useState([])
  const [pagination,   setPagination]   = useState({ total: 0, page: 1, pages: 1 })
  const [loading,      setLoading]      = useState(true)
  const PAGE_SIZE = 20

  const tabs = [
    { id: 'all',        label: 'All',         icon: LayoutGrid },
    { id: 'house_sell', label: 'Buy Flat',    icon: HomeIcon },
    { id: 'house_rent', label: 'Rent Flat',   icon: Tag },
    { id: 'furniture',  label: 'Furniture',   icon: Bed },
    { id: 'appliance',  label: 'Appliances',  icon: ShoppingBag },
  ]

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = {
        status: 'approved',
        sort,
        page,
        limit: PAGE_SIZE,
      }
      if (activeTab !== 'all') params.category = activeTab
      if (searchQuery.trim()) params.q = searchQuery.trim()
      if (minPrice) params.minPrice = minPrice
      if (maxPrice) params.maxPrice = maxPrice
      if (beds)     params.beds = beds
      if (condition) params.condition = condition

      const res = await getProducts(params)
      setProducts(res.products || [])
      setPagination(res.pagination || { total: 0, page: 1, pages: 1 })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, searchQuery, sort, minPrice, maxPrice, beds, condition])

  useEffect(() => { fetchProducts(1) }, [fetchProducts])

  const handleSearch = (e) => { e.preventDefault(); fetchProducts(1) }

  const hasFilters = minPrice || maxPrice || beds || condition || sort !== 'newest'
  const clearFilters = () => { setMinPrice(''); setMaxPrice(''); setBeds(''); setCondition(''); setSort('newest') }

  const activeTabLabel = tabs.find(t => t.id === activeTab)?.label || 'All'

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">

        {/* HERO */}
        <section className="bg-white dark:bg-gray-950 overflow-hidden border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
            <div className="text-center max-w-3xl mx-auto animate-slide-up">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-5">
                Find the home<br />that <span className="italic text-orange-500">loves</span> you back.
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-8">
                Bangladesh's most trusted housing marketplace. Rent flats, buy properties, and furnish your home — all from verified owners, zero brokerage.
              </p>

              {/* Search Widget */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-2 mx-auto max-w-2xl">
                {/* Category Tabs */}
                <div className="flex gap-1 mb-2 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-xl overflow-x-auto scrollbar-hide">
                  {tabs.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap
                        ${activeTab === id ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>
                      <Icon size={16} /><span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by location, keyword…"
                      className="input-field pl-11 py-3 text-base rounded-xl" />
                  </div>
                  <button type="submit" className="btn-primary px-5 rounded-xl whitespace-nowrap">Search</button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* LISTINGS */}
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setShowFilters(v => !v)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all
                    ${showFilters || hasFilters ? 'border-orange-400 text-orange-600 bg-orange-50 dark:bg-orange-950/30' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-orange-300'}`}>
                  <SlidersHorizontal size={14} /> Filters
                  {hasFilters && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                </button>
                {hasFilters && (
                  <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                    <X size={12} /> Clear filters
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {pagination.total > 0 && (
                  <span className="text-xs text-gray-400">{pagination.total.toLocaleString()} listings</span>
                )}
                <div className="relative">
                  <select value={sort} onChange={e => setSort(e.target.value)}
                    className="text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none appearance-none pr-8">
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Expanded Filter Panel */}
            {showFilters && (
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 mb-6 animate-slide-up shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Min Price (৳)</label>
                    <input type="number" placeholder="e.g. 5000" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="input-field py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Max Price (৳)</label>
                    <input type="number" placeholder="e.g. 100000" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="input-field py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Bedrooms</label>
                    <select value={beds} onChange={e => setBeds(e.target.value)} className="input-field py-2 text-sm">
                      <option value="">Any</option>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Condition</label>
                    <select value={condition} onChange={e => setCondition(e.target.value)} className="input-field py-2 text-sm">
                      <option value="">Any</option>
                      {['New','Like New','Good','Fair','Poor'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="py-20 flex justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
              </div>
            ) : products.length > 0 ? (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-800 pb-3">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">{activeTabLabel} Listings</h2>
                  <span className="text-sm text-gray-400">{pagination.total} total</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {products.map(prod => <SmallProductCard key={prod.id} product={prod} />)}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button onClick={() => fetchProducts(pagination.page - 1)} disabled={pagination.page <= 1}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-orange-400 hover:text-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white dark:bg-gray-900">
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                        const p = i + 1
                        return (
                          <button key={p} onClick={() => fetchProducts(p)}
                            className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all
                              ${pagination.page === p ? 'bg-orange-500 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-300'}`}>
                            {p}
                          </button>
                        )
                      })}
                    </div>
                    <button onClick={() => fetchProducts(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-orange-400 hover:text-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white dark:bg-gray-900">
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                <ShoppingBag size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No listings found</h3>
                <p className="text-gray-500 text-sm mb-4">Try adjusting your search or filters.</p>
                {hasFilters && <button onClick={clearFilters} className="btn-secondary text-sm py-2 px-5">Clear filters</button>}
              </div>
            )}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="about" className="py-16 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="section-label text-orange-500 font-bold uppercase tracking-wider text-sm mb-2">Simple Process</p>
              <h2 className="section-heading text-3xl font-black text-gray-900 dark:text-white">How Thikana Works</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-sm mx-auto">No brokers, no hidden costs — just trust and transparency.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Search,       color: 'bg-orange-100 dark:bg-orange-950/50 text-orange-500',    num: '01', title: 'Search & Filter',  desc: 'Browse verified listings by price, location, and type.' },
                { icon: UserCheck,    color: 'bg-blue-100 dark:bg-blue-950/50 text-blue-500',          num: '02', title: 'Verify & Trust',   desc: 'NID-verified listings and trust badges ensure authenticity.' },
                { icon: Handshake,    color: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-500', num: '03', title: 'Connect Directly', desc: 'Message owners directly, schedule visits — zero brokerage.' },
                { icon: CheckCircle2, color: 'bg-purple-100 dark:bg-purple-950/50 text-purple-500',    num: '04', title: 'Move In & Shop',   desc: 'Finalize your home and furnish it — one trusted platform.' },
              ].map(({ icon: Icon, color, num, title, desc }) => (
                <div key={num} className="group p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-900 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                  <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={20} />
                  </div>
                  <p className="text-gray-200 dark:text-gray-700 text-4xl font-black mb-1 select-none">{num}</p>
                  <h3 className="text-gray-900 dark:text-white font-bold text-sm mb-2">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
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

