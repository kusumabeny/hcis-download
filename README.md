# HCIS Mobile — Download Page

Halaman download resmi HCIS Mobile App (Android & iOS) dengan admin panel untuk manajemen rilis.

## Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 19, Tailwind CSS v4, Vite 8 |
| Backend | Express 5, Multer |
| APK Parser | adbkit-apkreader |
| IPA Parser | adm-zip + plist |
| QR Code | qrcode.react |
| Container | Docker + docker-compose |

---

## Fitur

- **Deteksi platform otomatis** — browser Android/iOS langsung dapat tombol download yang sesuai
- **Upload file APK / IPA / AAB** — drag & drop atau klik, progress bar real-time
- **Auto-extract metadata** dari file APK/IPA: versi, minimum OS, ukuran file
- **QR Code** per platform — klik expand di card download
- **Riwayat versi** — auto-push ke history saat versi berubah, tampil di halaman publik
- **Enable / Disable** per platform — nonaktif tampil sebagai "Segera Hadir"
- **Admin panel** terproteksi password

---

## Development

### Prasyarat
- Node.js 20+
- npm 10+

### Jalankan

```bash
# 1. Install dependencies
npm install

# 2. Salin env file dan atur password admin
cp .env.example .env.local
# Edit VITE_ADMIN_PASSWORD di .env.local

# 3. Jalankan dev server
npm run dev
```

`npm run dev` menjalankan **dua server sekaligus** via concurrently:
- **Vite** → http://localhost:5173 (halaman publik & admin)
- **Upload API** → http://localhost:3001 (handle upload file APK/IPA)

> Jangan jalankan hanya `npx vite` — upload file akan gagal karena API server tidak jalan.

### Akses Admin Panel

Buka http://localhost:5173 → klik tombol **"Admin Panel"** di pojok kanan atas → masukkan password dari `.env.local`.

---

## Production (tanpa Docker)

```bash
# Build React
npm run build

# Jalankan Express server (port 3000)
npm start
```

Buka http://localhost:3000

---

## Production (Docker)

### Jalankan

```bash
# Clone repo
git clone https://github.com/kusumabeny/hcis-download
cd hcis-download

# Build & jalankan dengan password default (admin123)
docker compose up -d

# Build dengan custom password
docker compose build --build-arg VITE_ADMIN_PASSWORD=passwordkamu
docker compose up -d
```

Buka http://localhost:3000

### Ganti password admin

Password di-embed ke dalam bundle JavaScript saat build. Untuk menggantinya:

```bash
docker compose down
docker compose build --build-arg VITE_ADMIN_PASSWORD=passwordbaru
docker compose up -d
```

> **Catatan keamanan:** Password ini adalah proteksi UI, bukan kriptografi. Untuk keamanan lebih, tambahkan autentikasi di level server/nginx.

### Volume (file yang diupload)

File APK/IPA yang diupload disimpan di Docker volume `hcis_downloads`. File tetap ada saat container di-restart atau di-update image.

```bash
# Cek volume
docker volume inspect hcis-download_hcis_downloads

# Backup file uploads
docker run --rm -v hcis-download_hcis_downloads:/data -v $(pwd):/backup alpine \
  tar czf /backup/downloads-backup.tar.gz -C /data .
```

### Port

| Port | Keterangan |
|---|---|
| `3000` | Aplikasi (Express serves React + API) |

Untuk mengubah port:
```yaml
# docker-compose.yml
ports:
  - "8080:3000"   # host:container
```

---

## Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name download.hcis.example.com;

    # Wajib untuk upload file APK besar (default nginx: 1MB)
    client_max_body_size 500M;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_read_timeout 300s;   # untuk upload file besar
    }
}
```

---

## Konfigurasi Rilis

File `src/data/releases.json` adalah data default saat localStorage kosong. Setelah admin panel digunakan, data disimpan di `localStorage` browser dan tetap ada selama tidak di-reset.

Untuk perubahan permanen tanpa rebuild: di admin panel klik **Export JSON** → replace `src/data/releases.json` → `npm run build` / rebuild Docker.

---

## Struktur Project

```
hcis-download/
├── src/
│   ├── data/
│   │   └── releases.json        # Data rilis default
│   ├── pages/
│   │   ├── DownloadPage.jsx     # Halaman download publik
│   │   ├── AdminPage.jsx        # Admin panel manajemen rilis
│   │   └── AdminLogin.jsx       # Login admin
│   ├── App.jsx                  # Router + state management
│   └── index.css
├── public/
│   └── downloads/               # Folder upload file APK/IPA (dev)
├── server.js                    # Express production server
├── server.api.js                # Upload API server (development only)
├── Dockerfile                   # Multi-stage build
├── docker-compose.yml
├── .env.example                 # Template environment variables
└── vite.config.js
```

---

## Scripts

| Command | Keterangan |
|---|---|
| `npm run dev` | Dev mode: Vite (5173) + Upload API (3001) |
| `npm run build` | Build React ke `dist/` |
| `npm start` | Production: Express server (port 3000) |

---

## License

Internal use — PT Starcoms Indonesia
