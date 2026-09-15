import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Download, Smartphone, Apple, CheckCircle, Calendar,
  HardDrive, Info, Shield, Clock, QrCode, ChevronDown, ChevronUp, History, ExternalLink
} from 'lucide-react'

const DEFAULT_IOS_PWA_URL = 'https://hcis.starcoms.co.id/mobile/'

function PlatformBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200 rounded-full px-3 py-1 uppercase tracking-wider">
      <CheckCircle size={11} /> Terdeteksi
    </span>
  )
}

function PwaBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1 uppercase tracking-wider">
      <CheckCircle size={11} /> Tersedia via PWA
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

function formatReleaseDate(date, time) {
  if (!date) return '-'
  return time ? `${date} ${time}` : date
}

function ChangelogDisplay({ value }) {
  if (!value) return null

  const items = value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
  return (
    <div className="rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3.5 mb-5">
      <div className="flex items-center gap-2 mb-2.5 text-xs font-bold uppercase tracking-wider text-orange-700">
        <CheckCircle size={14} />
        Yang baru di versi ini
      </div>
      <ul className="flex flex-col gap-2 text-sm text-gray-600 leading-relaxed">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex items-start gap-2.5">
            <span className="mt-[0.55rem] h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />
            <span>{item.replace(/^[-*+]\s+/, '')}</span>
          </li>
        ))}
      </ul>
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
        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-50 hover:text-orange-500"
      >
        <span className="flex items-center gap-2"><QrCode size={14} />{open ? 'Sembunyikan QR Code' : 'Tampilkan QR Code'}</span>
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

