# Dokumentasi Aplikasi Android Smekda Mart

Aplikasi Android untuk website **Smekda Mart** SMKN 2 Purwakarta
(`https://alfaclasssmkn2pwk.site.je/`). Proyek ini **terpisah** dari website:
website tidak diubah sama sekali, aplikasi hanya **membaca** halaman publiknya.

---

## 1. Hasil analisis website

Website dibuat dengan **Laravel** (PHP + MySQL). Halaman publiknya hanya **satu halaman**
(`resources/views/index.blade.php`) berisi 4 bagian yang sama dengan menu website:

| Bagian | Isi | Sumber data (database) |
|---|---|---|
| Beranda | Judul, deskripsi, 4 kartu kategori | tabel `beranda`, `beranda_items` |
| Produk | Makanan & Minuman (nama, harga, foto) | tabel `produk` |
| Profil Usaha | Sejarah, jam operasional, WhatsApp, struktur pengurus, alamat | tabel `profil`, `organigram` |
| Galeri | Foto + keterangan | tabel `galeri` |

Temuan penting:

- **Tidak ada API JSON.** `routes/api.php` hanya berisi bawaan Laravel. Semua data sudah
  ditulis langsung ke dalam HTML halaman utama oleh `HomeController`.
- Website punya halaman login (`/login`) dan panel admin (`/admin/...`) untuk pengelola. Di aplikasi ada **tombol Login**
  yang membuka halaman login website itu **di dalam aplikasi** (plugin InAppBrowser). Aplikasi memantau alamatnya: setelah logout atau saat membuka beranda website, jendela otomatis ditutup dan pengguna kembali ke Beranda aplikasi (fungsi `bukaAdmin` di `app.js`). Aplikasi **tidak memproses email/password** dan tidak menyimpannya;
  panel admin tetap dipakai di website.
- Website tidak punya fitur transaksi, pembayaran, atau keranjang — aplikasi juga tidak.
- Identitas visual: merah `#b3001b`, hijau tua `#144d32` / `#2e664d`, font Poppins, logo SMKN 2,
  footer Instagram `smekda.official` dan TikTok `SMKN 2 PURWAKARTA`.

## 2. Teknologi yang dipilih: Capacitor + HTML/CSS/JavaScript

**Kenapa:**

- **Ringan** — tidak perlu emulator. Tampilan bisa dicek di browser komputer, lalu dites di HP asli.
- **Bahasa yang sudah kamu kuasai** (HTML, CSS) ditambah sedikit JavaScript; kode mudah dibaca & dijelaskan.
- Capacitor membungkus aplikasi web menjadi aplikasi Android asli (APK) lengkap dengan ikon,
  splash screen, dan tombol Back HP.
- Dibangun lewat GitHub Actions (cloud), jadi **tidak perlu Android Studio** di laptop.

**Bagaimana data diambil (penting untuk sidang):**

1. Aplikasi mengunduh halaman utama website (HTML) — `www/js/api.js`.
2. Bagian-bagian halaman dibaca (produk, profil, galeri, dst.) menjadi data rapi — fungsi `parseHome`.
3. Data ditampilkan dengan tampilan khusus HP (bilah atas, navigasi bawah, kartu).
4. Salinan data disimpan di HP (`localStorage`) sehingga tetap tampil saat **offline**.

Karena aplikasi membaca website langsung, **produk/foto yang diubah admin di website otomatis ikut berubah
di aplikasi** — tanpa membuat ulang aplikasi. Data produk di website tidak pernah diubah atau dihapus.

> **Keterbatasan yang jujur:** karena membaca HTML website, bila struktur HTML website diubah besar-besaran
> (nama class seperti `.produk-card`), `parseHome` di `api.js` perlu disesuaikan. Cara yang lebih kokoh adalah
> menambah API JSON di website, tetapi itu mengubah website sehingga **tidak dilakukan**.

## 3. Struktur proyek

```
smekda-mart-app/
├── package.json              Daftar paket & perintah (npm run ...)
├── capacitor.config.json     Nama app, ID app, splash screen, pengaturan HTTP
├── www/                      ← SEMUA kode aplikasi (inilah yang kamu edit)
│   ├── index.html            Kerangka: bilah atas, navigasi bawah, penampil foto
│   ├── css/app.css           Seluruh tampilan & warna
│   ├── js/
│   │   ├── config.js         Alamat website, batas waktu, nama cache
│   │   ├── api.js            Mengambil & membaca data dari website, cache
│   │   ├── ui.js             Membuat HTML tiap halaman, tampilan error/loading
│   │   └── app.js            Navigasi, memuat data, offline, penampil foto
│   ├── assets/images/        Logo & foto produk/galeri (versi ringan, dipakai offline)
│   ├── fonts/                Font Poppins
│   └── vendor/fontawesome/   Ikon (Font Awesome, sama seperti website)
├── resources/                Gambar sumber ikon & splash screen (icon-*.png, splash*.png)
├── tests/                    Pengujian (data contoh, uji otomatis)
├── scripts/server-lokal.mjs  Server kecil untuk melihat aplikasi di browser
├── .github/workflows/build-apk.yml   Resep build APK/AAB di GitHub
└── android/                  (dibuat otomatis oleh `npx cap add android`)
```

