import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck, ArrowLeft, CheckCircle, XCircle, Clock,
  Package, FileText, BarChart3, RefreshCw, User, ExternalLink,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  getAdminStats, getAdminProducts, adminReviewProduct,
  getAdminNid, adminReviewNid,
} from '../services/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const TABS = [
  { key: 'products', label: 'Products',         icon: Package },
  { key: 'nid',      label: 'NID Submissions',  icon: FileText },
  { key: 'stats',    label: 'Stats',             icon: BarChart3 },
]

export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('products')
  const [stats, setStats]         = useState(null)
  const [products, setProducts]   = useState([])
  const [nidList, setNidList]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      navigate('/', { replace: true })
    }
  }, [user, authLoading, navigate])

  const fetchData = useCallback(async () => {
    if (!user?.is_admin) return
    setLoading(true)
    try {
      const [statsData, prodData, nidData] = await Promise.all([
        getAdminStats(),
        getAdminProducts({ status: statusFilter, limit: 50 }),
        getAdminNid({ status: statusFilter, limit: 50 }),
      ])
      setStats(statsData.stats)
      setProducts(prodData.products || [])
      setNidList(nidData.submissions || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleProductReview = async (product_id, status) => {
    try {
      await adminReviewProduct({ product_id, status })
      setProducts(prev => prev.filter(p => p.id !== product_id))
      setStats(prev => prev ? { ...prev, pending_prod: Math.max(0, (prev.pending_prod || 1) - 1) } : prev)
    } catch (err) {
      alert(err.message || 'Failed to update product.')
    }
  }

  const handleNidReview = async (submission_id, status) => {
    try {
      await adminReviewNid({ submission_id, status })
      setNidList(prev => prev.filter(n => n.id !== submission_id))
      setStats(prev => prev ? { ...prev, pending_nid: Math.max(0, (prev.pending_nid || 1) - 1) } : prev)
    } catch (err) {
      alert(err.message || 'Failed to update NID.')
    }
  }

  if (authLoading || !user) return null

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link to="/" className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-white dark:hover:bg-gray-900 border border-transparent hover:border-gray-200 dark:hover:border-gray-800 transition-all">
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck size={20} className="text-orange-500" /> Admin Panel
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">Moderation dashboard</p>
              </div>
            </div>
            <button onClick={fetchData} className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-white dark:hover:bg-gray-900 border border-gray-200 dark:border-gray-800 transition-all">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm mb-4">
            <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-2 gap-1">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all -mb-px
                    ${activeTab === key ? 'border-orange-500 text-orange-600 dark:text-orange-400' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                  <Icon size={14} /> {label}
                  {key === 'products' && stats?.pending_prod > 0 && <Badge count={stats.pending_prod} />}
                  {key === 'nid'      && stats?.pending_nid > 0  && <Badge count={stats.pending_nid} />}
                </button>
              ))}

              <div className="ml-auto mr-2 flex items-center gap-2">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {activeTab === 'products' && (
                    <ProductsTab products={products} onReview={handleProductReview} statusFilter={statusFilter} />
                  )}
                  {activeTab === 'nid' && (
                    <NidTab submissions={nidList} onReview={handleNidReview} statusFilter={statusFilter} />
                  )}
                  {activeTab === 'stats' && (
                    <StatsTab stats={stats} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function Badge({ count }) {
  return (
    <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function ProductsTab({ products, onReview, statusFilter }) {
  if (products.length === 0) {
    return <EmptyState label={`No ${statusFilter} products`} />
  }
  return (
    <div className="space-y-3">
      {products.map(p => (
        <div key={p.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
            {p.main_image
              ? <img src={p.main_image} alt={p.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={20} /></div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{p.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{p.seller_name} · {p.seller_email}</p>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">{p.category.replace('_', ' ')} · ৳{Number(p.price).toLocaleString()}</p>
              </div>
              <Link to={`/product/${p.id}`} target="_blank" className="text-gray-400 hover:text-orange-500 flex-shrink-0">
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
          {statusFilter === 'pending' && (
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button onClick={() => onReview(p.id, 'approved')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
                <CheckCircle size={12} /> Approve
              </button>
              <button onClick={() => onReview(p.id, 'rejected')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-500 border border-red-200 dark:border-red-800 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                <XCircle size={12} /> Reject
              </button>
            </div>
          )}
          {statusFilter !== 'pending' && (
            <StatusPill status={statusFilter} />
          )}
        </div>
      ))}
    </div>
  )
}

function NidTab({ submissions, onReview, statusFilter }) {
  if (submissions.length === 0) {
    return <EmptyState label={`No ${statusFilter} NID submissions`} />
  }
  return (
    <div className="space-y-3">
      {submissions.map(s => (
        <div key={s.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.full_name}</p>
            <p className="text-xs text-gray-500">{s.email} {s.phone && `· ${s.phone}`}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">NID: {s.nid_number}</p>
            <div className="flex gap-2 mt-2">
              <a href={s.nid_front_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1"><ExternalLink size={10} /> NID Front</a>
              <a href={s.nid_selfie_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1"><ExternalLink size={10} /> Selfie</a>
            </div>
            {s.admin_note && <p className="text-xs text-gray-400 mt-1 italic">Note: {s.admin_note}</p>}
          </div>
          {statusFilter === 'pending' && (
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button onClick={() => onReview(s.id, 'approved')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">
                <CheckCircle size={12} /> Approve
              </button>
              <button onClick={() => onReview(s.id, 'rejected')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-500 border border-red-200 dark:border-red-800 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                <XCircle size={12} /> Reject
              </button>
            </div>
          )}
          {statusFilter !== 'pending' && <StatusPill status={statusFilter} />}
        </div>
      ))}
    </div>
  )
}

function StatsTab({ stats }) {
  if (!stats) return <EmptyState label="Stats unavailable" />
  const items = [
    { label: 'Total Users',        value: stats.users,        color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Total Products',     value: stats.products,     color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' },
    { label: 'Pending Products',   value: stats.pending_prod, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40' },
    { label: 'Pending NID',        value: stats.pending_nid,  color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' },
    { label: 'Total Inquiries',    value: stats.inquiries,    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map(({ label, value, color }) => (
        <div key={label} className="text-center p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
          <p className={`text-2xl font-black ${color.split(' ')[0]}`}>{value ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">{label}</p>
        </div>
      ))}
    </div>
  )
}

function StatusPill({ status }) {
  const cls = status === 'approved'
    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
    : 'bg-red-50 text-red-500 border-red-200 dark:bg-red-950/40 dark:border-red-800'
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border flex-shrink-0 ${cls}`}>
      {status}
    </span>
  )
}

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Clock size={32} className="mb-3 opacity-50" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}
