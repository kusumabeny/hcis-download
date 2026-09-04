import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Download, Smartphone, Apple, CheckCircle, Calendar,
  HardDrive, Info, Shield, Clock, QrCode, ChevronDown, ChevronUp, History
} from 'lucide-react'

function PlatformBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200 rounded-full px-3 py-1 uppercase tracking-wider">
      <CheckCircle size={11} /> Terdeteksi
    </span>
  )
}

function ComingSoonBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200 rounded-full px-3 py-1 uppercase tracking-wider">
      <Clock size={11} /> Segera Hadir
    </span>
  )
}

function DownloadButton({ url, label, variant = 'primary' }) {
  const base = 'inline-flex items-center gap-2 rounded-xl font-semibold text-sm transition-all duration-200 px-5 py-2.5'
  const styles = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200 active:scale-95 cursor-pointer',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 active:scale-95 cursor-pointer',
  }
  return (
    <a
      href={url || '#'}
      className={`${base} ${styles[variant]}`}
      download
      onClick={(e) => { if (!url || url === '#') e.preventDefault() }}
    >
      <Download size={15} />
      {label}
    </a>
  )
}

function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <Icon size={14} className="text-gray-400 shrink-0" />
      <span className="text-gray-400">{label}:</span>
      <span className="font-medium text-gray-600">{value}</span>
    </div>
  )
}

function QRPanel({ url, label }) {
  const [open, setOpen] = useState(false)
  const fullUrl = url && url !== '#'
    ? (url.startsWith('http') ? url : `${window.location.origin}${url}`)
    : null

  if (!fullUrl) return null

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-xs text-gray-400 hover:text-orange-500 transition-colors font-medium"
      >
        <QrCode size={13} />
        {open ? 'Sembunyikan QR Code' : 'Tampilkan QR Code'}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="mt-3 flex flex-col items-center gap-2">
          <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
            <QRCodeSVG
              value={fullUrl}
              size={140}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-xs text-gray-400 text-center max-w-40">
            Scan untuk download {label}
          </p>
        </div>
      )}
    </div>
  )
}

