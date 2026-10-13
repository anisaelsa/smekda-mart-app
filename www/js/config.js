// =====================================================================
// config.js — Pengaturan utama aplikasi. Ubah di sini jika perlu.
// =====================================================================

// Alamat website Smekda Mart (hanya DIBACA, website tidak diubah sama sekali).
export const BASE_URL = 'https://alfaclasssmkn2pwk.site.je';

// Batas waktu menunggu server (milidetik). 20000 = 20 detik.
export const REQUEST_TIMEOUT_MS = 20000;

// Kunci penyimpanan data terakhir di HP (dipakai saat tidak ada internet).
export const CACHE_KEY = 'smekdamart.cache.v1';

// Foto yang ada di folder www/assets/images dipakai dari dalam aplikasi
// (lebih cepat & tetap tampil saat offline). Jika false, semua foto diambil dari website.
export const PAKAI_FOTO_LOKAL = true;

// Halaman login website (khusus admin pengelola). Aplikasi TIDAK memproses
// email/password: tombol Login hanya membuka halaman login website di browser HP.
export const LOGIN_URL = BASE_URL + '/login';

// Alamat-alamat panel admin di website. Selama pengguna berada di alamat ini, ia dianggap
// "sedang di dalam admin". Begitu ia keluar (logout -> /login, atau membuka beranda website "/"),
// jendela admin ditutup otomatis dan pengguna kembali ke aplikasi.
export const HALAMAN_ADMIN = ['/admin', '/beranda', '/produk', '/profil', '/organigram', '/galeri'];

// Tampilan jendela admin di dalam aplikasi (opsi plugin InAppBrowser)
export const OPSI_JENDELA_ADMIN =
  'location=no,zoom=no,hidenavigationbuttons=yes,toolbarcolor=#b3001b,closebuttoncaption=Kembali ke Aplikasi,closebuttoncolor=#ffffff';

// Isi halaman "Tentang Kami". Edit di sini jika ada yang perlu diubah.
export const TENTANG = {
  versi: '1.0.0',
  tahun: 2026,
  deskripsi:
    'Smekda Mart adalah aplikasi Android dari website Smekda Mart SMKN 2 Purwakarta. ' +
    'Lihat produk makanan dan minuman, profil usaha, struktur pengurus, dan galeri langsung dari HP.',
  pembuat: {
    nama: 'Anisa Paradina Agustin',
    jurusan: 'Rekayasa Perangkat Lunak (RPL)',
    sekolah: 'SMK Negeri 2 Purwakarta',
    keterangan: 'Lulusan Tahun 2027',
  },
  // Cara penggunaan: ikon = nama ikon Font Awesome (tanpa "fa-")
  langkah: [
    ['house', 'Beranda', 'Ketuk salah satu kartu untuk langsung menuju Produk Makanan, Produk Minuman, Profil Usaha, atau Galeri.'],
    ['basket-shopping', 'Produk', 'Lihat daftar makanan dan minuman beserta harganya. Ketuk tombol Makanan atau Minuman di atas untuk melompat ke bagiannya.'],
    ['store', 'Profil', 'Baca sejarah, jam operasional, dan struktur pengurus. Ketuk Chat Via WhatsApp untuk menghubungi kami.'],
    ['images', 'Galeri', 'Ketuk foto untuk memperbesar. Geser ke kiri atau kanan untuk foto lain, tombol Kembali di HP untuk menutup.'],
    ['rotate-right', 'Muat Ulang', 'Ketuk ikon panah melingkar di kanan atas untuk mengambil data terbaru dari website.'],
    ['cloud-arrow-down', 'Tanpa Internet', 'Tanpa internet, aplikasi menampilkan data terakhir yang tersimpan. Data otomatis diperbarui saat internet kembali menyala.'],
    ['lock', 'Login', 'Tombol Login di kanan atas khusus untuk admin pengelola website dan dibuka di dalam aplikasi. Setelah logout, kamu otomatis kembali ke aplikasi. Pengunjung biasa tidak perlu login.'],
  ],
};
