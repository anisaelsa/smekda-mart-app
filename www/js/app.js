// =====================================================================
// app.js — "Otak" aplikasi: navigasi antar halaman, memuat data,
// spanduk offline, dan penampil foto galeri.
// =====================================================================

import { ambilData } from './api.js';
import { BASE_URL, HALAMAN_ADMIN, OPSI_JENDELA_ADMIN } from './config.js';
import {
  renderBeranda, renderProduk, renderProfil, renderGaleri, renderTentang, renderLogin,
  renderLoading, renderError, formatWaktu,
} from './ui.js';

const $ = (sel) => document.querySelector(sel);
const view = $('#view');
const banner = $('#statusBanner');

// Keadaan aplikasi
const state = {
  hasil: null,        // { data, waktu, dariCache }
  memuat: false,
  error: null,        // jenis error bila gagal total
};

// ------------------------------------------------------------ Navigasi
/** Membaca alamat "#/produk/minuman" -> { tab: 'produk', sub: 'minuman' } */
function bacaRute() {
  const [, tab = 'beranda', sub = ''] = location.hash.split('/');
  const sah = ['beranda', 'produk', 'profil', 'galeri', 'tentang', 'login'];
  return { tab: sah.includes(tab) ? tab : 'beranda', sub };
}

const RENDERER = { beranda: renderBeranda, produk: renderProduk, profil: renderProfil, galeri: renderGaleri };
// Halaman statis: tidak butuh data website, jadi selalu bisa dibuka
const STATIS = { tentang: renderTentang, login: renderLogin };

function tampilkan() {
  const { tab, sub } = bacaRute();

  // Tandai tab aktif
  document.querySelectorAll('.tabbar__item').forEach((a) => {
    const aktif = a.dataset.tab === tab;
    a.classList.toggle('is-active', aktif);
    if (aktif) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });

  // Isi halaman
  if (STATIS[tab]) {
    view.innerHTML = STATIS[tab](state.hasil?.data);
  } else if (state.hasil) {
    view.innerHTML = RENDERER[tab](state.hasil.data);
  } else if (state.error) {
    view.innerHTML = renderError(state.error);
  } else {
    view.innerHTML = renderLoading();
  }
  window.scrollTo(0, 0);

  // Lompat ke bagian Minuman bila diminta
  if (tab === 'produk' && sub === 'minuman') {
    requestAnimationFrame(() => $('#sec-minuman')?.scrollIntoView());
  }
}

// ---------------------------------------------------------- Memuat data
async function muatData() {
  if (state.memuat) return;
  state.memuat = true;
  $('#btnRefresh').classList.add('is-spin');
  if (!state.hasil) { state.error = null; tampilkan(); }

  try {
    state.hasil = await ambilData();
    state.error = null;
  } catch (err) {
    if (!state.hasil) state.error = err.kind || 'NETWORK';
  } finally {
    state.memuat = false;
    $('#btnRefresh').classList.remove('is-spin');
  }
  perbaruiBanner();
  // Jangan menimpa penampil foto / posisi gulir bila foto sedang dibuka
  if (!lightboxTerbuka()) tampilkan();
}

