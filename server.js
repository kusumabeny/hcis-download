import express from 'express'
import multer from 'multer'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import apkReaderPkg from 'adbkit-apkreader'
import AdmZip from 'adm-zip'
import { parse as parsePlist } from 'plist'

const ApkReader = apkReaderPkg

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Serve React build & uploaded files
const distDir = path.join(__dirname, 'dist')
const downloadsDir = path.join(distDir, 'downloads')
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true })

const dataDir = path.join(__dirname, 'data')
const releasesFile = path.join(dataDir, 'releases.json')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
if (!fs.existsSync(releasesFile)) {
  const bundledReleases = path.join(__dirname, 'dist', 'releases.json')
  if (fs.existsSync(bundledReleases)) fs.copyFileSync(bundledReleases, releasesFile)
}

app.use(express.static(distDir))

app.get('/api/releases', (req, res) => {
  try {
    res.json(JSON.parse(fs.readFileSync(releasesFile, 'utf8')))
  } catch (e) {
    res.status(500).json({ error: 'Gagal membaca data release' })
  }
})

const CHANGELOG_REPO = process.env.GITHUB_CHANGELOG_REPO || 'kusumabeny/HCIS-mobile'
const CHANGELOG_PATH = process.env.GITHUB_CHANGELOG_PATH || 'CHANGELOG.md'
const CHANGELOG_BRANCH = process.env.GITHUB_CHANGELOG_BRANCH || 'main'
const CHANGELOG_TOKEN = process.env.GITHUB_CHANGELOG_TOKEN

