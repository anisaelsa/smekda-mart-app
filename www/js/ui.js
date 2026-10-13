// =====================================================================
// ui.js — Membuat tampilan (HTML) tiap halaman dari data.
// Semua fungsi "render..." menerima data dan mengembalikan teks HTML.
// =====================================================================

import { BASE_URL, LOGIN_URL, TENTANG } from './config.js';

/** Mengamankan teks dari website agar tidak dibaca sebagai kode HTML. */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

/** Tag <img> dengan foto cadangan bila foto utama gagal dimuat. */
function img(foto, alt, cls = '') {
  const fb = foto.fallback ? ` data-fallback="${esc(foto.fallback)}"` : '';
  return `<img class="${cls}" src="${esc(foto.src)}" alt="${esc(alt)}" loading="lazy"${fb}>`;
}

function footer(sosial) {
  return `
    <footer class="footer">
      <span><i class="fa-brands fa-instagram"></i> ${esc(sosial.instagram)}</span>
      <span><i class="fa-brands fa-tiktok"></i> ${esc(sosial.tiktok)}</span>
    </footer>`;
}

/** Ubah tautan website ("#minuman") menjadi alamat halaman aplikasi. */
export function tautanKeRute(t) {
  switch (t) {
    case '#minuman': return '#/produk/minuman';
    case '#profil': return '#/profil';
    case '#galeri': return '#/galeri';
    case '#beranda': return '#/beranda';
    default: return '#/produk';
  }
}

// ---------------------------------------------------------------- Beranda
export function renderBeranda(d) {
  const b = d.beranda;
  const kartu = b.item.map((it) => `
      <a class="kategori" href="${tautanKeRute(it.tautan)}">
        ${img(it.foto, it.judul, 'kategori__img')}
        <div class="kategori__label">${esc(it.judul)}</div>
      </a>`).join('');
  return `
    <section class="hero">
      <h1>${esc(b.judul)}</h1>
      <p>${esc(b.deskripsi)}</p>
    </section>
    <section class="kategori-grid">${kartu}</section>
    ${footer(d.sosial)}`;
}

// ----------------------------------------------------------------- Produk
function gridProduk(list, kosong) {
  if (!list.length) return `<p class="kosong">${kosong}</p>`;
  return `<div class="produk-grid">` + list.map((p) => `
      <article class="produk">
        ${img(p.foto, p.nama, 'produk__img')}
        <h3>${esc(p.nama)}</h3>
        <span class="harga">${rupiah(p.harga)}</span>
      </article>`).join('') + `</div>`;
}

export function renderProduk(d) {
  return `
    <div class="chips" role="tablist">
      <button class="chip" data-scroll="sec-makanan">Makanan <small>${d.produk.makanan.length}</small></button>
      <button class="chip" data-scroll="sec-minuman">Minuman <small>${d.produk.minuman.length}</small></button>
    </div>
    <section id="sec-makanan" class="seksi">
      <h2 class="pil">Makanan</h2>
      ${gridProduk(d.produk.makanan, 'Belum ada produk makanan.')}
    </section>
    <section id="sec-minuman" class="seksi">
      <h2 class="pil">Minuman</h2>
      ${gridProduk(d.produk.minuman, 'Belum ada produk minuman.')}
    </section>
    ${footer(d.sosial)}`;
}

// ----------------------------------------------------------------- Profil
export function renderProfil(d) {
  const p = d.profil;
  const paragraf = p.paragraf.map((t) => `<p>${esc(t)}</p>`).join('');
  const pengurus = p.pengurus.map((o) => `
      <div class="orang"><span>${esc(o.jabatan)}</span><p>${esc(o.nama)}</p></div>`).join('');
  const wa = p.whatsapp
    ? `<a class="btn-wa" href="${esc(p.whatsapp)}"><i class="fa-brands fa-whatsapp"></i> Chat Via WhatsApp</a>` : '';
  return `
    <section class="profil">
      <h2 class="judul-halaman">${esc(p.nama)}</h2>
      <div class="kartu-hijau">
        <h3>${esc(p.judulSejarah)}</h3>
        <div class="kartu-hijau__isi">${paragraf}</div>
      </div>
      <div class="info-baris"><i class="fa-regular fa-clock"></i> ${esc(p.jam)}</div>
      ${wa}
      <div class="kartu-hijau struktur">
        <h3>Struktur Kepengurusan</h3>
        <div class="orang-grid">${pengurus}</div>
      </div>
      <div class="alamat"><i class="fa-solid fa-location-dot"></i> ${esc(p.alamat)}</div>
    </section>
    ${footer(d.sosial)}`;
}

// ----------------------------------------------------------------- Galeri
export function renderGaleri(d) {
  const g = d.galeri;
  const isi = g.foto.length
    ? `<div class="galeri-grid">` + g.foto.map((f, i) => `
      <button class="galeri-item${f.besar ? ' galeri-item--besar' : ''}" data-index="${i}" aria-label="Lihat ${esc(f.judul)}">
        ${img(f.foto, f.judul)}
        <span>${esc(f.judul)}</span>
      </button>`).join('') + `</div>`
    : `<p class="kosong">Belum ada foto galeri.</p>`;
  return `
    <section class="galeri">
      <h2 class="judul-halaman">${esc(g.judul)}</h2>
      ${isi}
    </section>
    ${footer(d.sosial)}`;
}