function VersionHistory({ history }) {
  const [open, setOpen] = useState(false)
  const [expandedVersions, setExpandedVersions] = useState(() => new Set())
  const [expandedMonths, setExpandedMonths] = useState(() => new Set())
  if (!history || history.length === 0) return null

  const toggleVersion = (version) => {
    setExpandedVersions((current) => {
      const next = new Set(current)
      if (next.has(version)) next.delete(version)
      else next.add(version)
      return next
    })
  }

  const toggleMonth = (monthKey) => {
    setExpandedMonths((current) => {
      const next = new Set(current)
      if (next.has(monthKey)) next.delete(monthKey)
      else next.add(monthKey)
      return next
    })
  }

  const monthGroups = history.slice().reverse().reduce((groups, item, index) => {
    const monthKey = getHistoryMonthKey(item)
    const current = groups[groups.length - 1]
    if (current?.key === monthKey) current.items.push({ item, index })
    else groups.push({ key: monthKey, label: formatHistoryMonth(item.releaseDate), items: [{ item, index }] })
    return groups
  }, [])

  return (
    <div className="mt-5 border-t border-gray-100 pt-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-50 hover:text-orange-500"
      >
        <span className="flex items-center gap-2">
          <History size={14} />
          Riwayat versi
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-400">{history.length}</span>
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
          {monthGroups.map((group) => {
            const monthExpanded = expandedMonths.has(group.key)
            return (
              <div key={group.key} className="not-first:border-t not-first:border-gray-200">
                <button
                  type="button"
                  onClick={() => toggleMonth(group.key)}
                  className="flex w-full items-center justify-between gap-2 px-1 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500 transition-colors hover:text-orange-600"
                  aria-expanded={monthExpanded}
                >
                  <span className="flex items-center gap-2">
                    {group.label}
                    <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-gray-400">{group.items.length}</span>
                  </span>
                  {monthExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {monthExpanded && (
                  <div className="pb-2">
                    {group.items.map(({ item: h, index }, itemIndex) => {
                      const versionKey = `${h.version}-${h.releaseDate}-${index}`
                      const expanded = expandedVersions.has(versionKey)
                      return (
                        <div key={versionKey} className="flex gap-3 text-xs">
                          <div className="flex w-3 flex-col items-center">
                            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-300 ring-4 ring-orange-50" />
                            {itemIndex < group.items.length - 1 && <div className="my-1 w-px flex-1 bg-gray-200" />}
                          </div>
                          <div className={`min-w-0 flex-1 ${itemIndex < group.items.length - 1 ? 'pb-4' : 'pb-1'}`}>
                            <button
                              type="button"
                              onClick={() => toggleVersion(versionKey)}
                              className="flex w-full items-center justify-between gap-2 text-left transition-colors hover:text-orange-600"
                              aria-expanded={expanded}
                            >
                              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="font-bold text-gray-700">v{h.version}</span>
                                <span className="text-gray-300">•</span>
                                <span className="text-gray-500">{formatReleaseDate(h.releaseDate, h.releaseTime)}</span>
                                {h.fileSize && <span className="text-gray-300">•</span>}
                                {h.fileSize && <span className="text-gray-500">{h.fileSize}</span>}
                              </span>
                              {expanded ? <ChevronUp size={13} className="shrink-0 text-gray-400" /> : <ChevronDown size={13} className="shrink-0 text-gray-400" />}
                            </button>
                            {expanded && h.changelog && (
                              <ul className="mt-2 space-y-1.5 text-gray-500 leading-relaxed">
                                {h.changelog.split(/\r?\n/).map((change, changelogIndex) => (
                                  <li key={`${change}-${changelogIndex}`} className="flex items-start gap-2">
                                    <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                                    <span>{change.replace(/^[-*+]\s+/, '')}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function getHistoryMonthKey(item) {
  return item.releaseDate?.slice(0, 7) || 'unknown'
}

function formatHistoryMonth(date) {
  if (!date) return 'Tanggal tidak diketahui'
  const parsed = new Date(`${date.slice(0, 7)}-01T00:00:00`)
  return Number.isNaN(parsed.getTime())
    ? 'Tanggal tidak diketahui'
    : new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(parsed)
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
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3.5">
            <MetaItem icon={Info} label="Versi" value={`v${data.version}`} />
            <MetaItem icon={Calendar} label="Rilis" value={formatReleaseDate(data.releaseDate, data.releaseTime)} />
            <MetaItem icon={HardDrive} label="Ukuran" value={data.fileSize} />
            <MetaItem icon={Shield} label="Minimum" value={data.minOsVersion} />
          </div>
          <ChangelogDisplay value={data.changelog} />
          <div className="mt-auto">
            <DownloadButton url={data.downloadUrl} label="Download APK" variant={detected ? 'primary' : 'secondary'} />
          </div>
          <VersionHistory history={data.history} />
          <QRPanel url={data.downloadUrl} label="Android APK" />
        </>
      )}
    </div>
  )
}

function IosCard({ data, detected }) {
  const pwaUrl = data.pwaUrl || DEFAULT_IOS_PWA_URL
  return (
    <div className={`relative flex flex-col rounded-2xl border bg-white p-6 transition-all duration-200
      ${detected ? 'border-indigo-400 shadow-xl shadow-indigo-100 ring-2 ring-indigo-300/40 scale-[1.02]'
        : 'border-indigo-200 shadow-sm hover:shadow-md'}`}>
      <div className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap">
        <PwaBadge />
        {detected && <PlatformBadge />}
      </div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100">
          <Apple size={26} className="text-gray-700" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-800">iOS</h3>
          <p className="text-xs text-indigo-500 font-medium">HCIS PWA untuk iPhone/iPad</p>
        </div>
      </div>
      <div className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3.5">
        <p className="text-sm font-semibold text-indigo-800">Akses langsung dari browser</p>
        <p className="mt-1 text-xs leading-relaxed text-indigo-600">Tidak perlu install IPA. Buka PWA di Safari, lalu pilih “Add to Home Screen” untuk memasangnya di iPhone.</p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3.5">
        <MetaItem icon={Info} label="Versi" value={`v${data.version}`} />
        <MetaItem icon={Calendar} label="Rilis" value={formatReleaseDate(data.releaseDate, data.releaseTime)} />
        <MetaItem icon={Shield} label="Minimum" value={data.minOsVersion} />
        <MetaItem icon={Smartphone} label="Akses" value="Safari / PWA" />
      </div>
      <ChangelogDisplay value={data.changelog} />
      <div className="mt-auto">
        <a
          href={pwaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 rounded-xl font-semibold text-sm transition-all duration-200 px-5 py-2.5 ${detected ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'}`}
        >
          <ExternalLink size={15} />
          Buka HCIS PWA
        </a>
      </div>
      <VersionHistory history={data.history} />
      <QRPanel url={pwaUrl} label="HCIS PWA" />
    </div>
  )
}

export default function DownloadPage({ releases, onAdminClick }) {
  const data = releases

  const ua = navigator.userAgent.toLowerCase()
  const isAndroid = /android/.test(ua)
  const isIos = /ipad|iphone|ipod/.test(ua)
  const iosPwaUrl = data.ios.pwaUrl || DEFAULT_IOS_PWA_URL
  const iosPwaAvailable = Boolean(iosPwaUrl)

  const detectedPlatform = isIos ? 'ios' : 'android'
  const detectedEnabled = isIos ? iosPwaAvailable : data.android.enabled
  const fallbackPlatform = data.android.enabled ? 'android' : iosPwaAvailable ? 'ios' : null
  const heroPlatform = detectedEnabled ? detectedPlatform : fallbackPlatform
  const heroData = heroPlatform === 'ios' ? data.ios : data.android
  const bothDisabled = !data.android.enabled && !iosPwaAvailable
  const heroUrl = heroPlatform === 'ios' ? iosPwaUrl : heroData?.downloadUrl

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
              href={heroUrl || '#'}
              {...(heroPlatform === 'ios'
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : { download: true })}
              onClick={(e) => { if (!heroUrl || heroUrl === '#') e.preventDefault() }}
              className="inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white font-bold text-base rounded-2xl px-8 py-4 shadow-lg shadow-gray-900/20 transition-all duration-200 active:scale-95"
            >
              {heroPlatform === 'ios' ? <ExternalLink size={20} /> : <Download size={20} />}
              {heroPlatform === 'ios' ? 'Buka HCIS PWA' : 'Download untuk Android'}
            </a>
          )}

          {!bothDisabled && heroData && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">v{heroData.version}</span>
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-xs text-gray-400">Rilis {formatReleaseDate(heroData.releaseDate, heroData.releaseTime)}</span>
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

        {(data.android.enabled || iosPwaAvailable) && (
          <p className="mt-10 text-xs text-gray-400 text-center max-w-md">
            {data.android.enabled && <>Untuk instalasi Android, pastikan opsi <strong>"Sumber Tidak Dikenal"</strong> diaktifkan di pengaturan perangkat Anda.</>}
            {data.android.enabled && iosPwaAvailable && ' '}
            {iosPwaAvailable && 'iOS tersedia melalui PWA di Safari.'}
          </p>
        )}
      </main>

      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400 bg-white">
        &copy; {new Date().getFullYear()} HCIS &mdash; Human Capital Information System
      </footer>
    </div>
  )
}
