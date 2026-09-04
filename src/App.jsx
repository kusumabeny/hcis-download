import { useEffect, useState } from 'react'
import DownloadPage from './pages/DownloadPage'
import AdminPage from './pages/AdminPage'
import AdminLogin from './pages/AdminLogin'
import defaultData from './data/releases.json'

function loadLocalReleases() {
  try {
    const saved = localStorage.getItem('hcis_releases')
    if (saved) return JSON.parse(saved)
  } catch {}
  return defaultData
}

function isAuthenticated() {
  return sessionStorage.getItem('hcis_admin_auth') === '1'
}

export default function App() {
  const [page, setPage] = useState('download')
  const [releases, setReleases] = useState(loadLocalReleases)
  const [loaded, setLoaded] = useState(false)
  const [authed, setAuthed] = useState(isAuthenticated)

  useEffect(() => {
    fetch('/api/releases')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        setReleases(data)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  const handleSave = async (data) => {
    const response = await fetch('/api/releases', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Gagal menyimpan ke server')
    const saved = await response.json()
    try { localStorage.setItem('hcis_releases', JSON.stringify(saved)) } catch {}
    setReleases(saved)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('hcis_admin_auth')
    setAuthed(false)
    setPage('download')
  }

  const goAdmin = () => setPage('admin')

  if (!loaded) return null

  if (page === 'admin') {
    if (!authed) {
      return (
        <AdminLogin
          onSuccess={() => {
            setAuthed(true)
            setPage('admin')
          }}
        />
      )
    }
    return (
      <AdminPage
        releases={releases}
        onSave={handleSave}
        onBack={() => setPage('download')}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <DownloadPage
      releases={releases}
      onAdminClick={goAdmin}
    />
  )
}
