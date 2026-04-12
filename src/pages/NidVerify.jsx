import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, Image as ImageIcon, Camera, CheckCircle } from 'lucide-react'
import { submitNid } from '../services/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import { useAuth } from '../context/AuthContext'

export default function NidVerify() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  
  const [nidNumber, setNidNumber] = useState('')
  const [frontPreview, setFrontPreview] = useState('')
  const [selfiePreview, setSelfiePreview] = useState('')
  
  const [frontBase64, setFrontBase64] = useState('')
  const [selfieBase64, setSelfieBase64] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleImageChange = (e, setPreview, setBase64) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setPreview(ev.target.result)
      setBase64(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!nidNumber.trim() || !frontBase64 || !selfieBase64) {
      setError('Please fill in all fields and upload both required images.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await submitNid({
        nid_number: nidNumber,
        nid_front_base64: frontBase64,
        nid_selfie_base64: selfieBase64
      })
      await refreshUser()
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to submit NID. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-16 pb-12">
        <div className="max-w-xl mx-auto px-4 sm:px-6 mt-8 animate-fade-in">
          
          <div className="mb-6 flex items-center gap-3">
            <Link to="/profile"
              className="p-2 rounded-lg text-gray-400 hover:text-orange-500
                hover:bg-white dark:hover:bg-gray-900 border border-transparent
                hover:border-gray-200 dark:hover:border-gray-800 transition-all duration-200">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Verify Identity</h1>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800
            rounded-2xl shadow-sm p-6 sm:p-8">
            
            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900">
              <ShieldAlert size={24} className="flex-shrink-0" />
              <p className="text-sm">
                <strong>Why verify?</strong> Verified users get a badge, more trust from others, and access to premium features. 
                Your information is kept secure and confidential.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800
                  rounded-xl text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              {/* NID Number */}
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2">
                  1. NID Number (10, 13, or 17 digits)
                </label>
                <input 
                  type="text" 
                  value={nidNumber}
                  onChange={e => setNidNumber(e.target.value)}
                  placeholder="e.g. 1990123456789"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-gray-900 dark:text-white transition-all font-mono"
                />
              </div>

              {/* NID Front Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2">
                  2. Clear photo of NID (Front side)
                </label>
                <UploadBox 
                  id="nid-front"
                  preview={frontPreview}
                  onChange={e => handleImageChange(e, setFrontPreview, setFrontBase64)}
                  icon={<ImageIcon size={32} />}
                  label="Upload NID Front"
                />
              </div>

              {/* Selfie Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2">
                  3. Selfie holding the NID
                </label>
                <UploadBox 
                  id="nid-selfie"
                  preview={selfiePreview}
                  onChange={e => handleImageChange(e, setSelfiePreview, setSelfieBase64)}
                  icon={<Camera size={32} />}
                  label="Upload Selfie with NID"
                />
              </div>

              {/* Submit */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-orange-500 text-white font-bold
                  hover:bg-orange-600 active:scale-[0.98] transition-all
                  disabled:opacity-70 disabled:cursor-not-allowed
                  flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Submit for Review
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function UploadBox({ id, preview, onChange, icon, label }) {
  return (
    <label htmlFor={id} className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
      preview 
        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10' 
        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-orange-400 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20'
    }`}>
      {preview ? (
        <div className="relative w-full h-full p-2 group">
          <img src={preview} alt="Upload preview" className="w-full h-full object-contain rounded-lg" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white font-medium text-sm">
            Click to change image
          </div>
        </div>
      ) : (
        <div className="text-gray-400 dark:text-gray-500 flex flex-col items-center">
          {icon}
          <p className="mt-2 font-medium text-sm">{label}</p>
          <p className="text-xs mt-1 text-gray-400">JPG, PNG, WEBP (Max 10MB)</p>
        </div>
      )}
      <input 
        id={id}
        type="file" 
        accept="image/jpeg, image/png, image/webp" 
        className="hidden" 
        onChange={onChange} 
      />
    </label>
  )
}
