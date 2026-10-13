# Smekda Mart — Aplikasi Android

Aplikasi Android untuk website Smekda Mart SMKN 2 Purwakarta. Proyek ini **terpisah** dari website
dan hanya membaca halaman publiknya. Dibuat dengan Capacitor + HTML/CSS/JavaScript.

**Dokumentasi lengkap (Bahasa Indonesia): [`docs/DOKUMENTASI.md`](docs/DOKUMENTASI.md)**

## Mulai cepat

```bash
npm install
npm run tes          # lalu buka http://localhost:5173/?demo=1 (F12 -> tampilan HP)
```

Membangun APK: unggah ke GitHub → tab **Actions** → **Build APK Smekda Mart** → **Run workflow**
→ unduh **SmekdaMart-debug-apk** dari *Artifacts*. Langkah rinci ada di dokumentasi bagian 7.

## Struktur singkat

- `www/` — seluruh kode aplikasi (isi halaman Tentang Kami: `www/js/config.js`) (`index.html`, `css/app.css`, `js/*.js`)
- `resources/` — sumber ikon & splash screen
- `tests/` — data contoh & pengujian
- `.github/workflows/build-apk.yml` — resep build APK/AAB
