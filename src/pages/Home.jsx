import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, MapPin, Home as HomeIcon, ShoppingBag, Bed,
  Bath, Square, CalendarDays, ShieldCheck, Tag, LayoutGrid, UserCheck, Handshake, CheckCircle2
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getProducts } from '../services/api'

// Helper to format currency
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(price)
}

// Helper to format date
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * ─────────────────────────────────────────────────────────
 * SMALL PRODUCT CARD
 * ─────────────────────────────────────────────────────────
 */
function SmallProductCard({ product }) {
  const { id, title, location, price, category, main_image, attributes, seller_verified, status } = product
  const isRent = category === 'house_rent'
  
  return (
    <Link to={`/product/${id}`} className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all duration-300 flex flex-col h-full relative">
      {/* Image Area */}
      <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 relative overflow-hidden flex-shrink-0">
        {main_image ? (
          <img src={main_image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ShoppingBag size={28} className="opacity-50" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full w-fit">
            {category.replace('_', ' ')}
          </span>
          {status === 'sold' && (
            <span className="bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md w-fit">
              SOLD OUT
            </span>
          )}
        </div>
      </div>

      {/* Details Area */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug mb-1 line-clamp-2 min-h-[2.5rem]">
          {title}
        </h3>
        
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
          <MapPin size={10} className="text-orange-500 flex-shrink-0" />
          <span className="truncate">{location}</span>
        </p>

        {/* Micro Attributes */}
        <div className="flex flex-wrap items-center gap-1 mb-3 text-[10px] font-medium text-gray-500 dark:text-gray-400">
          {attributes?.beds && <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[10px]">{attributes.beds} Beds</span>}
          {attributes?.baths && <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[10px]">{attributes.baths} Baths</span>}
          {attributes?.condition && <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[10px]">{attributes.condition}</span>}
        </div>

        <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
          <p className="text-base font-black text-rose-500">
            ৳{formatPrice(price)}
            {isRent && <span className="text-[10px] font-semibold text-rose-400">/mo</span>}
          </p>
          {seller_verified === 1 && (
            <div className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-500" title="Verified Seller" />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}


/**
 * ─────────────────────────────────────────────────────────
 * HOME PAGE
 * ─────────────────────────────────────────────────────────
 */
export default function Home() {
  const [activeTab,   setActiveTab]   = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const tabs = [
    { id: 'all',        label: 'All',         icon: LayoutGrid },
    { id: 'house_sell', label: 'Buy Flat',    icon: HomeIcon },
    { id: 'house_rent', label: 'Rent Flat',   icon: Tag },
    { id: 'furniture',  label: 'Furniture',   icon: Bed },
    { id: 'appliance',  label: 'Appliances',  icon: ShoppingBag },
  ]

  useEffect(() => {
    fetchProducts()
  }, []) // Fetch all products once, we will filter locally or via API. Let's do local filtering for speed if dataset is small.

  const fetchProducts = async () => {
    setLoading(true)
    try {
      // Fetch all approved products and sold products
      const res = await getProducts() 
      // getProducts without args fetches all products of all statuses and categories. We should filter approved/sold in frontend or pass status=approved
      // but users can mark as sold, meaning status=sold is fine as well. Let's filter locally to approved and sold.
      const valid = (res.products || []).filter(p => p.status === 'approved' || p.status === 'sold')
      setProducts(valid)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Very rudimentary search filtering
  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">

        {/* HERO */}
        <section className="bg-white dark:bg-gray-950 overflow-hidden border-b border-gray-100 dark:border-gray-800" aria-labelledby="hero-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
            <div className="text-center max-w-3xl mx-auto animate-slide-up">
              <h1 id="hero-heading" className="text-4xl sm:text-5xl lg:text-6xl font-black
                text-gray-900 dark:text-white leading-tight mb-5">
                Find the home<br />
                that <span className="italic text-orange-500">loves</span> you back.
              </h1>
              
              <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-8">
                Bangladesh's most trusted housing marketplace. Rent flats, buy properties,
                and furnish your home — all from verified owners, zero brokerage.
              </p>

              {/* Central Search Widget */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
                rounded-2xl shadow-xl p-2 mx-auto max-w-2xl">
                {/* Tabs */}
                <div className="flex gap-1 mb-2 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-xl overflow-x-auto scrollbar-hide">
                  {tabs.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
                        text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                          activeTab === id
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                    >
                      <Icon size={16} /><span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
                <form onSubmit={e => e.preventDefault()} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type="text" value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by location, keyword…"
                      className="input-field pl-11 py-3 text-base rounded-xl" aria-label="Search" />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* DYNAMIC LISTINGS FEED */}
        <section className="py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="py-20 flex justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="animate-fade-in flex flex-col gap-12">
                {activeTab === 'all' ? (
                  tabs.filter(t => t.id !== 'all').map(tab => {
                    const categoryProducts = filteredProducts.filter(p => p.category === tab.id);
                    if (categoryProducts.length === 0) return null;
                    return (
                      <div key={tab.id} id={tab.id} className="category-section scroll-mt-24">
                        <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-800 pb-3">
                          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white capitalize flex items-center gap-2">
                            <span className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 text-orange-500 rounded-lg flex items-center justify-center">
                              <tab.icon size={18} />
                            </span>
                            {tab.label}
                          </h2>
                          <button onClick={() => setActiveTab(tab.id)} className="text-sm font-semibold text-orange-500 hover:underline">
                            View All →
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {categoryProducts.slice(0, 5).map(prod => (
                            <SmallProductCard key={prod.id} product={prod} />
                          ))}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white capitalize">
                        {tabs.find(t => t.id === activeTab)?.label} Listings
                      </h2>
                      <span className="text-sm font-semibold text-gray-500 bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full">
                        {filteredProducts.filter(p => p.category === activeTab).length} Results
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {filteredProducts.filter(p => p.category === activeTab).map(prod => (
                        <SmallProductCard key={prod.id} product={prod} />
                      ))}
                    </div>
                    {filteredProducts.filter(p => p.category === activeTab).length === 0 && (
                      <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 col-span-full">
                        <ShoppingBag size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No listings found</h3>
                        <p className="text-gray-500 text-sm">Be the first to upload a listing in this category!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                <ShoppingBag size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No listings found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your search query.</p>
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
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-sm mx-auto">
                No brokers, no hidden costs — just trust and transparency.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Search,       color: 'bg-orange-100 dark:bg-orange-950/50 text-orange-500',   num: '01', title: 'Search & Filter',    desc: 'Browse thousands of verified listings by price, location, and type.' },
                { icon: UserCheck,    color: 'bg-blue-100 dark:bg-blue-950/50 text-blue-500',         num: '02', title: 'Verify & Trust',     desc: 'NID-verified listings and trust badges ensure authenticity.' },
                { icon: Handshake,    color: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-500',num: '03', title: 'Connect Directly',   desc: 'Message owners directly, schedule visits — zero brokerage.' },
                { icon: CheckCircle2, color: 'bg-purple-100 dark:bg-purple-950/50 text-purple-500',   num: '04', title: 'Move In & Shop',     desc: 'Finalize your home and furnish it — one trusted platform.' },
              ].map(({ icon: Icon, color, num, title, desc }) => (
                <div key={num} className="group p-6 rounded-2xl border border-gray-100 dark:border-gray-800
                  hover:border-orange-200 dark:hover:border-orange-900 hover:shadow-md
                  transition-all duration-300 hover:-translate-y-0.5">
                  <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center
                    mb-4 group-hover:scale-110 transition-transform duration-300`}>
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
