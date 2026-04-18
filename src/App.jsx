import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider }  from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

import Home           from './pages/Home'
import Login          from './pages/Login'
import Signup         from './pages/Signup'
import VerifyEmail    from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword  from './pages/ResetPassword'
import Profile        from './pages/Profile'
import NidVerify      from './pages/NidVerify'
import UploadProduct  from './pages/UploadProduct'
import ProductDetails from './pages/ProductDetails'
import Settings       from './pages/Settings'
import Terms          from './pages/Terms'
import Privacy        from './pages/Privacy'
import Admin          from './pages/Admin'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"                element={<Home />} />
            <Route path="/login"           element={<Login />} />
            <Route path="/signup"          element={<Signup />} />
            <Route path="/verify-email"    element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password"  element={<ResetPassword />} />
            <Route path="/profile"         element={<Profile />} />
            <Route path="/verify-nid"      element={<NidVerify />} />
            <Route path="/upload-product"  element={<UploadProduct />} />
            <Route path="/product/:id"     element={<ProductDetails />} />
            <Route path="/settings"        element={<Settings />} />
            <Route path="/terms"           element={<Terms />} />
            <Route path="/privacy"         element={<Privacy />} />
            <Route path="/admin"           element={<Admin />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
