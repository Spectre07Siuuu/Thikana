import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Home      from './pages/Home'
import Login     from './pages/Login'
import Signup    from './pages/Signup'
import Profile   from './pages/Profile'
import NidVerify from './pages/NidVerify'
import UploadProduct from './pages/UploadProduct'
import ProductDetails from './pages/ProductDetails'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"           element={<Home />} />
            <Route path="/login"      element={<Login />} />
            <Route path="/signup"     element={<Signup />} />
            <Route path="/profile"    element={<Profile />} />
            <Route path="/verify-nid" element={<NidVerify />} />
            <Route path="/upload-product" element={<UploadProduct />} />
            <Route path="/product/:id" element={<ProductDetails />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