function perbaruiBanner() {
  const h = state.hasil;
  if (h && h.dariCache) {
    banner.hidden = false;
    banner.className = 'banner banner--offline';
    banner.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> Mode offline · data per ${formatWaktu(h.waktu)}`;
  } else {
    banner.hidden = true;
  }
}

// ---------------------------------------------------- Penampil foto (galeri)
const lb = { el: $('#lightbox'), img: $('#lbImg'), cap: $('#lbCaption'), i: 0 };
const lightboxTerbuka = () => !lb.el.hidden;

function bukaFoto(i) {
  const foto = state.hasil?.data.galeri.foto;
  if (!foto || !foto[i]) return;
  lb.i = i;
  lb.img.src = foto[i].foto.src;
  lb.img.dataset.fallback = foto[i].foto.fallback || '';
  lb.img.alt = foto[i].judul;
  lb.cap.textContent = `${foto[i].judul}  (${i + 1}/${foto.length})`;
  if (lb.el.hidden) {
    lb.el.hidden = false;
    history.pushState({ lightbox: true }, '');   // tombol Back HP menutup foto
  }
}

function tutupFoto(dariTombolBack = false) {
  if (lb.el.hidden) return;
  lb.el.hidden = true;
  if (!dariTombolBack) history.back();
}

function geserFoto(arah) {
  const n = state.hasil?.data.galeri.foto.length || 0;
  if (n) bukaFoto((lb.i + arah + n) % n);
}

// ------------------------------------------------- Membuka tautan di luar aplikasi
// Di HP: jendela browser di dalam aplikasi (Chrome Custom Tab, ada tombol X untuk kembali).
// Di komputer (uji coba): tab baru, supaya halaman aplikasi tidak tertimpa.
async function bukaLuar(url) {
  const browser = window.Capacitor?.Plugins?.Browser;
  if (browser?.open) {
    try { await browser.open({ url }); return; } catch { /* lanjut ke cara cadangan */ }
  }
  // CATATAN: window.open(..., 'noopener') selalu mengembalikan null (walau berhasil),
  // jadi dibuka tanpa 'noopener' lalu 'opener'-nya diputus manual.
  const jendela = window.open(url, '_blank');
  if (jendela) jendela.opener = null;
  else location.href = url;   // pemblokir popup aktif: terpaksa di halaman yang sama
}

// ------------------------------------------------------ Sesi admin di dalam aplikasi
// Membuka website di jendela di dalam aplikasi (plugin InAppBrowser) dan MEMANTAU alamatnya:
//   /login (awal)            -> tetap di jendela, pengguna mengisi login
//   /admin/...               -> pengguna sedang di dalam admin
//   /login lagi (= logout)   -> jendela ditutup, kembali ke aplikasi
//   / (beranda website)      -> jendela ditutup, kembali ke aplikasi
function bukaAdmin(url) {
  const iab = window.cordova?.InAppBrowser;
  if (!iab?.open) { bukaLuar(url); return; }   // di komputer / plugin tidak ada: cara biasa

  const host = new URL(BASE_URL).hostname;
  let sudahMasuk = false;
  const ref = iab.open(url, '_blank', OPSI_JENDELA_ADMIN);

  ref.addEventListener('loadstart', (e) => {
    let u;
    try { u = new URL(e.url); } catch { return; }
    if (u.hostname !== host) return;
    const path = u.pathname.replace(/\/+$/, '') || '/';
    if (HALAMAN_ADMIN.some((p) => path === p || path.startsWith(p + '/'))) { sudahMasuk = true; return; }
    if (path === '/' || (sudahMasuk && path === '/login')) ref.close();
  });

  // Jendela tertutup (otomatis atau lewat tombol "Kembali ke Aplikasi"): tampilkan Beranda aplikasi
  ref.addEventListener('exit', () => {
    location.hash = '#/beranda';
    muatData();
  });
}

document.addEventListener('click', (e) => {
  const admin = e.target.closest('a[data-admin]');
  if (admin) { e.preventDefault(); bukaAdmin(admin.href); return; }
  const luar = e.target.closest('a[data-luar]');
  if (luar) { e.preventDefault(); bukaLuar(luar.href); }
});

// ----------------------------------------------------------- Pemasangan event
view.addEventListener('click', (e) => {
  const chip = e.target.closest('[data-scroll]');
  if (chip) { document.getElementById(chip.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' }); return; }

  const foto = e.target.closest('.galeri-item');
  if (foto) { bukaFoto(Number(foto.dataset.index)); return; }

  if (e.target.closest('#btnRetry')) muatData();
});

$('#btnRefresh').addEventListener('click', muatData);
$('#lbClose').addEventListener('click', () => tutupFoto());
$('#lbPrev').addEventListener('click', () => geserFoto(-1));
$('#lbNext').addEventListener('click', () => geserFoto(1));
lb.el.addEventListener('click', (e) => { if (e.target === lb.el) tutupFoto(); });

// Geser kiri/kanan pada foto
let sentuhX = null;
lb.el.addEventListener('touchstart', (e) => { sentuhX = e.touches[0].clientX; }, { passive: true });
lb.el.addEventListener('touchend', (e) => {
  if (sentuhX === null) return;
  const dx = e.changedTouches[0].clientX - sentuhX;
  if (Math.abs(dx) > 50) geserFoto(dx < 0 ? 1 : -1);
  sentuhX = null;
});

// Tombol Back HP: tutup foto dulu, bila tidak ada foto -> pindah halaman
window.addEventListener('popstate', () => { if (lightboxTerbuka()) tutupFoto(true); });
window.addEventListener('hashchange', () => { if (!lightboxTerbuka()) tampilkan(); });

// Foto gagal dimuat -> coba alamat cadangan (website), kalau gagal juga sembunyikan
document.addEventListener('error', (e) => {
  const el = e.target;
  if (!(el instanceof HTMLImageElement)) return;
  const fb = el.dataset.fallback;
  if (fb && el.src !== fb) { el.src = fb; el.dataset.fallback = ''; }
  else el.classList.add('img-gagal');
}, true);

// Internet kembali menyala -> muat data terbaru otomatis
window.addEventListener('online', muatData);
window.addEventListener('offline', () => { if (state.hasil) { state.hasil.dariCache = true; perbaruiBanner(); } });

// ----------------------------------------------------------------- Mulai
tampilkan();
muatData();