### Fungsi file penting

| File | Fungsi |
|---|---|
| `www/js/config.js` | Alamat website (`BASE_URL`), alamat login (`LOGIN_URL`), dan isi halaman Tentang Kami (`TENTANG`: pembuat, versi, cara penggunaan). |
| `www/js/api.js` | `parseHome()` membaca HTML jadi data; `resolveFoto()` memilih foto lokal/online; `ambilData()` mengunduh + cache + menentukan jenis error. |
| `www/js/ui.js` | `renderBeranda/Produk/Profil/Galeri/Tentang/Login()` membuat tampilan; `renderError()` pesan kesalahan; `esc()` mengamankan teks dari kode berbahaya. |
| `www/js/app.js` | Mengatur tab (alamat `#/produk`), memuat data, spanduk offline, penampil foto & tombol Back. |
| `www/css/app.css` | Warna di bagian `:root` (mudah diganti), semua gaya komponen. |
| `capacitor.config.json` | Nama aplikasi “Smekda Mart”, ID `id.sch.smkn2pwk.smekdamart`, durasi splash screen. |
| `resources/*.png` | Sumber ikon & splash; diubah ke semua ukuran Android oleh `npm run ikon`. |

## 4. Fitur yang tersedia

- 4 halaman sama seperti website: **Beranda, Produk (Makanan & Minuman), Profil Usaha (+ struktur pengurus), Galeri**.
- Halaman **Tentang Kami** (tab "Tentang"): tentang aplikasi, pembuat aplikasi, dan cara menggunakan aplikasi. Isinya diedit di `www/js/config.js` (bagian `TENTANG`).
- Tombol **Login** di bilah atas → halaman Login Admin → tombol menuju halaman login website.
- Navigasi bawah, bilah atas dengan tombol muat ulang, tombol WhatsApp, penampil foto galeri (geser/tombol, Back untuk menutup).
- **Penanganan internet:** mode offline memakai data terakhir (dengan spanduk kuning), tampilan error khusus untuk
  *tidak ada internet / server lambat / website bermasalah / halaman tidak dikenali*, dengan tombol **Coba Lagi** dan **Buka Website**;
  otomatis memuat ulang saat internet kembali.
- Splash screen merah dengan logo, ikon aplikasi, nama “Smekda Mart”.
- Tidak ada keranjang atau pembayaran (website juga tidak punya).

## 5. Cara menjalankan di komputer (VS Code)