function VersionHistory({ history, platform }) {
  const [open, setOpen] = useState(false)
  if (!history || history.length === 0) return null

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-xs text-gray-400 hover:text-orange-500 transition-colors font-medium"
      >
        <History size={13} />
        Riwayat Versi ({history.length})
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-2">
          {history.slice().reverse().map((h, i) => (
            <div key={i} className="flex gap-3 text-xs">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-gray-300 mt-1 shrink-0" />
                {i < history.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
              </div>
              <div className="pb-2 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-gray-600">v{h.version}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-400">{h.releaseDate}</span>
                  {h.fileSize && <span className="text-gray-300">·</span>}
                  {h.fileSize && <span className="text-gray-400">{h.fileSize}</span>}
                </div>
                {h.changelog && (
                  <p className="text-gray-400 leading-relaxed">{h.changelog}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DisabledCardOverlay({ platform }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 flex-1">
      <Clock size={32} className="text-gray-300" />
      <p className="font-semibold text-gray-400 text-sm">
        {platform === 'android' ? 'Android' : 'iOS'} Segera Hadir
      </p>
      <p className="text-xs text-gray-400 text-center max-w-45 leading-relaxed">
        Platform ini belum tersedia. Pantau terus untuk pembaruan.
      </p>
    </div>
  )
}

function AndroidIcon({ disabled }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
      <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0 0 12 1.5c-.73 0-1.42.14-2.06.38L8.46.41c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.3 1.3A5.957 5.957 0 0 0 6 7h12a5.957 5.957 0 0 0-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"
        fill={disabled ? '#d1d5db' : '#4CAF50'} />
    </svg>
  )
}

function AndroidCard({ data, detected }) {
  const disabled = !data.enabled
  return (
    <div className={`relative flex flex-col rounded-2xl border bg-white p-6 transition-all duration-200
      ${disabled ? 'border-gray-100 shadow-none opacity-70'
        : detected ? 'border-orange-400 shadow-xl shadow-orange-100 ring-2 ring-orange-300/40 scale-[1.02]'
        : 'border-gray-200 shadow-sm hover:shadow-md'}`}>
      {!disabled && detected && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2"><PlatformBadge /></div>
      )}
      {disabled && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2"><ComingSoonBadge /></div>
      )}
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${disabled ? 'bg-gray-50 border border-gray-100' : 'bg-green-50 border border-green-100'}`}>
          <AndroidIcon disabled={disabled} />
        </div>
        <div>
          <h3 className={`font-bold text-lg ${disabled ? 'text-gray-400' : 'text-gray-800'}`}>Android</h3>
          <p className="text-xs text-gray-400">APK</p>
        </div>
      </div>
      {disabled ? <DisabledCardOverlay platform="android" /> : (
        <>
          <div className="flex flex-col gap-3 mb-5">
            <MetaItem icon={Info} label="Versi" value={`v${data.version}`} />
            <MetaItem icon={Calendar} label="Rilis" value={data.releaseDate} />
            <MetaItem icon={HardDrive} label="Ukuran" value={data.fileSize} />
            <MetaItem icon={Shield} label="Minimum" value={data.minOsVersion} />
          </div>
          {data.changelog && (
            <p className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-4 leading-relaxed">
              {data.changelog}
            </p>
          )}
          <div className="mt-auto">
            <DownloadButton url={data.downloadUrl} label="Download APK" variant={detected ? 'primary' : 'secondary'} />
          </div>
          <VersionHistory history={data.history} platform="android" />
          <QRPanel url={data.downloadUrl} label="Android APK" />
        </>
      )}
    </div>
  )
}

function IosCard({ data, detected }) {
  const disabled = !data.enabled
  return (
    <div className={`relative flex flex-col rounded-2xl border bg-white p-6 transition-all duration-200
      ${disabled ? 'border-gray-100 shadow-none opacity-70'
        : detected ? 'border-orange-400 shadow-xl shadow-orange-100 ring-2 ring-orange-300/40 scale-[1.02]'
        : 'border-gray-200 shadow-sm hover:shadow-md'}`}>
      {!disabled && detected && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2"><PlatformBadge /></div>
      )}
      {disabled && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2"><ComingSoonBadge /></div>
      )}
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${disabled ? 'bg-gray-50 border border-gray-100' : 'bg-gray-50 border border-gray-100'}`}>
          <Apple size={26} className={disabled ? 'text-gray-300' : 'text-gray-700'} />
        </div>
        <div>
          <h3 className={`font-bold text-lg ${disabled ? 'text-gray-400' : 'text-gray-800'}`}>iOS</h3>
          <p className="text-xs text-gray-400">IPA / App Store</p>
        </div>
      </div>
      {disabled ? <DisabledCardOverlay platform="ios" /> : (
        <>
          <div className="flex flex-col gap-3 mb-5">
            <MetaItem icon={Info} label="Versi" value={`v${data.version}`} />
            <MetaItem icon={Calendar} label="Rilis" value={data.releaseDate} />
            <MetaItem icon={HardDrive} label="Ukuran" value={data.fileSize} />
            <MetaItem icon={Shield} label="Minimum" value={data.minOsVersion} />
          </div>
          {data.changelog && (
            <p className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-4 leading-relaxed">
              {data.changelog}
            </p>
          )}
          <div className="mt-auto">
            <DownloadButton url={data.downloadUrl} label="Download iOS" variant={detected ? 'primary' : 'secondary'} />
          </div>
          <VersionHistory history={data.history} platform="ios" />
          <QRPanel url={data.downloadUrl} label="iOS" />
        </>
      )}
    </div>
  )
}

export default function DownloadPage({ releases, onAdminClick }) {
  const data = releases

  const ua = navigator.userAgent.toLowerCase()
  const isAndroid = /android/.test(ua)
  const isIos = /ipad|iphone|ipod/.test(ua)

  const detectedPlatform = isIos ? 'ios' : 'android'
  const detectedEnabled = isIos ? data.ios.enabled : data.android.enabled
  const fallbackPlatform = data.android.enabled ? 'android' : data.ios.enabled ? 'ios' : null
  const heroPlatform = detectedEnabled ? detectedPlatform : fallbackPlatform
  const heroData = heroPlatform === 'ios' ? data.ios : data.android
  const bothDisabled = !data.android.enabled && !data.ios.enabled

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
              <Smartphone size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-800 text-base leading-none block">HCIS</span>
              <span className="text-xs text-gray-400 leading-none">Mobile</span>
            </div>
          </div>
          <button
            onClick={onAdminClick}
            className="text-xs text-gray-400 hover:text-orange-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-orange-50 border border-transparent hover:border-orange-100"
          >
            Admin Panel
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start pt-14 pb-16 px-4">
        <div className="text-center mb-12 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-600 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6">
            <Smartphone size={12} /> {data.appName}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 leading-tight">
            Unduh <span className="text-orange-500">HCIS Mobile</span>
          </h1>
          <p className="text-gray-500 text-base mb-6">{data.appTagline}</p>

          {bothDisabled ? (
            <div className="inline-flex items-center gap-3 bg-gray-100 text-gray-400 font-bold text-base rounded-2xl px-8 py-4 cursor-default select-none">
              <Clock size={20} /> Aplikasi Segera Hadir
            </div>
          ) : (
            <a
              href={heroData?.downloadUrl || '#'}
              download
              onClick={(e) => { if (!heroData?.downloadUrl || heroData.downloadUrl === '#') e.preventDefault() }}
              className="inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white font-bold text-base rounded-2xl px-8 py-4 shadow-lg shadow-gray-900/20 transition-all duration-200 active:scale-95"
            >
              <Download size={20} />
              {heroPlatform === 'ios' ? 'Download untuk iOS' : 'Download untuk Android'}
            </a>
          )}

          {!bothDisabled && heroData && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">v{heroData.version}</span>
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-xs text-gray-400">Rilis {heroData.releaseDate}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mb-10 w-full max-w-3xl">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Semua Platform</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          <AndroidCard data={data.android} detected={isAndroid} />
          <IosCard data={data.ios} detected={isIos} />
        </div>

        {data.android.enabled && (
          <p className="mt-10 text-xs text-gray-400 text-center max-w-md">
            Untuk instalasi Android, pastikan opsi <strong>"Sumber Tidak Dikenal"</strong> diaktifkan di pengaturan perangkat Anda.
            {data.ios.enabled && ' iOS hanya tersedia melalui TestFlight atau distribusi enterprise.'}
          </p>
        )}
      </main>

      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400 bg-white">
        &copy; {new Date().getFullYear()} HCIS &mdash; Human Capital Information System
      </footer>
    </div>
  )
}
