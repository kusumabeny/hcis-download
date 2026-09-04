import { useState } from 'react'
import { Smartphone, Lock, Eye, EyeOff, AlertCircle, HelpCircle, X } from 'lucide-react'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

export default function AdminLogin({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')

    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('hcis_admin_auth', '1')
        onSuccess()
      } else {
        setError('Password salah. Silakan coba lagi.')
        setShaking(true)
        setPassword('')
        setTimeout(() => setShaking(false), 500)
      }
      setLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
            <Smartphone size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-800 text-base leading-none block">HCIS</span>
            <span className="text-xs text-gray-400 leading-none">Admin Panel</span>
          </div>
        </div>
      </header>

      {/* Login card */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className={`w-full max-w-sm ${shaking ? 'animate-shake' : ''}`}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                <Lock size={24} className="text-orange-500" />
              </div>
            </div>

            <h1 className="text-xl font-bold text-gray-900 text-center mb-1">Masuk Admin Panel</h1>
            <p className="text-sm text-gray-400 text-center mb-7">Masukkan password untuk melanjutkan</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="Password"
                  autoFocus
                  className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-white
                    ${error ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-orange-400'}`}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <AlertCircle size={15} className="shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!password || loading}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm transition-all duration-200
                  ${password && !loading
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200 active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Lock size={15} />
                )}
                {loading ? 'Memverifikasi...' : 'Masuk'}
              </button>
            </form>
          </div>

          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="flex items-center justify-center gap-1.5 mx-auto mt-5 text-sm text-orange-600 hover:text-orange-700 transition-colors"
          >
            <HelpCircle size={15} />
            Lupa password?
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Hanya untuk administrator HCIS
          </p>
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 px-4" onClick={() => setShowHelp(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-help-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="password-help-title" className="font-bold text-gray-900">Pemulihan password</h2>
                <p className="mt-1 text-sm text-gray-500">Password admin tidak dapat dikirim lewat email karena disimpan di konfigurasi deployment.</p>
              </div>
              <button type="button" onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-600" aria-label="Tutup">
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 rounded-xl bg-orange-50 px-4 py-3 text-sm text-gray-700">
              Minta administrator server mengatur <code className="font-semibold text-orange-700">VITE_ADMIN_PASSWORD</code>, lalu rebuild dan restart aplikasi.
            </div>
            <p className="mt-4 text-xs leading-relaxed text-gray-400">
              Untuk instalasi default yang belum dikonfigurasi, password-nya adalah <span className="font-semibold text-gray-600">admin123</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
