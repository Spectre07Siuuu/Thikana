import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, MapPin, Home as HomeIcon, ShoppingBag, TrendingUp,
  ShieldCheck, BadgeCheck, Star, UserCheck, Handshake,
  ChevronRight, Bed, Bath, Square, CheckCircle2, Tag,
  Package, Sofa, Tv, Utensils, Wand2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

/* ─────────────────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────────────────── */
const SELL_LISTINGS = [
  {
    id: 1, title: '737 Premium Villa', location: 'Gulshan-2, Dhaka',
    price: '৳ 1,20,00,000', type: 'buy', badge: 'For Sale',
    beds: 4, baths: 3, area: 3200, verified: true, nidVerified: true, rating: '5.0',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
  },
  {
    id: 2, title: '737 Prime', location: 'Dhanmondi, Dhaka',
    price: '৳ 85,00,000', type: 'buy', badge: 'New',
    beds: 3, baths: 2, area: 1960, verified: true, nidVerified: true, rating: '4.8',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
  },
  {
    id: 3, title: 'Sunnyside Estate', location: 'Uttara, Dhaka',
    price: '৳ 3,20,000', type: 'buy', badge: 'Reduced',
    beds: 3, baths: 2, area: 1500, verified: false, nidVerified: true, rating: '4.5',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
  },
]

const RENT_LISTINGS = [
  {
    id: 4, title: 'Royal Hidemond', location: 'Banani, Dhaka',
    price: '৳ 45,000', type: 'rent', badge: 'New List',
    beds: 3, baths: 2, area: 1800, verified: true, nidVerified: true, rating: '4.9',
    image: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=600&q=80',
  },
  {
    id: 5, title: 'Urban Heights', location: 'Mirpur, Dhaka',
    price: '৳ 22,000', type: 'rent', badge: 'Lease',
    beds: 2, baths: 1, area: 950, verified: true, nidVerified: false, rating: '4.6',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80',
  },
  {
    id: 6, title: 'Lakeside View', location: 'Bashundhara, Dhaka',
    price: '৳ 35,000', type: 'rent', badge: 'Lease',
    beds: 3, baths: 2, area: 1350, verified: true, nidVerified: true, rating: '4.7',
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80',
  },
]

const APPLIANCES = [
  {
    id: 201, title: 'LG Smart Cooling AC', price: '৳ 52,000', condition: 'New',
    seller: 'ElectroHub BD', verified: true, rating: '4.8',
    image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80',
  },
  {
    id: 202, title: 'RiceMaker Pro Cooker', price: '৳ 8,500', condition: 'New',
    seller: 'KitchenWorld', verified: true, rating: '4.5',
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&q=80',
  },
  {
    id: 203, title: 'Yoga 8kg Washer', price: '৳ 38,000', condition: 'Used',
    seller: 'HomeGoods Dhaka', verified: false, rating: '4.2',
    image: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=400&q=80',
  },
  {
    id: 204, title: 'Instant Water Heater', price: '৳ 12,000', condition: 'New',
    seller: 'TechMart BD', verified: true, rating: '4.6',
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80',
  },
]

const MARKETPLACE_ITEMS = [
  {
    id: 301, title: 'L-Shaped Premium Sofa', price: '৳ 38,500', condition: 'New',
    category: 'Furniture', seller: 'FurnitureBD', verified: true, rating: '4.9', badge: 'Hot Deal',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80',
  },
  {
    id: 302, title: 'Samsung 1.5T Inverter AC', price: '৳ 52,000', condition: 'New',
    category: 'Appliances', seller: 'ElectroHub', verified: true, rating: '4.8', badge: 'Verified Seller',
    image: 'https://images.unsplash.com/photo-1624673870417-265753abe975?w=500&q=80',
  },
  {
    id: 303, title: 'King Bed Frame + Mattress', price: '৳ 28,000', condition: 'Used',
    category: 'Furniture', seller: 'GoodHome', verified: true, rating: '4.4', badge: 'New',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500&q=80',
  },
  {
    id: 304, title: 'Smart 55" OLED TV', price: '৳ 75,000', condition: 'New',
    category: 'Electronics', seller: 'TechGuru', verified: false, rating: '4.7', badge: 'Hot Deal',
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500&q=80',
  },
  {
    id: 305, title: 'Modern Dining Set (6-Chair)', price: '৳ 45,000', condition: 'New',
    category: 'Furniture', seller: 'WoodWorks BD', verified: true, rating: '4.5', badge: null,
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=500&q=80',
  },
  {
    id: 306, title: 'Gas Stove 4-Burner', price: '৳ 9,500', condition: 'Used',
    category: 'Kitchen', seller: 'KitchenMart', verified: true, rating: '4.3', badge: null,
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80',
  },
]

