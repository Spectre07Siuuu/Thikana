import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Package, XCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { getOrderById, updateOrderStatus } from '../services/api'

function formatDateTime(dateStr) {
 if (!dateStr) return 'N/A'
 return new Date(dateStr).toLocaleString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
 })
}

export default function OrderDetails() {
 const { id } = useParams()
 const navigate = useNavigate()
 const { user } = useAuth()
 const [order, setOrder] = useState(null)
 const [loading, setLoading] = useState(true)
 const [updating, setUpdating] = useState(false)
 const [error, setError] = useState('')

 const loadOrder = async () => {
  setLoading(true)
  setError('')
  try {
   const res = await getOrderById(id)
   setOrder(res.order || null)
  } catch (err) {
   setError(err.message || 'Failed to load order details.')
  } finally {
   setLoading(false)
  }
 }

 useEffect(() => {
  if (!user) { navigate('/login'); return }
  loadOrder()
 }, [id, user, navigate])

  const subtotal = useMemo(() => (
   Number(order?.items?.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0) || 0)
  ), [order])
  const deliveryFee = Number(order?.delivery_fee || 0)
  const isBuyerContext = !!order?.permissions?.is_buyer
  const sellerContacts = useMemo(() => (
   Array.from(
    new Map((order?.items || [])
     .map(item => [item.seller_id, { name: item.seller_name || 'N/A', phone: item.seller_phone || 'N/A' }]))
     .values()
   )
  ), [order])

 const handleCancel = async () => {
  if (!order || updating) return
  const ok = window.confirm('Cancel this order?')
  if (!ok) return
  setUpdating(true)
  try {
   await updateOrderStatus(order.id, 'cancelled')
   await loadOrder()
  } catch (err) {
   setError(err.message || 'Failed to cancel order.')
  } finally {
   setUpdating(false)
  }
 }

 const handleChat = () => {
  if (!order || !order.items?.length) return
  if (order.permissions?.is_buyer) {
   const first = order.items[0]
   navigate(`/messages?user=${first.seller_id}&product=${first.product_id}`)
   return
  }
  if (order.permissions?.is_seller) {
   const first = order.items[0]
   navigate(`/messages?user=${order.buyer_id}&product=${first.product_id}`)
  }
 }

 if (loading) {
  return (
   <>
    <Navbar />
    <div className="min-h-screen pt-24 bg-theme-bg flex items-center justify-center">
     <div className="w-8 h-8 border-2 border-theme-primary border-t-transparent rounded-full animate-spin" />
    </div>
   </>
  )
 }

 if (error || !order) {
  return (
   <>
    <Navbar />
    <main className="min-h-screen pt-24 pb-12 bg-theme-bg px-4">
     <div className="max-w-3xl mx-auto bg-theme-card border border-theme-border rounded-2xl p-6">
      <p className="text-sm text-red-500">{error || 'Order not found.'}</p>
      <Link to="/profile" className="inline-block mt-3 text-sm text-theme-primary hover:underline">Go back</Link>
     </div>
    </main>
    <Footer />
   </>
  )
 }

 return (
  <>
   <Navbar />
   <main className="min-h-screen pt-24 pb-16 bg-theme-bg">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4">
     <div className="flex items-center justify-between">
      <Link to="/profile?view=orders" className="inline-flex items-center gap-2 text-sm text-theme-muted hover:text-theme-primary">
       <ArrowLeft size={16} /> Back
      </Link>
      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-theme-muted capitalize">{order.status}</span>
     </div>

     <div className="bg-theme-card border border-theme-border rounded-2xl p-5">
      <h1 className="text-lg font-bold text-theme-text">Order #{order.id}</h1>
      <p className="text-xs text-theme-muted mt-1">Placed on {formatDateTime(order.created_at)}</p>

      <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs">
       <div className="p-3 rounded-xl bg-theme-bg/60">
        <p className="font-semibold text-theme-text mb-1">Shipping Address</p>
        <p className="text-theme-muted whitespace-pre-line">{order.shipping_address || 'N/A'}</p>
       </div>
       <div className="p-3 rounded-xl bg-theme-bg/60">
        <p className="font-semibold text-theme-text mb-1">{isBuyerContext ? 'Seller Contact' : 'Contact'}</p>
        {isBuyerContext ? (
         sellerContacts.length ? (
          sellerContacts.map((seller, idx) => (
           <p key={`${seller.name}-${idx}`} className="text-theme-muted">
            {sellerContacts.length > 1 ? `Seller ${idx + 1}: ` : ''}{seller.name} · {seller.phone}
           </p>
          ))
         ) : <p className="text-theme-muted">N/A</p>
        ) : (
         <p className="text-theme-muted">{order.phone || 'N/A'}</p>
        )}
        {order.note && <p className="text-theme-muted mt-2">Note: {order.note}</p>}
       </div>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-theme-bg/60 text-xs">
       <p className="font-semibold text-theme-text mb-2">{isBuyerContext ? 'Seller' : 'Buyer'}</p>
       {isBuyerContext ? (
        sellerContacts.length ? (
         sellerContacts.map((seller, idx) => (
          <p key={`${seller.name}-card-${idx}`} className="text-theme-muted">
           {sellerContacts.length > 1 ? `Seller ${idx + 1}: ` : ''}{seller.name} · {seller.phone}
          </p>
         ))
        ) : <p className="text-theme-muted">N/A</p>
       ) : (
        <>
         <p className="text-theme-muted">{order.buyer_name} · {order.buyer_email || 'N/A'}</p>
         <p className="text-theme-muted">{order.buyer_phone || order.phone || 'N/A'}</p>
        </>
       )}
       <p className="text-theme-muted mt-2">Paid on: {formatDateTime(order.created_at)}</p>
       <p className="text-theme-muted">Paid by: COD</p>
      </div>

      <div className="mt-4 space-y-2">
       {order.items?.map(item => (
        <div key={item.id} className="flex items-center justify-between gap-3 bg-theme-bg/60 p-3 rounded-xl">
         <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
           {item.main_image ? <img src={item.main_image} alt={item.title} className="w-full h-full object-cover" /> : <Package size={16} className="m-auto mt-2 text-theme-muted" />}
          </div>
          <div className="min-w-0">
           <Link to={`/product/${item.product_id}`} className="text-xs font-semibold text-theme-text hover:text-theme-primary truncate block max-w-[180px] sm:max-w-[320px]">{item.title}</Link>
           <p className="text-[11px] text-theme-muted">৳{Number(item.price).toLocaleString()} × {item.quantity}</p>
          </div>
         </div>
         <p className="text-xs font-semibold text-rose-500">৳{(Number(item.price) * Number(item.quantity)).toLocaleString()}</p>
        </div>
       ))}
      </div>

      <div className="mt-4 border-t border-theme-border pt-3 text-xs space-y-1">
       <div className="flex justify-between text-theme-muted"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
       <div className="flex justify-between text-theme-muted"><span>Delivery Fee</span><span>৳{deliveryFee.toLocaleString()}</span></div>
       <div className="flex justify-between font-bold text-theme-text text-sm"><span>Total</span><span>৳{Number(order.total_amount).toLocaleString()}</span></div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
       {order.permissions?.can_cancel && order.status !== 'cancelled' && (
        <button onClick={handleCancel} disabled={updating}
         className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-800 text-rose-600 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 disabled:opacity-60">
         <XCircle size={14} /> {updating ? 'Cancelling...' : 'Cancel Order'}
        </button>
       )}
       <button onClick={handleChat}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-800 text-blue-600 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40">
        <MessageSquare size={14} /> Chat
       </button>
      </div>
     </div>
    </div>
   </main>
   <Footer />
  </>
 )
}
