/**
 * Dev-mode API server — upload only, no static file serving.
 * Files saved to public/downloads/ so Vite can serve them directly.
 */
import express from 'express'
import multer from 'multer'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import apkReaderPkg from 'adbkit-apkreader'
import AdmZip from 'adm-zip'
import { parse as parsePlist } from 'plist'

// ESM default import of a CJS module — apkReaderPkg IS the class directly
const ApkReader = apkReaderPkg

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const downloadsDir = path.join(__dirname, 'public', 'downloads')
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true })

const SDK_MAP = {
  14: '4.0', 15: '4.0.3', 16: '4.1', 17: '4.2', 18: '4.3',
  19: '4.4', 21: '5.0', 22: '5.1', 23: '6.0', 24: '7.0',
  25: '7.1', 26: '8.0', 27: '8.1', 28: '9.0', 29: '10.0',
  30: '11.0', 31: '12.0', 32: '12.1', 33: '13.0', 34: '14.0',
  35: '15.0', 36: '16.0',
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
    return {
      version: manifest.versionName ?? null,
      minOs: sdk ? `Android ${SDK_MAP[sdk] ?? sdk}+` : null,
    }
  } catch (e) {
    console.warn('[APK] Parse warning:', e.message)
    return {}
  }
}

async function extractIpaMeta(filePath) {
  try {
    const zip = new AdmZip(filePath)
    const plistEntry = zip.getEntries().find((e) =>
      /^Payload\/[^/]+\.app\/Info\.plist$/i.test(e.entryName)
    )
    if (!plistEntry) return {}
    const data = plistEntry.getData()
    let parsed
    try { parsed = parsePlist(data.toString('utf8')) } catch { parsed = parsePlist(data) }
    return {
      version: parsed.CFBundleShortVersionString ?? parsed.CFBundleVersion ?? null,
      minOs: parsed.MinimumOSVersion ? `iOS ${parsed.MinimumOSVersion}+` : null,
    }
  } catch (e) {
    console.warn('[IPA] Parse warning:', e.message)
    return {}
  }
}

const storage = multer.diskStorage({
  destination: downloadsDir,
  filename(req, file, cb) {
    cb(null, `hcis-${req.params.platform}${path.extname(file.originalname)}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase()
    ;['.apk', '.ipa', '.aab'].includes(ext)
      ? cb(null, true)
      : cb(new Error(`Tipe file tidak didukung (${ext})`))
  },
})

app.post('/api/upload/:platform', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Tidak ada file yang diupload' })
  const platform = req.params.platform
  const meta = platform === 'android'
    ? await extractApkMeta(req.file.path)
    : await extractIpaMeta(req.file.path)

  res.json({
    url: `/downloads/${req.file.filename}`,
    filename: req.file.filename,
    fileSize: formatBytes(req.file.size),
    version: meta.version ?? null,
    minOs: meta.minOs ?? null,
  })
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
  return entryLines
    .map((line) => line.trim())
    .filter((line) => /^[-*+]\s+/.test(line))
    .map((line) => line.replace(/^[-*+]\s+/, '').trim())
    .join('\n') || null
}

function listChangelogVersions(markdown) {
  return markdown.split(/\r?\n/)
    .map((line) => line.match(/^##\s+v?([^\s-–—|]+)/i)?.[1])
    .filter(Boolean)
}

async function fetchChangelog() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'hcis-download',
  }
  const endpoint = `https://api.github.com/repos/${CHANGELOG_REPO}/contents/${CHANGELOG_PATH}?ref=${encodeURIComponent(CHANGELOG_BRANCH)}`
  if (CHANGELOG_TOKEN) headers.Authorization = `Bearer ${CHANGELOG_TOKEN}`
  const response = await fetch(endpoint, { headers })
  if (!response.ok) {
    const error = new Error(`GitHub API mengembalikan HTTP ${response.status} untuk ${CHANGELOG_REPO}/${CHANGELOG_PATH}@${CHANGELOG_BRANCH}`)
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
    const markdown = await fetchChangelog()
    const changelog = parseChangelogEntry(markdown, version)
    if (!changelog) {
      return res.status(404).json({
        error: `Changelog versi ${version} belum tersedia. Tambahkan entry ## ${version} ke CHANGELOG.md sebelum menyimpan rilis ini.`,
        availableVersions: listChangelogVersions(markdown).slice(0, 10),
      })
    }
    res.json({ version, changelog, source: `${CHANGELOG_REPO}/${CHANGELOG_PATH}@${CHANGELOG_BRANCH}` })
  } catch (error) {
    console.error('[CHANGELOG] Fetch failed:', error.message, error.requestId ?? '')
    const status = error.status === 404 ? 404 : 502
    res.status(status).json({
      error: status === 404
        ? 'GitHub tidak menemukan file/repository. Untuk repository private, pastikan token memiliki akses Contents: Read-only ke HCIS-mobile.'
        : 'Changelog realtime tidak dapat diambil saat ini',
      diagnostic: error.message,
    })
  }
})

app.delete('/api/upload/:platform', (req, res) => {
  const platform = req.params.platform
  let deleted = false
  for (const ext of ['.apk', '.ipa', '.aab']) {
    const fp = path.join(downloadsDir, `hcis-${platform}${ext}`)
    if (fs.existsSync(fp)) { fs.unlinkSync(fp); deleted = true }
  }
  res.json({ deleted })
})

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || 'Upload gagal' })
})

app.listen(PORT, () => console.log(`[API] Upload server → http://localhost:${PORT}`))