const MARKETPLACE_CATS = [
  { icon: Sofa,     label: 'Furniture' },
  { icon: Tv,       label: 'Electronics' },
  { icon: Utensils, label: 'Kitchen' },
  { icon: Package,  label: 'Appliances' },
  { icon: Wand2,    label: 'Décor' },
]

const STATS = [
  { value: '12K+', label: 'Verified Listings' },
  { value: '5.6K+', label: 'Happy Families' },
  { value: '18',    label: 'Cities Covered' },
  { value: '98%',   label: 'Broker-Free Deals' },
]

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
const BADGE_COLORS = {
  'For Sale':       'bg-blue-500',
  'New':            'bg-emerald-500',
  'Reduced':        'bg-red-500',
  'New List':       'bg-orange-500',
  'Lease':          'bg-purple-500',
  'Hot Deal':       'bg-rose-500',
  'Verified Seller':'bg-blue-500',
}

const CONDITION_STYLE = {
  New:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Used: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

/* ─────────────────────────────────────────────────────────
   PROPERTY CARD
───────────────────────────────────────────────────────── */
function PropertyCard({ listing }) {
  const { title, location, price, type, badge, beds, baths, area,
          verified, nidVerified, rating, image } = listing
  return (
    <article className="card group cursor-pointer flex flex-col">
      <div className="relative overflow-hidden h-48">
        <img src={image} alt={title} loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {badge && (
          <span className={`absolute top-3 left-3 ${BADGE_COLORS[badge] ?? 'bg-gray-500'} text-white
            text-[10px] font-bold uppercase px-2.5 py-1 rounded-full`}>{badge}</span>
        )}
        {rating && (
          <span className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 dark:bg-gray-900/80
            backdrop-blur-sm text-gray-800 dark:text-gray-100 text-[10px] font-semibold px-2 py-1 rounded-full shadow">
            <Star size={9} className="text-yellow-500" fill="currentColor" /> {rating}
          </span>
        )}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {verified    && <span className="badge-verified"><BadgeCheck size={10} /> Verified</span>}
          {nidVerified && <span className="badge-nid"><ShieldCheck size={10} /> NID</span>}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-1
          group-hover:text-orange-500 transition-colors">{title}</h3>
        <p className="text-gray-400 text-xs flex items-center gap-1 mb-3">
          <MapPin size={11} className="text-orange-400 flex-shrink-0" /> {location}
        </p>
        {(beds || baths || area) && (
          <div className="flex items-center gap-3 text-gray-400 text-xs mb-3 pt-3
            border-t border-gray-100 dark:border-gray-800">
            {beds  && <span className="flex items-center gap-1"><Bed    size={11} /> {beds} Beds</span>}
            {baths && <span className="flex items-center gap-1"><Bath   size={11} /> {baths} Bath</span>}
            {area  && <span className="flex items-center gap-1"><Square size={11} /> {area} ft²</span>}
          </div>
        )}
        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">{price}</span>
            {type === 'rent' && <span className="text-gray-400 text-xs">/mo</span>}
          </div>
          <button className="text-xs text-orange-500 hover:text-orange-600 font-semibold transition-colors">
            View →
          </button>
        </div>
      </div>
    </article>
  )
}

/* ─────────────────────────────────────────────────────────
   APPLIANCE CARD
───────────────────────────────────────────────────────── */
function ApplianceCard({ item }) {
  const { title, price, condition, seller, verified, rating, image } = item
  return (
    <article className="card group cursor-pointer flex flex-col">
      {/* Image */}
      <div className="relative overflow-hidden bg-gray-50 dark:bg-gray-800">
        <img src={image} alt={title} loading="lazy"
          className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105" />
        {/* Condition badge */}
        <span className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full
          ${CONDITION_STYLE[condition] ?? CONDITION_STYLE.New}`}>
          {condition}
        </span>
        {rating && (
          <span className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/90 dark:bg-gray-900/80
            backdrop-blur-sm text-[10px] font-semibold px-2 py-0.5 rounded-full text-gray-700 dark:text-gray-200">
            <Star size={9} className="text-yellow-400" fill="currentColor" /> {rating}
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2
          group-hover:text-orange-500 transition-colors">{title}</h3>
        <p className="text-gray-400 text-xs flex items-center gap-1">
          {verified
            ? <><BadgeCheck size={11} className="text-emerald-500" /> {seller}</>
            : seller
          }
        </p>
        <div className="flex items-center justify-between mt-auto pt-2
          border-t border-gray-100 dark:border-gray-800">
          <span className="text-orange-500 font-bold text-sm">{price}</span>
          <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-orange-500
            bg-gray-100 dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-950/30
            px-2.5 py-1 rounded-lg font-medium transition-all">
            View
          </button>
        </div>
      </div>
    </article>
  )
}

/* ─────────────────────────────────────────────────────────
   MARKETPLACE PRODUCT CARD
───────────────────────────────────────────────────────── */
function MarketplaceCard({ item }) {
  const { title, price, condition, category, seller, verified, rating, badge, image } = item
  return (
    <article className="card group cursor-pointer flex flex-col">
      <div className="relative overflow-hidden h-44 bg-gray-50 dark:bg-gray-800">
        <img src={image} alt={title} loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {/* Badges row */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {badge && (
            <span className={`${BADGE_COLORS[badge] ?? 'bg-gray-500'} text-white
              text-[10px] font-bold px-2.5 py-0.5 rounded-full`}>{badge}</span>
          )}
        </div>
        {/* Condition */}
        <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full
          ${CONDITION_STYLE[condition] ?? CONDITION_STYLE.New}`}>{condition}</span>
        {/* Rating */}
        <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-white/90 dark:bg-gray-900/80
          backdrop-blur-sm text-[10px] font-semibold px-2 py-0.5 rounded-full text-gray-700 dark:text-gray-200">
          <Star size={9} className="text-yellow-400" fill="currentColor" /> {rating}
        </span>
      </div>

      <div className="p-3.5 flex flex-col gap-1.5 flex-1">
        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">{category}</span>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2
          group-hover:text-orange-500 transition-colors">{title}</h3>
        <p className="text-gray-400 text-xs flex items-center gap-1">
          {verified
            ? <><BadgeCheck size={11} className="text-emerald-500" /> {seller}</>
            : seller
          }
        </p>
        <div className="flex items-center justify-between mt-auto pt-2.5
          border-t border-gray-100 dark:border-gray-800">
          <span className="text-orange-500 font-bold text-sm">{price}</span>
          <button className="text-xs text-white bg-orange-500 hover:bg-orange-600
            px-3 py-1.5 rounded-lg font-medium transition-all active:scale-95">
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  )
}

