// =====================================================================
// api.js — Mengambil data dari website Smekda Mart dan mengubahnya
// menjadi data rapi (objek JavaScript).
//
// Website Smekda Mart tidak punya API JSON. Datanya (produk, profil, galeri,
// dst.) sudah ditampilkan di halaman utamanya. Jadi aplikasi:
//   1. mengunduh halaman utama website (HTML) — hanya membaca,
//   2. mengambil datanya (parseHome),
//   3. menyimpan salinannya di HP (cache) untuk dipakai saat offline.
// =====================================================================

import { BASE_URL, REQUEST_TIMEOUT_MS, CACHE_KEY, PAKAI_FOTO_LOKAL } from './config.js';

// ---------- Jenis error (dipakai ui.js untuk memilih pesan) ----------
export class AppError extends Error {
  constructor(kind, message) {
    super(message || kind);
    this.kind = kind; // 'OFFLINE' | 'TIMEOUT' | 'HTTP' | 'FORMAT' | 'NETWORK'
  }
}

// ---------- Utilitas kecil ----------
const teks = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

/** "Rp 12.500" -> 12500 */
export function ambilAngka(s) {
  const n = parseInt(String(s || '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Menentukan alamat foto yang akan dipakai.
 * - Foto di /images/ yang ikut dibundel di aplikasi -> dipakai versi lokal.
 * - Selain itu -> diambil dari website (dipaksa https dan host yang benar,
 *   karena Laravel kadang menulis http:// atau localhost).
 * Mengembalikan { src, fallback } — fallback dipakai bila src gagal dimuat.
 */
export function resolveFoto(src) {
  if (!src) return { src: 'assets/images/smekda-removebg-preview.png', fallback: '' };
  let u;
  try {
    u = new URL(src, BASE_URL + '/');
  } catch {
    return { src: 'assets/images/smekda-removebg-preview.png', fallback: '' };
  }
  const base = new URL(BASE_URL);
  const hostSalah = u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === base.hostname;
  if (hostSalah) u = new URL(u.pathname + u.search, base);
  if (u.protocol === 'http:') u.protocol = 'https:';
  const remote = u.href;

  if (PAKAI_FOTO_LOKAL && u.hostname === base.hostname && u.pathname.startsWith('/images/')) {
    let nama = u.pathname.slice('/images/'.length);
    try { nama = decodeURIComponent(nama); } catch { /* biarkan apa adanya */ }
    return { src: 'assets/images/' + encodeURI(nama), fallback: remote };
  }
  return { src: remote, fallback: '' };
}

/** Membaca tujuan klik kartu beranda, mis. "#produk" atau "#minuman". */
function bacaTautan(card) {
  const js = card.getAttribute('onclick') || '';
  let m = js.match(/querySelector\('([^']*)'\)/);
  if (m && m[1]) return m[1];
  m = js.match(/getElementById\('([^']*)'\)/);
  return m ? '#' + m[1] : '#produk';
}

function bacaProduk(grid) {
  if (!grid) return [];
  return Array.from(grid.querySelectorAll('.produk-card')).map((c) => ({
    nama: teks(c.querySelector('p')),
    harga: ambilAngka(teks(c.querySelector('span'))),
    foto: resolveFoto(c.querySelector('img')?.getAttribute('src')),
  }));
}

// ---------- Mengubah HTML halaman menjadi data ----------
export function parseHome(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Pemeriksaan: apakah ini benar halaman Smekda Mart?
  // (Jika yang datang halaman pemeliharaan / pengaman bot, bagian ini tidak ada.)
  if (!doc.querySelector('#beranda') || !doc.querySelector('#produk') || !doc.querySelector('#profil')) {
    throw new AppError('FORMAT', 'Halaman website tidak dikenali');
  }

  const grids = doc.querySelectorAll('#produk .produk-grid');
  const sosial = Array.from(doc.querySelectorAll('#beranda .footer span')).map(teks);

  const sejarahEl = doc.querySelector('#profil .sejarah');
  const waHref = doc.querySelector('#profil a.whatsapp')?.getAttribute('href') || '';

  return {
    logo: resolveFoto(doc.querySelector('.logo-area img')?.getAttribute('src')),
    beranda: {
      judul: teks(doc.querySelector('#beranda .beranda-content h2')),
      deskripsi: teks(doc.querySelector('#beranda .beranda-content > p')),
      item: Array.from(doc.querySelectorAll('#beranda .kategori-card')).map((c) => ({
        judul: teks(c.querySelector('div')),
        foto: resolveFoto(c.querySelector('img')?.getAttribute('src')),
        tautan: bacaTautan(c),
      })),
    },
    produk: {
      makanan: bacaProduk(grids[0]),
      minuman: bacaProduk(grids[1]),
    },
    profil: {
      nama: teks(doc.querySelector('#profil .profil-title')),
      judulSejarah: teks(sejarahEl?.querySelector('h3')),
      paragraf: sejarahEl ? Array.from(sejarahEl.querySelectorAll('p')).map(teks).filter(Boolean) : [],
      jam: teks(doc.querySelector('#profil .jam')),
      whatsapp: waHref,
      pengurus: Array.from(doc.querySelectorAll('#profil .orang')).map((o) => ({
        jabatan: teks(o.querySelector('span')),
        nama: teks(o.querySelector('p')),
      })),
      alamat: teks(doc.querySelector('#profil .alamat')),
    },
    galeri: {
      judul: teks(doc.querySelector('#galeri .galeri-content h2')),
      foto: Array.from(doc.querySelectorAll('#galeri .galeri-item')).map((g) => ({
        judul: teks(g.querySelector('span')),
        foto: resolveFoto(g.querySelector('img')?.getAttribute('src')),
        besar: g.classList.contains('besar'),
      })),
    },
    sosial: { instagram: sosial[0] || '', tiktok: sosial[1] || '' },
  };
}

// ---------- Cache di HP ----------
export function bacaCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null; // { data, waktu }
  } catch {
    return null;
  }
}

function simpanCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, waktu: Date.now() }));
  } catch { /* penyimpanan penuh / diblokir: abaikan */ }
}

// ---------- Mengunduh halaman ----------
function denganBatasWaktu(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new AppError('TIMEOUT')), ms)),
  ]);
}

async function unduhHtml() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new AppError('OFFLINE');
  // Mode demo: hanya untuk melihat tampilan di komputer (lihat scripts/server-lokal.mjs)
  const demo = new URLSearchParams(location.search).get('demo') === '1' && location.port === '5173';
  const alamat = demo ? '/__demo__' : BASE_URL + '/';
  let res;
  try {
    res = await denganBatasWaktu(fetch(alamat, { headers: { Accept: 'text/html' } }), REQUEST_TIMEOUT_MS);
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError('NETWORK', e && e.message);
  }
  if (!res.ok) throw new AppError('HTTP', 'Status ' + res.status);
  return res.text();
}

/**
 * Fungsi utama. Mengembalikan { data, waktu, dariCache }.
 * - Berhasil online  -> data baru (dan disimpan ke cache)
 * - Gagal tapi ada cache -> data lama, dariCache = true
 * - Gagal dan tidak ada cache -> melempar AppError
 */
export async function ambilData() {
  try {
    const html = await unduhHtml();
    const data = parseHome(html);
    simpanCache(data);
    return { data, waktu: Date.now(), dariCache: false };
  } catch (err) {
    const cache = bacaCache();
    if (cache && cache.data) return { data: cache.data, waktu: cache.waktu, dariCache: true, alasan: err.kind };
    throw err instanceof AppError ? err : new AppError('NETWORK', err && err.message);
  }
}
