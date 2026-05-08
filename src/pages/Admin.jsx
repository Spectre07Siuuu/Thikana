import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
 ShieldCheck, ArrowLeft, CheckCircle, XCircle, Clock, Package,
 FileText, BarChart3, RefreshCw, User, ExternalLink, ShieldAlert, Lock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
 getAdminStats, getAdminProducts, adminReviewProduct,
 getAdminNid, adminReviewNid, adminBlockNid, getAdminNidImageUrl,
} from '../services/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const TABS = [
 { key: 'products', label: 'Products', icon: Package },
 { key: 'nid', label: 'Identity', icon: FileText },
 { key: 'stats', label: 'Stats', icon: BarChart3 },
]

export default function Admin() {
 const { user, loading: authLoading } = useAuth()
 const navigate = useNavigate()
 const [activeTab, setActiveTab] = useState('products')
 const [stats, setStats] = useState(null)
 const [products, setProducts] = useState([])
 const [nidList, setNidList] = useState([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState('')
 const [statusFilter, setStatusFilter] = useState('pending')

 useEffect(() => {
  if (!authLoading && (!user || !user.is_admin)) navigate('/', { replace: true })
 }, [user, authLoading, navigate])

 const fetchData = useCallback(async () => {
  if (!user?.is_admin) return
  setLoading(true)
  setError('')
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
   setError(err.message || 'Failed to load admin data.')
  } finally {
   setLoading(false)
  }
 }, [user, statusFilter])

 useEffect(() => { fetchData() }, [fetchData])

 const handleProductReview = async (product_id, status) => {
  setError('')
  try {
   await adminReviewProduct({ product_id, status })
   setProducts(prev => prev.filter(p => p.id !== product_id))
   setStats(prev => prev ? { ...prev, pending_prod: Math.max(0, (prev.pending_prod || 1) - 1) } : prev)
  } catch (err) {
   setError(err.message || 'Failed to update product.')
  }
 }

 const handleNidReview = async (submission_id, status) => {
  setError('')
  try {
   await adminReviewNid({ submission_id, status })
   setNidList(prev => prev.filter(n => n.id !== submission_id))
   setStats(prev => prev ? { ...prev, pending_nid: Math.max(0, (prev.pending_nid || 1) - 1) } : prev)
  } catch (err) {
   setError(err.message || 'Failed to update NID.')
  }
 }

 const handleNidBlock = async submission_id => {
  setError('')
  try {
   await adminBlockNid({ submission_id, reason: 'Blocked from admin review panel' })
   await adminReviewNid({ submission_id, status: 'rejected', admin_note: 'NID permanently blocked.' })
   setNidList(prev => prev.filter(n => n.id !== submission_id))
  } catch (err) {
   setError(err.message || 'Failed to block NID.')
  }
 }

 if (authLoading || !user) return null

 return (
  <>
   <Navbar />
   <main className="min-h-screen bg-theme-bg pt-20 pb-12">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
     <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
       <Link to="/" className="p-2 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-white dark:hover:bg-gray-900 border border-transparent hover:border-theme-border dark:hover:border-gray-800 transition-all">
        <ArrowLeft size={18} />
       </Link>
       <div>
        <h1 className="text-xl font-bold text-theme-text flex items-center gap-2">
         <ShieldCheck size={20} className="text-theme-primary" /> Admin Panel
        </h1>
        <p className="text-xs text-theme-muted mt-0.5">Moderation and identity verification</p>
       </div>
      </div>
      <button onClick={fetchData} className="p-2 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-white dark:hover:bg-gray-900 border border-theme-border transition-all">
       <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
      </button>
     </div>

     {error && (
      <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300">
       {error}
      </div>
     )}

     <div className="glass-panel mb-4">
      <div className="flex items-center border-b border-theme-border px-2 gap-1">
       {TABS.map(({ key, label, icon: Icon }) => (
        <button key={key} onClick={() => setActiveTab(key)}
         className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all -mb-px ${activeTab === key ? 'border-theme-primary text-theme-primary-hover dark:text-orange-400' : 'border-transparent text-theme-muted hover:text-gray-600 dark:hover:text-gray-300'}`}>
         <Icon size={14} /> {label}
         {key === 'products' && stats?.pending_prod > 0 && <Badge count={stats.pending_prod} />}
         {key === 'nid' && stats?.pending_nid > 0 && <Badge count={stats.pending_nid} />}
        </button>
       ))}
       <div className="ml-auto mr-2 flex items-center gap-2">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
         className="text-xs border border-theme-border rounded-lg px-3 py-1.5 bg-theme-card text-gray-700 dark:text-gray-300 focus:outline-none">
         <option value="pending">Pending</option>
         <option value="review">Review</option>
         <option value="processing">Processing</option>
         <option value="approved">Approved</option>
         <option value="rejected">Rejected</option>
        </select>
       </div>
      </div>

      <div className="p-5">
       {loading ? (
        <div className="flex justify-center py-10">
         <div className="w-8 h-8 border-2 border-theme-primary border-t-transparent rounded-full animate-spin" />
        </div>
       ) : (
        <>
         {activeTab === 'products' && <ProductsTab products={products} onReview={handleProductReview} statusFilter={statusFilter} />}
         {activeTab === 'nid' && <NidTab submissions={nidList} onReview={handleNidReview} onBlock={handleNidBlock} statusFilter={statusFilter} />}
         {activeTab === 'stats' && <StatsTab stats={stats} />}
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
 return <span className="bg-theme-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{count > 99 ? '99+' : count}</span>
}

function ProductsTab({ products, onReview, statusFilter }) {
 if (products.length === 0) return <EmptyState label={`No ${statusFilter} products`} />
 return (
  <div className="space-y-3">
   {products.map(p => (
    <div key={p.id} className="flex items-start gap-4 p-4 bg-theme-bg dark:bg-gray-800/50 rounded-xl border border-theme-border">
     <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
      {p.main_image ? <img src={p.main_image} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-theme-muted"><Package size={20} /></div>}
     </div>
     <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
       <div>
        <p className="font-semibold text-theme-text text-sm truncate">{p.title}</p>
        <p className="text-xs text-theme-muted mt-0.5">{p.seller_name} - {p.seller_email}</p>
        <p className="text-xs text-theme-muted mt-0.5 capitalize">{p.category.replaceAll('_', ' ')} - Tk {Number(p.price).toLocaleString()}</p>
       </div>
       <Link to={`/product/${p.id}`} target="_blank" className="text-theme-muted hover:text-theme-primary flex-shrink-0"><ExternalLink size={14} /></Link>
      </div>
     </div>
     {statusFilter === 'pending' ? (
      <div className="flex flex-col gap-2 flex-shrink-0">
       <ReviewButton status="approved" onClick={() => onReview(p.id, 'approved')} />
       <ReviewButton status="rejected" onClick={() => onReview(p.id, 'rejected')} />
      </div>
     ) : <StatusPill status={statusFilter} />}
    </div>
   ))}
  </div>
 )
}

function NidTab({ submissions, onReview, onBlock, statusFilter }) {
 if (submissions.length === 0) return <EmptyState label={`No ${statusFilter} identity verifications`} />
 return (
  <div className="space-y-3">
   {submissions.map(s => (
    <div key={s.id} className="flex items-start gap-4 p-4 bg-theme-bg dark:bg-gray-800/50 rounded-xl border border-theme-border">
     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
      <User size={18} className="text-white" />
     </div>
     <div className="flex-1 min-w-0">
      <div className="flex flex-wrap items-center gap-2">
       <p className="font-semibold text-theme-text text-sm">{s.full_name}</p>
       <StatusPill status={s.verification_status || s.status} />
       {s.review_source && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-theme-border text-theme-muted">{s.review_source}</span>}
      </div>
      <p className="text-xs text-theme-muted">{s.email} {s.phone && ` - ${s.phone}`}</p>
      <p className="text-xs text-theme-muted mt-0.5 font-mono">NID: {s.nid_number_preview || s.nid_number}</p>
      <div className="grid grid-cols-3 gap-2 mt-3 max-w-sm">
       <ScoreBox label="OCR" value={s.ocr_confidence} />
       <ScoreBox label="Face" value={s.face_match_score} />
       <ScoreBox label="Score" value={s.confidence_score} />
      </div>
      {!!s.fraud_flags?.length && (
       <div className="flex flex-wrap gap-1.5 mt-3">
        {s.fraud_flags.map(flag => (
         <span key={flag} className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5">
          <ShieldAlert size={10} /> {flag.replaceAll('_', ' ')}
         </span>
        ))}
       </div>
      )}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
       <SecureKycImage submissionId={s.id} type="nid" label="NID front" />
       <SecureKycImage submissionId={s.id} type="selfie" label="Selfie" />
      </div>
      {s.extracted_full_name && <p className="text-xs text-theme-muted mt-2">OCR name: {s.extracted_full_name}</p>}
      {s.dob && <p className="text-xs text-theme-muted mt-1">DOB: {String(s.dob).slice(0, 10)}</p>}
      {s.review_note && <p className="text-xs text-theme-muted mt-1 italic">Note: {s.review_note}</p>}
     </div>
     {['pending', 'review', 'processing'].includes(statusFilter) && (
      <div className="flex flex-col gap-2 flex-shrink-0">
       <ReviewButton status="approved" onClick={() => onReview(s.id, 'approved')} />
       <ReviewButton status="rejected" onClick={() => onReview(s.id, 'rejected')} />
       <button onClick={() => onBlock(s.id)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-theme-border rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
        <Lock size={12} /> Block
       </button>
      </div>
     )}
    </div>
   ))}
  </div>
 )
}

function ReviewButton({ status, onClick }) {
 const approved = status === 'approved'
 const Icon = approved ? CheckCircle : XCircle
 const cls = approved
  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
  : 'bg-red-50 dark:bg-red-950/40 text-red-500 border-red-200 dark:border-red-800 hover:bg-red-100'
 return (
  <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors ${cls}`}>
   <Icon size={12} /> {approved ? 'Approve' : 'Reject'}
  </button>
 )
}

function SecureKycImage({ submissionId, type, label }) {
 const [url, setUrl] = useState('')
 const [failed, setFailed] = useState(false)

 useEffect(() => {
  let live = true
  let objectUrl = ''
  getAdminNidImageUrl(submissionId, type)
   .then(nextUrl => {
    objectUrl = nextUrl
    if (live) setUrl(nextUrl)
   })
   .catch(() => { if (live) setFailed(true) })
  return () => {
   live = false
   if (objectUrl) URL.revokeObjectURL(objectUrl)
  }
 }, [submissionId, type])

 if (failed) return <div className="h-32 rounded-lg border border-theme-border flex items-center justify-center text-xs text-theme-muted">{label} unavailable</div>
 if (!url) return <div className="h-32 rounded-lg border border-theme-border flex items-center justify-center"><div className="w-5 h-5 border-2 border-theme-primary border-t-transparent rounded-full animate-spin" /></div>
 return (
  <a href={url} target="_blank" rel="noopener noreferrer" className="block group">
   <div className="h-32 rounded-lg border border-theme-border overflow-hidden bg-theme-card">
    <img src={url} alt={label} className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform" />
   </div>
   <span className="mt-1 text-xs text-blue-500 flex items-center gap-1"><ExternalLink size={10} /> {label}</span>
  </a>
 )
}

function ScoreBox({ label, value }) {
 return (
  <div className="rounded-lg border border-theme-border bg-theme-card px-3 py-2 text-center">
   <p className="text-sm font-black text-theme-text">{Math.round(Number(value) || 0)}</p>
   <p className="text-[10px] uppercase font-bold text-theme-muted">{label}</p>
  </div>
 )
}

function StatsTab({ stats }) {
 if (!stats) return <EmptyState label="Stats unavailable" />
 const items = [
  { label: 'Total Users', value: stats.users, color: 'text-blue-500' },
  { label: 'Total Products', value: stats.products, color: 'text-purple-500' },
  { label: 'Pending Products', value: stats.pending_prod, color: 'text-theme-primary' },
  { label: 'Pending Identity', value: stats.pending_nid, color: 'text-rose-500' },
  { label: 'Auto Approved', value: stats.auto_approved_nid, color: 'text-emerald-500' },
  { label: 'Rejected Identity', value: stats.rejected_nid, color: 'text-red-500' },
  { label: 'Fraud Flagged', value: stats.fraud_flagged_nid, color: 'text-amber-500' },
  { label: 'Total Inquiries', value: stats.inquiries, color: 'text-cyan-500' },
 ]
 return (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
   {items.map(({ label, value, color }) => (
    <div key={label} className="text-center p-4 glass-card">
     <p className={`text-2xl font-black ${color}`}>{value ?? '-'}</p>
     <p className="text-xs text-theme-muted mt-1">{label}</p>
    </div>
   ))}
  </div>
 )
}

function StatusPill({ status }) {
 const normalized = status === 'review' || status === 'processing' ? 'pending' : status
 const cls = normalized === 'approved'
  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
  : normalized === 'rejected'
   ? 'bg-red-50 text-red-500 border-red-200 dark:bg-red-950/40 dark:border-red-800'
   : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'
 return <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border flex-shrink-0 ${cls}`}>{status}</span>
}

function EmptyState({ label }) {
 return (
  <div className="flex flex-col items-center justify-center py-16 text-theme-muted">
   <Clock size={32} className="mb-3 opacity-50" />
   <p className="text-sm font-medium">{label}</p>
  </div>
 )
}
