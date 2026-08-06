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
