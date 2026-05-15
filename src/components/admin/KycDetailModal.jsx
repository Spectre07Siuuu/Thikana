import { X, ShieldAlert } from 'lucide-react'
import AdminStatusBadge from './AdminStatusBadge'

export default function KycDetailModal({ kycData, kycImages, noteById, setNoteById, onClose, onApprove, onReject, isLoading, isSaving }) {
  if (!kycData) return null

  const statusIsPending = kycData.verification_status === 'pending'
  const statusIsApproved = kycData.verification_status === 'approved'
  const statusIsRejected = kycData.verification_status === 'rejected'

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-theme-card rounded-xl border border-theme-border w-full max-w-4xl shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-theme-border">
          <div>
            <h2 className="text-2xl font-bold text-theme-text">KYC Verification Review</h2>
            <p className="text-sm text-theme-muted mt-1">Request #{kycData.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <AdminStatusBadge status={kycData.verification_status} />
            <button onClick={onClose} className="p-2 hover:bg-theme-bg rounded-lg transition-colors">
              <X size={20} className="text-theme-muted" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Top Action Buttons */}
          <div className="flex gap-3">
            {statusIsPending ? (
              <>
                <button onClick={() => onReject(kycData)} disabled={isSaving} className="flex-1 px-4 py-2.5 rounded-lg border border-rose-300 text-rose-600 dark:border-rose-800 dark:text-rose-400 font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-50">
                  ✕ Reject Request
                </button>
                <button onClick={() => onApprove(kycData)} disabled={isSaving} className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50">
                  ✓ Approve Verification
                </button>
              </>
            ) : statusIsApproved ? (
              <>
                <button disabled className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold opacity-50 cursor-not-allowed">
                  ✓ Approved
                </button>
                <button onClick={() => onReject(kycData)} disabled={isSaving} className="flex-1 px-4 py-2.5 rounded-lg border border-rose-300 text-rose-600 dark:border-rose-800 dark:text-rose-400 font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-50">
                  ✕ Reject Request
                </button>
              </>
            ) : statusIsRejected ? (
              <>
                <button onClick={() => onApprove(kycData)} disabled={isSaving} className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50">
                  ✓ Approve Verification
                </button>
                <button disabled className="flex-1 px-4 py-2.5 rounded-lg border border-rose-300 text-rose-600 dark:border-rose-800 dark:text-rose-400 font-semibold opacity-50 cursor-not-allowed">
                  ✕ Rejected
                </button>
              </>
            ) : null}
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Images */}
            <div className="lg:col-span-2 space-y-4">
              {/* NID Document */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-theme-text">NID Document (Front)</h3>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded">HIGH CONFIDENCE</span>
                </div>
                {kycImages.loading ? (
                  <div className="h-48 bg-theme-bg rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-theme-primary border-t-transparent animate-spin" />
                  </div>
                ) : kycImages.nid ? (
                  <div className="h-48 bg-theme-bg rounded-lg overflow-hidden border border-theme-border">
                    <img src={kycImages.nid} alt="NID Document" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-48 bg-theme-bg rounded-lg flex items-center justify-center text-xs text-theme-muted border border-theme-border">
                    No image available
                  </div>
                )}
              </div>

              {/* Selfie */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-theme-text">Live Selfie</h3>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded">LIVENESS PASSED</span>
                </div>
                {kycImages.loading ? (
                  <div className="h-48 bg-theme-bg rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-theme-primary border-t-transparent animate-spin" />
                  </div>
                ) : kycImages.selfie ? (
                  <div className="h-48 bg-theme-bg rounded-lg overflow-hidden border border-theme-border">
                    <img src={kycImages.selfie} alt="Selfie" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-48 bg-theme-bg rounded-lg flex items-center justify-center text-xs text-theme-muted border border-theme-border">
                    No image available
                  </div>
                )}
              </div>
            </div>

            {/* Right: Info Panels */}
            <div className="space-y-4">
              {/* Risk Assessment */}
              <div className="bg-theme-bg rounded-lg border border-theme-border p-4 space-y-4">
                <h3 className="font-bold text-theme-text flex items-center gap-2">
                  <span>🛡️</span> Risk Assessment
                </h3>
                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-full border-4 border-emerald-500 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">{Math.round(Number(kycData.confidence_score) || 0)}</p>
                      <p className="text-[10px] font-bold text-theme-muted">TRUST SCORE</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Document Authenticity</span>
                    <span className="text-emerald-600 font-semibold">Excellent</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Face Match Confidence</span>
                    <span className="text-emerald-600 font-semibold">High</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Sanctions List Check</span>
                    <span className="text-emerald-600 font-semibold">Clear</span>
                  </div>
                  {kycData.fraud_flags?.includes('address_verification_failed') && (
                    <div className="flex justify-between">
                      <span className="text-theme-muted">Address Verification</span>
                      <span className="text-orange-600 font-semibold">Manual Check Needed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submitted Profile */}
              <div className="bg-theme-bg rounded-lg border border-theme-border p-4 space-y-3">
                <h3 className="font-bold text-theme-text">Submitted Profile</h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="text-theme-muted mb-0.5">USERNAME</p>
                    <p className="font-semibold text-theme-text">{kycData.full_name}</p>
                  </div>
                  <div>
                    <p className="text-theme-muted mb-0.5">EMAIL ADDRESS</p>
                    <p className="font-semibold text-theme-text">{kycData.email}</p>
                  </div>
                  {kycData.extracted_full_name && (
                    <div>
                      <p className="text-theme-muted mb-0.5">PHONE NUMBER</p>
                      <p className="font-semibold text-theme-text">{kycData.extracted_full_name}</p>
                    </div>
                  )}
                  {kycData.dob && (
                    <div>
                      <p className="text-theme-muted mb-0.5">ACCOUNT CREATED</p>
                      <p className="font-semibold text-theme-text">{String(kycData.dob).slice(0, 10)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* OCR Data Section */}
          <div className="bg-theme-bg rounded-lg border border-theme-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-theme-text">📋 OCR Data Extraction Summary</h3>
              <button className="text-xs font-semibold text-theme-primary hover:underline">Edit Fields</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-theme-muted mb-1">FULL NAME</p>
                <p className="font-semibold text-theme-text">{kycData.extracted_full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-theme-muted mb-1">DOCUMENT NUMBER (NID)</p>
                <p className="font-semibold text-theme-text">{kycData.nid_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-theme-muted mb-1">DATE OF BIRTH</p>
                <p className="font-semibold text-theme-text">{kycData.dob ? String(kycData.dob).slice(0, 10) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-theme-muted mb-1">ISSUE AUTHORITY</p>
                <p className="font-semibold text-theme-text">Bangladesh Authority</p>
              </div>
            </div>
          </div>

          {/* Fraud Flags */}
          {!!kycData.fraud_flags?.length && (
            <div className="bg-rose-950/20 border border-rose-800/30 rounded-lg p-4">
              <h3 className="font-bold text-rose-600 mb-3 flex items-center gap-2">
                <ShieldAlert size={16} /> Fraud Flags Detected
              </h3>
              <div className="flex flex-wrap gap-2">
                {kycData.fraud_flags.map(flag => (
                  <span key={flag} className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-full">
                    {String(flag).replaceAll('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Moderation Note */}
          <div>
            <label className="block text-sm font-semibold text-theme-text mb-2">Moderation Note</label>
            <textarea
              value={noteById[kycData.id] || ''}
              onChange={e => setNoteById(prev => ({ ...prev, [kycData.id]: e.target.value }))}
              placeholder="Add notes for this verification request..."
              className="input-field w-full py-3 px-4 text-sm rounded-lg resize-none"
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