// ------------------------------------------------------- Loading & Error
export function renderLoading() {
  const kotak = Array.from({ length: 6 }, () => '<div class="skel skel--kotak"></div>').join('');
  return `
    <div class="skel skel--judul"></div>
    <div class="skel skel--teks"></div>
    <div class="skel skel--teks short"></div>
    <div class="skel-grid">${kotak}</div>`;
}

const PESAN_ERROR = {
  OFFLINE: ['fa-wifi', 'Tidak ada koneksi internet', 'Periksa sambungan internet HP kamu, lalu coba lagi.'],
  TIMEOUT: ['fa-hourglass-half', 'Server terlalu lama merespons', 'Koneksi lambat atau server sedang sibuk. Coba lagi sebentar lagi.'],
  HTTP: ['fa-triangle-exclamation', 'Website sedang bermasalah', 'Server website mengirim respons yang tidak normal. Coba lagi nanti.'],
  FORMAT: ['fa-file-circle-question', 'Data tidak dapat dibaca', 'Website mengirim halaman yang tidak dikenali (mungkin sedang pemeliharaan). Coba lagi nanti atau buka lewat browser.'],
  NETWORK: ['fa-cloud-bolt', 'Gagal terhubung ke server', 'Pastikan internet aktif, lalu coba lagi.'],
};

export function renderError(kind) {
  const [ikon, judul, isi] = PESAN_ERROR[kind] || PESAN_ERROR.NETWORK;
  return `
    <div class="error">
      <div class="error__ikon"><i class="fa-solid ${ikon}"></i></div>
      <h2>${judul}</h2>
      <p>${isi}</p>
      <button class="btn" id="btnRetry"><i class="fa-solid fa-rotate-right"></i> Coba Lagi</button>
      <a class="btn btn--garis" href="${esc(BASE_URL)}/" data-luar><i class="fa-solid fa-globe"></i> Buka Website</a>
    </div>`;
}

/** Teks tanggal untuk spanduk "mode offline". */
export function formatWaktu(ms) {
  try {
    return new Date(ms).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// ------------------------------------------------------------- Tentang Kami
// Halaman statis: tetap tampil walaupun data website belum berhasil dimuat.
export function renderTentang(d) {
  const t = TENTANG;
  const p = t.pembuat;
  const sosial = d?.sosial || { instagram: 'smekda.official', tiktok: 'SMKN 2 PURWAKARTA' };
  const langkah = t.langkah.map(([ikon, judul, isi]) => `
      <li>
        <span class="langkah__ikon"><i class="fa-solid fa-${esc(ikon)}"></i></span>
        <div><strong>${esc(judul)}</strong><p>${esc(isi)}</p></div>
      </li>`).join('');
  return `
    <section class="tentang">
      <h2 class="judul-halaman">Tentang Kami</h2>

      <div class="kartu-hijau">
        <h3>Tentang Aplikasi</h3>
        <div class="kartu-hijau__isi">
          <p>${esc(t.deskripsi)}</p>
          <p class="meta">Versi ${esc(t.versi)} · ${esc(t.tahun)}</p>
        </div>
      </div>

      <div class="kartu-hijau">
        <h3>Pembuat Aplikasi</h3>
        <div class="pembuat">
          <div class="pembuat__avatar"><i class="fa-solid fa-user-graduate"></i></div>
          <div>
            <div class="pembuat__nama">${esc(p.nama)}</div>
            <div class="pembuat__info">${esc(p.jurusan)}</div>
            <div class="pembuat__info">${esc(p.sekolah)}</div>
            <div class="pembuat__info">${esc(p.keterangan)}</div>
          </div>
        </div>
      </div>

      <div class="kartu-hijau">
        <h3>Cara Menggunakan Aplikasi</h3>
        <ol class="langkah">${langkah}</ol>
      </div>
    </section>
    ${footer(sosial)}`;
}

// ----------------------------------------------------------------- Login
export function renderLogin() {
  return `
    <section class="login">
      <div class="login__ikon"><i class="fa-solid fa-lock"></i></div>
      <h2>Login Admin</h2>
      <p>Halaman ini khusus pengelola Smekda Mart untuk mengubah produk, profil usaha, struktur pengurus, dan galeri.
         Pengunjung biasa <strong>tidak perlu login</strong>.</p>
      <a class="btn" href="${esc(LOGIN_URL)}" data-admin><i class="fa-solid fa-right-to-bracket"></i> Buka Halaman Login</a>
      <p class="login__catatan"><i class="fa-solid fa-shield-halved"></i>
         Login dibuka di dalam aplikasi. Setelah logout, kamu otomatis kembali ke aplikasi (atau tekan tombol Kembali ke Aplikasi di atas). Aplikasi ini tidak menyimpan email maupun password.</p>
    </section>`;
}
