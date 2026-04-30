import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider }     from './context/AuthContext'
import { ThemeProvider }    from './context/ThemeContext'
import { CartProvider }     from './context/CartContext'
import { SocketProvider }    from './context/SocketContext'
import { NotificationProvider } from './context/NotificationContext'

import Home      from './pages/Home'
import Login     from './pages/Login'
import Signup     from './pages/Signup'
import VerifyEmail  from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Profile    from './pages/Profile'
import NidVerify   from './pages/NidVerify'
import UploadProduct from './pages/UploadProduct'
import ProductDetails from './pages/ProductDetails'
import Settings    from './pages/Settings'
import Terms     from './pages/Terms'
import Privacy    from './pages/Privacy'
import Admin     from './pages/Admin'
import Cart      from './pages/Cart'
import Checkout    from './pages/Checkout'
import Messages    from './pages/Messages'
import Notifications from './pages/Notifications'
import OrderDetails from './pages/OrderDetails'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
 return (
  <ThemeProvider>
   <AuthProvider>
    <SocketProvider>
     <CartProvider>
      <NotificationProvider>
       <BrowserRouter>
        <Routes>
         <Route path="/"        element={<Home />} />
         <Route path="/login"      element={<Login />} />
         <Route path="/signup"     element={<Signup />} />
         <Route path="/verify-email"  element={<VerifyEmail />} />
         <Route path="/forgot-password" element={<ForgotPassword />} />
         <Route path="/reset-password" element={<ResetPassword />} />
         <Route path="/profile"     element={<ProtectedRoute><Profile /></ProtectedRoute>} />
         <Route path="/verify-nid"   element={<ProtectedRoute roles={['buyer', 'seller']}><NidVerify /></ProtectedRoute>} />
         <Route path="/upload-product" element={<ProtectedRoute roles={['seller']} requireVerifiedNid><UploadProduct /></ProtectedRoute>} />
         <Route path="/product/:id"   element={<ProductDetails />} />
         <Route path="/settings"    element={<ProtectedRoute><Settings /></ProtectedRoute>} />
         <Route path="/terms"      element={<Terms />} />
         <Route path="/privacy"     element={<Privacy />} />
         <Route path="/admin"      element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
         <Route path="/cart"      element={<ProtectedRoute roles={['buyer']}><Cart /></ProtectedRoute>} />
         <Route path="/checkout"    element={<ProtectedRoute roles={['buyer']} requireVerifiedNid><Checkout /></ProtectedRoute>} />
         <Route path="/messages"    element={<ProtectedRoute roles={['buyer', 'seller']} requireVerifiedNid><Messages /></ProtectedRoute>} />
         <Route path="/notifications"  element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
         <Route path="/orders/:id"    element={<ProtectedRoute roles={['buyer', 'seller']} allowAdmin><OrderDetails /></ProtectedRoute>} />
        </Routes>
       </BrowserRouter>
      </NotificationProvider>
     </CartProvider>
    </SocketProvider>
   </AuthProvider>
  </ThemeProvider>
 )
}
