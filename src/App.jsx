import { useState } from 'react'
import DownloadPage from './pages/DownloadPage'
import AdminPage from './pages/AdminPage'
import AdminLogin from './pages/AdminLogin'
import defaultData from './data/releases.json'

function loadReleases() {
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
  const [releases, setReleases] = useState(loadReleases)
  const [authed, setAuthed] = useState(isAuthenticated)

  const handleSave = (data) => {
    try {
      localStorage.setItem('hcis_releases', JSON.stringify(data))
    } catch {}
    setReleases(data)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('hcis_admin_auth')
    setAuthed(false)
    setPage('download')
  }

  const goAdmin = () => setPage('admin')

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
