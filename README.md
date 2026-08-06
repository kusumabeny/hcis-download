# HCIS Mobile — Download Page

Halaman download HCIS Mobile App (Android APK & iOS) dengan admin panel untuk manajemen rilis.

## Fitur
- Deteksi platform otomatis (Android / iOS)
- Upload APK/IPA → auto-extract versi, minimum OS, ukuran file
- QR Code per platform
- Riwayat versi otomatis tersimpan saat update
- Enable/disable per platform
- Admin panel dengan password protection

## Development

```bash
# Install dependencies
npm install

# Jalankan dev server (Vite + API server upload)
npm run dev
```

Buka http://localhost:5173

## Production (Node.js)

```bash
npm run build
npm start        # Express server di port 3000
```

## Production (Docker)

```bash
# Build & jalankan
docker compose up -d

# Dengan custom admin password
VITE_ADMIN_PASSWORD=passwordkamu docker compose up -d --build

# Atau via .env file
cp .env.example .env.local
# edit .env.local
docker compose up -d --build
```

Buka http://localhost:3000

## Konfigurasi

Buat file `.env.local` dari `.env.example`:

```env
VITE_ADMIN_PASSWORD=ganti_password_anda
```

> Password di-embed saat build (`npm run build` atau Docker build). Ganti password = build ulang.

## Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name download.hcis.example.com;

    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Struktur Project

```
├── src/
│   ├── data/releases.json      # Konfigurasi rilis (versi, URL, history)
│   ├── pages/
│   │   ├── DownloadPage.jsx    # Halaman download publik
│   │   ├── AdminPage.jsx       # Admin panel
│   │   └── AdminLogin.jsx      # Halaman login admin
│   └── App.jsx
├── server.js                   # Express server (production)
├── server.api.js               # Upload API server (development)
├── Dockerfile
└── docker-compose.yml
```
