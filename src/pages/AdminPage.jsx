import { useState, useRef } from 'react'
import {
  ArrowLeft, Save, Smartphone, Apple, Upload, Eye,
  RefreshCcw, CheckCircle, AlertCircle, ToggleLeft,
  ToggleRight, LogOut, FileUp, X, File, Link, History, Trash2
} from 'lucide-react'
import defaultData from '../data/releases.json'

const defaultForm = (data) => ({
  android: { ...data.android, history: data.android.history ?? [] },
  ios: { ...data.ios, history: data.ios.history ?? [] },
  appName: data.appName,
  appTagline: data.appTagline,
})

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function Field({ label, id, type = 'text', value, onChange, placeholder, hint, disabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={`text-sm font-semibold ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={id} rows={3} disabled={disabled}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
          value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        />
      ) : (
        <input
          id={id} type={type} disabled={disabled}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
          value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        />
      )}
      {hint && <p className={`text-xs ${disabled ? 'text-gray-300' : 'text-gray-400'}`}>{hint}</p>}
    </div>
  )
}

function EnableToggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border transition-all duration-200 select-none
        ${enabled
          ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
          : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'}`}
    >
      {enabled
        ? <ToggleRight size={18} className="text-green-500" />
        : <ToggleLeft size={18} className="text-gray-400" />}
      {enabled ? 'Aktif' : 'Nonaktif'}
    </button>
  )
}

function FileUploader({ platform, disabled, onUploaded }) {
  const inputRef = useRef(null)
  const [state, setState] = useState('idle') // idle | uploading | done | error
  const [progress, setProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [dragging, setDragging] = useState(false)

  const accept = platform === 'android' ? '.apk,.aab' : '.ipa'
  const label = platform === 'android' ? 'APK / AAB' : 'IPA'

  const doUpload = (file) => {
    if (!file) return
    setState('uploading')
    setProgress(0)
    setErrorMsg('')

    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/upload/${platform}`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText)
        const meta = { version: res.version, minOs: res.minOs }
        setUploadedFile({ name: file.name, size: file.size, url: res.url, meta })
        setState('done')
        onUploaded({
          url: res.url,
          fileSize: res.fileSize,
          version: res.version,
          minOs: res.minOs,
        })
      } else {
        const res = JSON.parse(xhr.responseText)
        setErrorMsg(res.error || 'Upload gagal')
        setState('error')
      }
    }

    xhr.onerror = () => {
      setErrorMsg('Koneksi ke server gagal. Pastikan server berjalan.')
      setState('error')
    }

    xhr.send(formData)
  }

  const handleChange = (e) => doUpload(e.target.files?.[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (!disabled) doUpload(e.dataTransfer.files?.[0])
  }

  const handleClear = () => {
    setState('idle')
    setUploadedFile(null)
    setProgress(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  if (disabled) return null

  return (
    <div className="md:col-span-2 flex flex-col gap-2">
      <span className="text-sm font-semibold text-gray-700">Upload File {label}</span>

      {state === 'idle' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl px-6 py-7 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200
            ${dragging ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'}`}
        >
          <FileUp size={28} className="text-gray-300" />
          <p className="text-sm font-medium text-gray-500">
            Drag & drop atau <span className="text-orange-500">klik untuk pilih file</span>
          </p>
          <p className="text-xs text-gray-400">{label} &mdash; maks. 500 MB</p>
          <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
        </div>
      )}

      {state === 'uploading' && (
        <div className="border border-gray-200 rounded-xl px-5 py-4 flex flex-col gap-3 bg-white">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">Mengupload...</span>
            <span className="text-orange-500 font-semibold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {state === 'done' && uploadedFile && (
        <div className="border border-green-200 bg-green-50 rounded-xl px-5 py-3.5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center shrink-0 mt-0.5">
            <File size={16} className="text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800 truncate">{uploadedFile.name}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              <span className="text-xs text-green-600">{formatBytes(uploadedFile.size)}</span>
              {uploadedFile.meta?.version && (
                <span className="text-xs text-green-600">Versi: <strong>{uploadedFile.meta.version}</strong></span>
              )}
              {uploadedFile.meta?.minOs && (
                <span className="text-xs text-green-600">Min OS: <strong>{uploadedFile.meta.minOs}</strong></span>
              )}
              {!uploadedFile.meta?.version && !uploadedFile.meta?.minOs && (
                <span className="text-xs text-green-500 italic">Metadata tidak ditemukan — isi manual</span>
              )}
            </div>
          </div>
          <button onClick={handleClear} className="text-green-400 hover:text-red-400 transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="border border-red-200 bg-red-50 rounded-xl px-5 py-3.5 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-700 flex-1">{errorMsg}</p>
          <button onClick={handleClear} className="text-red-400 hover:text-red-600 transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 mt-1">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400 flex items-center gap-1"><Link size={10} /> atau isi URL manual di bawah</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
    </div>
  )
}