/* ─────────────────────────────────────────────────────────
   HOME PAGE
───────────────────────────────────────────────────────── */
export default function Home() {
  const [activeTab,   setActiveTab]   = useState('rent')
  const [searchQuery, setSearchQuery] = useState('')

  const tabs = [
    { id: 'rent',        label: 'Rent Flat',   icon: HomeIcon },
    { id: 'buy',         label: 'Buy Flat',    icon: TrendingUp },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  ]

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200">

        {/* HERO */}
        <section className="bg-white dark:bg-gray-950 overflow-hidden" aria-labelledby="hero-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18">
            <div className="grid lg:grid-cols-2 gap-10 items-center">

              {/* Left */}
              <div className="animate-slide-up">
                <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-950/40
                  border border-orange-100 dark:border-orange-900 text-orange-500 rounded-full
                  px-4 py-1.5 text-xs font-semibold mb-5">
                  <ShieldCheck size={12} /> New listings available
                </div>

                <h1 id="hero-heading" className="text-4xl sm:text-5xl lg:text-[52px] font-black
                  text-gray-900 dark:text-white leading-tight mb-4">
                  Find the home<br />
                  that <span className="italic text-orange-500">loves</span> you back.
                </h1>

                <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-7 max-w-md">
                  Bangladesh's most trusted housing marketplace. Rent flats, buy properties,
                  and furnish your home — all from verified owners, zero brokerage.
                </p>

                {/* Search box */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                  rounded-2xl shadow-lg dark:shadow-gray-900/60 p-2">
                  {/* Tabs */}
                  <div className="flex gap-1 mb-2 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl">
                    {tabs.map(({ id, label, icon: Icon }) => (
                      <button key={id} id={`tab-${id}`}
                        onClick={() => setActiveTab(id)} aria-pressed={activeTab === id}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg
                          text-xs font-semibold transition-all duration-200 ${
                            activeTab === id
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>
                        <Icon size={13} /><span className="hidden sm:inline">{label}</span>
                      </button>
                    ))}
                  </div>
                  <form onSubmit={e => e.preventDefault()} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input id="hero-search" type="text" value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by location, keyword…"
                        className="input-field pl-9 rounded-xl" aria-label="Search" />
                    </div>
                    <button type="submit" id="hero-search-btn"
                      className="btn-primary rounded-xl px-5 flex-shrink-0">Search</button>
                  </form>
                </div>

                {/* Social proof */}
                <div className="flex items-center gap-4 mt-5">
                  <div className="flex -space-x-2">
                    {['F','R','A','M'].map((l, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-950
                        bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center
                        text-white text-[10px] font-bold">{l}</div>
                    ))}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    <span className="font-semibold text-gray-900 dark:text-white">5,600+</span> happy tenants this month
                  </p>
                </div>
              </div>

              {/* Right — hero image */}
              <div className="hidden lg:block animate-fade-in">
                <div className="relative">
                  <div className="rounded-3xl overflow-hidden shadow-2xl shadow-gray-200 dark:shadow-gray-900 h-[400px]">
                    <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=85"
                      alt="Beautiful home interior"
                      className="w-full h-full object-cover" />
                  </div>
                  {/* Floating NID card */}
                  <div className="absolute -bottom-5 -left-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl
                    border border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center">
                      <ShieldCheck size={20} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">NID Verified</p>
                      <p className="text-gray-400 text-xs">12,480 listings</p>
                    </div>
                  </div>
                  {/* Floating rating card */}
                  <div className="absolute -top-5 -right-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl
                    border border-gray-100 dark:border-gray-800 px-4 py-3">
                    <div className="flex gap-0.5 justify-center mb-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={12} className="text-yellow-400" fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-[11px] text-center">Rated 4.9/5 by tenants</p>
                  </div>
                  {/* Estate tag */}
                  <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm
                    rounded-xl px-3 py-2 shadow-lg border border-white/60 dark:border-gray-700">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-gray-700 dark:text-gray-200 text-xs font-semibold">Freedom Estate</p>
                    </div>
                    <p className="text-gray-400 text-[10px] mt-0.5">Gulshan-2 · From ৳45,000/mo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="border-t border-b border-gray-100 dark:border-gray-800 py-8
          bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl lg:text-3xl font-black text-orange-500">{value}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SELL PROPERTIES — symmetric 3-col */}
        <section id="properties" className="py-14 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader title="Sell Properties"
              subtitle="Find properties for sale near your preferred locales" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {SELL_LISTINGS.map(l => <PropertyCard key={l.id} listing={l} />)}
            </div>
            <ViewAll />
          </div>
        </section>

        {/* RENT APARTMENTS */}
        <section id="rent" className="py-14 bg-gray-50 dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader title="Rent Apartments"
              subtitle="Budget-friendly, cozy apartments for every lifestyle" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {RENT_LISTINGS.map(l => <PropertyCard key={l.id} listing={l} />)}
            </div>
            <ViewAll />
          </div>
        </section>

        {/* HOME APPLIANCES — improved cards */}
        <section id="appliances" className="py-14 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader title="Home Appliances"
              subtitle="Top picks for your new home — new & used, all verified" />
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {APPLIANCES.map(a => <ApplianceCard key={a.id} item={a} />)}
            </div>
            <ViewAll />
          </div>
        </section>

        {/* MARKETPLACE */}
        <section id="marketplace" className="py-14 bg-gray-50 dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="section-label">Home Essentials</p>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Marketplace</h2>
                <p className="text-gray-400 text-sm mt-0.5">Furniture, appliances and more — from verified sellers</p>
              </div>
              <button className="text-orange-500 text-sm font-semibold hover:text-orange-600
                flex items-center gap-1 transition-colors">
                Browse All <ChevronRight size={15} />
              </button>
            </div>

            {/* Category pills */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
              {MARKETPLACE_CATS.map(({ icon: Icon, label }) => (
                <button key={label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border
                    border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900
                    text-gray-600 dark:text-gray-400 text-sm font-medium whitespace-nowrap
                    hover:border-orange-400 hover:text-orange-500 transition-all duration-200 flex-shrink-0">
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {MARKETPLACE_ITEMS.map(i => <MarketplaceCard key={i.id} item={i} />)}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="about" className="py-16 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="section-label">Simple Process</p>
              <h2 className="section-heading">How Thikana Works</h2>
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

/* ─── Shared sub-components ─────────────────────────────── */
function SectionHeader({ title, subtitle }) {
  return (
    <div className="flex items-end justify-between mb-7">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-gray-400 text-sm mt-0.5">{subtitle}</p>
      </div>
      <button className="text-orange-500 text-sm font-semibold hover:text-orange-600
        flex items-center gap-1 transition-colors">
        View All <ChevronRight size={15} />
      </button>
    </div>
  )
}

function ViewAll() {
  return (
    <div className="text-center mt-8">
      <button className="btn-secondary text-sm">
        View All Listings <ChevronRight size={15} />
      </button>
    </div>
  )
}