Prasyarat: **Node.js 20 atau 22** (https://nodejs.org) dan **VS Code**.

```bash
cd smekda-mart-app
npm install            # sekali saja: mengunduh Capacitor
npm run tes            # menjalankan server lokal
```

Buka `http://localhost:5173/?demo=1` di Chrome (tekan **F12** → ikon HP untuk tampilan layar HP).
Mode `?demo=1` memakai berkas contoh `tests/fixture/home.html`, karena browser komputer menolak membaca
website lain (aturan CORS). Di aplikasi Android hal ini tidak terjadi.

## 6. Cara mengedit kode (dengan bantuan AI di VS Code)

Contoh perintah bahasa Indonesia yang bisa kamu berikan ke AI (Copilot / Claude):

- “Di `www/css/app.css`, ubah warna merah utama jadi lebih gelap.”
- “Di `ui.js`, tambahkan teks ‘Tersedia di kantin’ di bawah harga produk.”
- “Di `config.js`, ubah batas waktu menjadi 30 detik.”
- “Jelaskan baris demi baris fungsi `parseHome` di `api.js` untuk sidang.”

Selalu ujicoba setelah mengedit: `npm run tes` dan lihat hasilnya. Lalu `git commit` agar ada riwayat.

## 7. Cara membangun APK

### Cara A (disarankan, tanpa Android Studio): GitHub Actions

1. Buat akun & repositori di https://github.com (gratis), unggah isi folder proyek ini.
   Di terminal:
   ```bash
   git init
   git add .
   git commit -m "Aplikasi Smekda Mart"
   git branch -M main
   git remote add origin https://github.com/USERNAME/smekda-mart-app.git
   git push -u origin main
   ```
2. Di GitHub buka tab **Actions** → **Build APK Smekda Mart** → **Run workflow**.
3. Tunggu ±5–10 menit. Setelah hijau, buka prosesnya → bagian **Artifacts** → unduh **SmekdaMart-debug-apk**.
4. Pindahkan `.apk` ke HP → buka → izinkan “Instal dari sumber tidak dikenal” → pasang.

Jika proses **merah**: buka langkah yang gagal, salin pesan error-nya, dan berikan ke AI untuk dibantu.

### Cara B (jika laptop kuat): lokal

Butuh Android Studio + JDK 21.
```bash
npm install
npx cap add android     # sekali saja
npm run ikon            # membuat ikon & splash dari folder resources/
npm run sync
cd android && ./gradlew assembleDebug     # Windows: gradlew assembleDebug
```
APK ada di `android/app/build/outputs/apk/debug/app-debug.apk`.

> Setelah `npx cap add android` pertama kali, **commit folder `android/`** agar pengaturan tidak berubah-ubah.

## 8. Publikasi

- **Gratis tanpa Play Store:** unggah APK ke **GitHub Releases** atau Google Drive, lalu bagikan tautannya.
  Pengguna perlu mengizinkan instal dari sumber tidak dikenal.
- **Google Play Store:** perlu akun developer Google Play (ada **biaya pendaftaran sekali bayar**, bukan gratis),
  file **AAB** yang ditandatangani, halaman toko (deskripsi, tangkapan layar, ikon 512×512), dan kebijakan privasi.

Membuat kunci tanda tangan (**simpan baik-baik, jangan hilang & jangan di-commit**):
```bash
keytool -genkeypair -v -keystore smekda.jks -alias smekda -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 smekda.jks     # hasilnya disalin ke GitHub Secret KEYSTORE_BASE64
```
Di GitHub: **Settings → Secrets and variables → Actions**, isi `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`,
`KEY_ALIAS` (= `smekda`), `KEY_PASSWORD`. Jalankan workflow lagi; artifact **SmekdaMart-rilis** berisi APK & AAB bertanda tangan.

## 9. Pertanyaan yang mungkin muncul saat sidang

**Mengapa memilih Capacitor, bukan Flutter / Android native?**
Lebih ringan untuk laptop, memakai HTML/CSS/JS yang dikuasai, tetap menghasilkan APK asli, dan tidak butuh emulator.

**Apakah aplikasi ini hanya “website di dalam kotak”?**
Tidak. Tampilannya dibuat khusus HP (bilah atas, navigasi bawah, kartu, penampil foto), data diolah menjadi struktur sendiri,
ada cache offline dan penanganan error. Sumber datanya tetap website agar isi selalu sama.

**Dari mana data produk diambil?**
Dari halaman utama website yang sudah online (dibaca oleh `parseHome`). Website tidak diubah; produk di database tidak disentuh.

**Bagaimana jika tidak ada internet?**
Aplikasi menampilkan data terakhir yang tersimpan (spanduk “Mode offline”). Jika belum pernah memuat data, muncul tampilan error dengan tombol Coba Lagi.

**Bagaimana keamanan teks dari website?**
Semua teks melewati fungsi `esc()` sebelum ditampilkan, sehingga tidak bisa dieksekusi sebagai kode (dibuktikan di pengujian).

**Apa pengembangan selanjutnya?**
API JSON resmi di website agar lebih kokoh, notifikasi promo, pencarian produk.

## 10. Pengujian

`python3 tests/uji-ui.py` (opsional, butuh `pip install playwright`) menjalankan 46 pemeriksaan otomatis pada ukuran layar HP:
pembacaan data, harga, navigasi, galeri, halaman Tentang dan Login, offline dengan cache, error tanpa cache, halaman asing, server 503, dan keamanan teks.
Pengujian memakai berkas contoh di `tests/fixture/`, **bukan** website asli.

## 11. Pemecahan masalah

| Gejala | Penyebab & solusi |
|---|---|
| Aplikasi menampilkan “Data tidak dapat dibaca” padahal internet aktif | Hosting gratis kadang menampilkan halaman pengaman bot / pemeliharaan. Coba lagi beberapa menit; bila terus terjadi, minta AI menyesuaikan `api.js`. |
| Foto tidak muncul | Cek `PAKAI_FOTO_LOKAL` di `config.js`; foto baru yang diunggah admin diambil dari website (perlu internet). |
| Bilah atas tertutup status bar HP | Sesuaikan `--atas-aman` di `app.css` atau hubungi AI dengan tangkapan layar. |
| `npm run ikon` gagal | Pastikan `npm install` sudah selesai dan folder `android/` sudah dibuat (`npx cap add android`). |