function HistoryPanel({ history, onDelete }) {
  const [open, setOpen] = useState(false)
  if (!history || history.length === 0) return (
    <div className="md:col-span-2 text-xs text-gray-400 italic">Belum ada riwayat versi. Riwayat otomatis tersimpan saat Anda menyimpan versi baru yang berbeda.</div>
  )
  return (
    <div className="md:col-span-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-orange-500 transition-colors mb-2"
      >
        <History size={15} />
        Riwayat Versi ({history.length})
        {open ? ' ▲' : ' ▼'}
      </button>
      {open && (
        <div className="flex flex-col gap-2">
          {history.map((h, i) => (
            <div key={i} className="flex items-start justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 gap-3">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-700">v{h.version}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-400 text-xs">{h.releaseDate}</span>
                  {h.fileSize && <><span className="text-gray-300">·</span><span className="text-gray-400 text-xs">{h.fileSize}</span></>}
                </div>
                {h.changelog && <p className="text-xs text-gray-400 leading-relaxed">{h.changelog}</p>}
              </div>
              <button
                onClick={() => onDelete(i)}
                className="text-gray-300 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                title="Hapus entri ini"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PlatformSection({ title, platform, form, setForm, setDirty, androidIconEl, showToast }) {
  const data = form[platform]
  const disabled = !data.enabled
  const isIos = platform === 'ios'

  const update = (key, val) => {
    setForm((prev) => ({ ...prev, [platform]: { ...prev[platform], [key]: val } }))
    setDirty(true)
  }

  const handleUploaded = ({ url, fileSize, version, minOs }) => {
    setForm((prev) => {
      const updated = { ...prev[platform], downloadUrl: url }
      if (fileSize) updated.fileSize = fileSize
      if (version) updated.version = version
      if (minOs) updated.minOsVersion = minOs
      return { ...prev, [platform]: updated }
    })
    setDirty(true)
    const filled = [version && 'versi', minOs && 'minimum OS', 'ukuran file'].filter(Boolean)
    showToast('success', `Upload berhasil! Auto-isi: ${filled.join(', ')}.`)
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${disabled ? 'border-gray-100 opacity-75' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isIos ? 'bg-gray-50 border border-gray-100' : 'bg-green-50 border border-green-100'}`}>
            {isIos
              ? <Apple size={18} className={disabled ? 'text-gray-300' : 'text-gray-700'} />
              : androidIconEl}
          </div>
          <div>
            <h2 className={`font-bold ${disabled ? 'text-gray-400' : 'text-gray-800'}`}>{title}</h2>
            {disabled && <p className="text-xs text-gray-400">Platform ini tidak ditampilkan di halaman download</p>}
          </div>
        </div>
        <EnableToggle enabled={data.enabled} onChange={(v) => update('enabled', v)} />
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="Versi" id={`${platform}-version`} value={data.version}
          onChange={(v) => update('version', v)} placeholder="1.0.0" hint="Contoh: 1.2.3" disabled={disabled}
        />
        <Field
          label="Tanggal Rilis" id={`${platform}-date`} type="date"
          value={data.releaseDate} onChange={(v) => update('releaseDate', v)} disabled={disabled}
        />

        {/* File uploader — full width */}
        <FileUploader platform={platform} disabled={disabled} onUploaded={handleUploaded} />

        <Field
          label="URL File / Link Download" id={`${platform}-url`} value={data.downloadUrl}
          onChange={(v) => update('downloadUrl', v)} placeholder="https://... atau /downloads/hcis-android.apk"
          hint="Terisi otomatis setelah upload, atau isi manual" disabled={disabled}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Ukuran File" id={`${platform}-size`} value={data.fileSize}
            onChange={(v) => update('fileSize', v)} placeholder="45 MB" disabled={disabled}
          />
          <Field
            label="Minimum OS" id={`${platform}-os`} value={data.minOsVersion}
            onChange={(v) => update('minOsVersion', v)} placeholder="Android 8.0+" disabled={disabled}
          />
        </div>
        <div className="md:col-span-2">
          <Field
            label="Changelog / Catatan Rilis" id={`${platform}-changelog`} type="textarea"
            value={data.changelog} onChange={(v) => update('changelog', v)}
            placeholder="Deskripsi singkat perubahan di versi ini..." disabled={disabled}
          />
        </div>

        {/* History section */}
        <div className="md:col-span-2 border-t border-gray-100 pt-4">
          <HistoryPanel
            history={data.history ?? []}
            onDelete={(idx) => {
              const newHistory = (data.history ?? []).filter((_, i) => i !== idx)
              update('history', newHistory)
              setDirty(true)
            }}
          />
        </div>
      </div>
    </div>
  )
}

function Toast({ type, message, onClose }) {
  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-xl text-sm font-medium z-50 ${type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
      {type === 'success' ? <CheckCircle size={18} className="text-green-500" /> : <AlertCircle size={18} className="text-red-500" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 text-lg leading-none">&times;</button>
    </div>
  )
}

const AndroidSvg = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="#4CAF50">
    <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0 0 12 1.5c-.73 0-1.42.14-2.06.38L8.46.41c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.3 1.3A5.957 5.957 0 0 0 6 7h12a5.957 5.957 0 0 0-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
  </svg>
)

export default function AdminPage({ releases, onSave, onBack, onLogout }) {
  const [form, setForm] = useState(defaultForm(releases))
  const [toast, setToast] = useState(null)
  const [dirty, setDirty] = useState(false)

  const handleChange = (updater) => {
    setForm(updater)
    setDirty(true)
  }

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSave = () => {
    // Auto-push versi lama ke history jika versi berubah
    const updated = { ...form }
    for (const platform of ['android', 'ios']) {
      const prev = releases[platform]
      const curr = form[platform]
      if (prev.version && curr.version && prev.version !== curr.version && prev.downloadUrl && prev.downloadUrl !== '#') {
        const historyEntry = {
          version: prev.version,
          releaseDate: prev.releaseDate,
          changelog: prev.changelog,
          fileSize: prev.fileSize,
        }
        updated[platform] = {
          ...curr,
          history: [historyEntry, ...(curr.history ?? [])].slice(0, 10),
        }
      }
    }
    onSave(updated)
    setForm(defaultForm(updated))
    setDirty(false)
    showToast('success', 'Data berhasil disimpan!')
  }

  const handleReset = () => {
    setForm(defaultForm(defaultData))
    setDirty(false)
    showToast('success', 'Form direset ke data default.')
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(form, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'releases.json'
    a.click()
    URL.revokeObjectURL(url)
    showToast('success', 'File releases.json diunduh!')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 transition-colors rounded-xl px-3 py-2 hover:bg-orange-50">
              <ArrowLeft size={16} /> Kembali
            </button>
            <div className="w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
                <Smartphone size={15} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-gray-800 text-sm leading-none block">HCIS Admin</span>
                <span className="text-xs text-gray-400 leading-none">Manajemen Rilis</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onLogout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-200 hover:border-red-100 rounded-xl px-4 py-2 transition-colors" title="Keluar dari admin">
              <LogOut size={14} /> Logout
            </button>
            <button onClick={handleReset} className="flex items-center gap-2 text-sm text-gray-500 border border-gray-200 hover:bg-gray-100 rounded-xl px-4 py-2 transition-colors">
              <RefreshCcw size={14} /> Reset
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-100 rounded-xl px-4 py-2 transition-colors">
              <Upload size={14} /> Export JSON
            </button>
            <button onClick={handleSave} disabled={!dirty}
              className={`flex items-center gap-2 text-sm font-semibold rounded-xl px-5 py-2 transition-all duration-200 ${dirty ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200 active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
              <Save size={14} /> Simpan
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">Informasi Aplikasi</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nama Aplikasi" id="app-name" value={form.appName}
                onChange={(v) => handleChange((p) => ({ ...p, appName: v }))} placeholder="HCIS Mobile" />
              <Field label="Tagline" id="app-tagline" value={form.appTagline}
                onChange={(v) => handleChange((p) => ({ ...p, appTagline: v }))} placeholder="Human Capital Information System" />
            </div>
          </div>

          <PlatformSection title="Android" platform="android" form={form} setForm={setForm} setDirty={setDirty} androidIconEl={<AndroidSvg />} showToast={showToast} />
          <PlatformSection title="iOS" platform="ios" form={form} setForm={setForm} setDirty={setDirty} showToast={showToast} />

          <div className="bg-orange-50 border border-orange-100 rounded-2xl px-6 py-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-orange-400 mt-0.5 shrink-0" />
            <div className="text-sm text-orange-700 leading-relaxed">
              <strong>Upload file:</strong> File disimpan di server ({' '}
              <code className="bg-orange-100 px-1 rounded text-xs">dist/downloads/</code>). Setelah upload, klik{' '}
              <strong>Simpan</strong> agar URL tersimpan ke konfigurasi.
            </div>
          </div>

        </div>
      </main>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <span>{dirty ? <span className="text-orange-500 font-medium">Ada perubahan yang belum disimpan</span> : 'Semua perubahan tersimpan'}</span>
          <button onClick={onBack} className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600 font-medium transition-colors">
            <Eye size={13} /> Preview Halaman Download
          </button>
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}
