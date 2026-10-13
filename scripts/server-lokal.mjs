// =====================================================================
// server-lokal.mjs — Server kecil untuk melihat aplikasi di browser komputer
// (tanpa emulator). Jalankan:  npm run tes   lalu buka http://localhost:5173
// Tips: tekan F12 -> ikon HP (Toggle device toolbar) untuk tampilan layar HP.
//
// CATATAN: di browser komputer, pengambilan data dari website bisa ditolak
// aturan CORS. Itu NORMAL. Di aplikasi Android, Capacitor memakai HTTP native
// sehingga tidak terkena CORS. Untuk melihat tampilan saja, pakai data contoh
// dengan membuka:  http://localhost:5173/?demo=1  (hanya membaca tests/fixture/home.html)
// =====================================================================
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const www = path.join(akar, 'www');
const PORT = 5173;
const TIPE = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.json': 'application/json' };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  // Alamat khusus: berkas contoh (hanya untuk melihat tampilan)
  if (url.pathname === '/__demo__') {
    const f = path.join(akar, 'tests', 'fixture', 'home.html');
    if (fs.existsSync(f)) { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'access-control-allow-origin': '*' }); return fs.createReadStream(f).pipe(res); }
  }
  let berkas = path.normalize(path.join(www, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)));
  if (!berkas.startsWith(www) || !fs.existsSync(berkas) || fs.statSync(berkas).isDirectory()) { res.writeHead(404); return res.end('Tidak ditemukan'); }
  res.writeHead(200, { 'content-type': TIPE[path.extname(berkas).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(berkas).pipe(res);
}).listen(PORT, () => console.log(`Aplikasi berjalan di http://localhost:${PORT}  (Ctrl+C untuk berhenti)`));