function parseChangelogEntry(markdown, version) {
  const lines = markdown.split(/\r?\n/)
  const headingIndex = lines.findIndex((line) => line.match(/^##\s+v?([^\s-–—|]+)/i)?.[1] === version)
  if (headingIndex < 0) return null
  const nextHeading = lines.slice(headingIndex + 1).findIndex((line) => /^##\s+/.test(line))
  const entryLines = lines.slice(headingIndex + 1, nextHeading < 0 ? undefined : headingIndex + 1 + nextHeading)
  const changelogLines = entryLines
    .map((line) => line.trim())
    .filter((line) => /^[-*+]\s+/.test(line))
    .map((line) => line.replace(/^[-*+]\s+/, '').trim())

  return changelogLines.join('\n') || null
}

async function fetchChangelog() {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'hcis-download' }
  const endpoint = `https://api.github.com/repos/${CHANGELOG_REPO}/contents/${CHANGELOG_PATH}?ref=${encodeURIComponent(CHANGELOG_BRANCH)}`
  if (CHANGELOG_TOKEN) headers.Authorization = `Bearer ${CHANGELOG_TOKEN}`
  const response = await fetch(endpoint, { headers })
  if (!response.ok) {
    const error = new Error(`GitHub API mengembalikan HTTP ${response.status}`)
    error.status = response.status
    error.requestId = response.headers.get('x-github-request-id')
    throw error
  }
  const payload = await response.json()
  if (payload.type !== 'file' || !payload.content) throw new Error('File changelog tidak valid')
  return Buffer.from(payload.content.replace(/\s/g, ''), 'base64').toString('utf8')
}

app.get('/api/changelog', async (req, res) => {
  const version = String(req.query.version || '').trim()
  if (!version) return res.status(400).json({ error: 'Versi wajib diisi' })

  try {
    const changelog = parseChangelogEntry(await fetchChangelog(), version)
    if (!changelog) {
      return res.status(404).json({
        error: `Changelog versi ${version} tidak ditemukan di ${CHANGELOG_REPO}/${CHANGELOG_PATH}. Periksa nomor versi atau tambahkan entry tersebut ke CHANGELOG.md.`,
      })
    }
    res.json({ version, changelog, source: `${CHANGELOG_REPO}/${CHANGELOG_PATH}@${CHANGELOG_BRANCH}` })
  } catch (error) {
    console.error('[CHANGELOG] Fetch failed:', error.message, error.requestId ?? '')
    const status = error.status === 404 ? 404 : 502
    res.status(status).json({
      error: status === 404
        ? 'File CHANGELOG.md tidak ditemukan atau token tidak punya akses ke repository sumber.'
        : 'Changelog realtime tidak dapat diambil saat ini',
      diagnostic: error.message,
    })
  }
})

app.put('/api/releases', (req, res) => {
  try {
    if (!req.body?.android || !req.body?.ios) {
      return res.status(400).json({ error: 'Data release tidak lengkap' })
    }
    fs.writeFileSync(releasesFile, JSON.stringify(req.body, null, 2) + '\n')
    res.json(req.body)
  } catch (e) {
    res.status(500).json({ error: 'Gagal menyimpan data release' })
  }
})

// Android API level → human-readable version
const SDK_MAP = {
  14: '4.0', 15: '4.0.3', 16: '4.1', 17: '4.2', 18: '4.3',
  19: '4.4', 20: '4.4W', 21: '5.0', 22: '5.1', 23: '6.0',
  24: '7.0', 25: '7.1', 26: '8.0', 27: '8.1', 28: '9.0',
  29: '10.0', 30: '11.0', 31: '12.0', 32: '12.1', 33: '13.0',
  34: '14.0', 35: '15.0', 36: '16.0',
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function extractApkMeta(filePath) {
  try {
    const reader = await ApkReader.open(filePath)
    const manifest = await reader.readManifest()
    const sdk = manifest.usesSdk?.minSdkVersion
    const minOs = sdk ? `Android ${SDK_MAP[sdk] ?? sdk}+` : null
    const version = manifest.versionName ?? null
    return { version, minOs }
  } catch (e) {
    console.warn('APK parse warning:', e.message)
    return {}
  }
}

async function extractIpaMeta(filePath) {
  try {
    const zip = new AdmZip(filePath)
    const entries = zip.getEntries()

    // Find Info.plist inside Payload/*.app/
    const plistEntry = entries.find((e) =>
      /^Payload\/[^/]+\.app\/Info\.plist$/i.test(e.entryName)
    )
    if (!plistEntry) return {}

    const data = plistEntry.getData()
    // plist can be binary (bplist) or XML
    let parsed
    try {
      parsed = parsePlist(data.toString('utf8'))
    } catch {
      parsed = parsePlist(data)
    }

    const version = parsed.CFBundleShortVersionString ?? parsed.CFBundleVersion ?? null
    const minOs = parsed.MinimumOSVersion ? `iOS ${parsed.MinimumOSVersion}+` : null
    return { version, minOs }
  } catch (e) {
    console.warn('IPA parse warning:', e.message)
    return {}
  }
}

// Multer storage
const storage = multer.diskStorage({
  destination: downloadsDir,
  filename(req, file, cb) {
    const platform = req.params.platform
    const ext = path.extname(file.originalname)
    cb(null, `hcis-${platform}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ['.apk', '.ipa', '.aab']
    const ext = path.extname(file.originalname).toLowerCase()
    allowed.includes(ext) ? cb(null, true) : cb(new Error(`Tipe file tidak didukung (${ext})`))
  },
})

// Upload + auto-extract metadata
app.post('/api/upload/:platform', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Tidak ada file yang diupload' })

  const platform = req.params.platform
  const filePath = req.file.path
  const fileUrl = `/downloads/${req.file.filename}`
  const fileSize = formatBytes(req.file.size)

  // Extract metadata
  let meta = {}
  try {
    if (platform === 'android') {
      meta = await extractApkMeta(filePath)
    } else if (platform === 'ios') {
      meta = await extractIpaMeta(filePath)
    }
  } catch (e) {
    console.warn('Metadata extraction failed:', e.message)
  }

  res.json({
    url: fileUrl,
    filename: req.file.filename,
    fileSize,
    version: meta.version ?? null,
    minOs: meta.minOs ?? null,
  })
})

// Delete file
app.delete('/api/upload/:platform', (req, res) => {
  const platform = req.params.platform
  const exts = ['.apk', '.ipa', '.aab']
  let deleted = false
  for (const ext of exts) {
    const fp = path.join(downloadsDir, `hcis-${platform}${ext}`)
    if (fs.existsSync(fp)) { fs.unlinkSync(fp); deleted = true }
  }
  res.json({ deleted })
})

// Fallback → React app
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || 'Upload gagal' })
})

app.listen(PORT, () => {
  console.log(`HCIS Download server → http://localhost:${PORT}`)
})
