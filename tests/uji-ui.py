"""
uji-ui.py — Pengujian otomatis tampilan & logika aplikasi di browser (ukuran layar HP).
OPSIONAL (butuh: pip install playwright). Tidak menyentuh website asli: semua permintaan
ke website dialihkan ke berkas contoh di tests/fixture/.

Jalankan:
  python3 tests/buat-fixture.py
  python3 tests/uji-ui.py
Hasil: ringkasan PASS/FAIL + tangkapan layar di tests/hasil/
"""
import http.server, os, socketserver, sys, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WWW, FIX, OUT = os.path.join(ROOT, "www"), os.path.join(ROOT, "tests", "fixture"), os.path.join(ROOT, "tests", "hasil")
os.makedirs(OUT, exist_ok=True)
SITE = "https://alfaclasssmkn2pwk.site.je"

class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=WWW, **k)
    def log_message(self, *a): pass

socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(("127.0.0.1", 0), Quiet)  # 0 = pilih port kosong otomatis
PORT = httpd.server_address[1]
threading.Thread(target=httpd.serve_forever, daemon=True).start()

hasil = []
def cek(nama, kondisi, info=""):
    hasil.append(bool(kondisi))
    print(("PASS " if kondisi else "FAIL ") + nama + (f"   [{info}]" if (info and not kondisi) else ""))

PNG = bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc0f01f0005000201a52f1c8d0000000049454e44ae426082")

def pasang_rute(page, fixture, state):
    """Alihkan permintaan ke website -> berkas contoh."""
    def handler(route):
        req = route.request
        if state.get("putus"):
            return route.abort("internetdisconnected")
        if req.url.rstrip("/") == SITE and req.resource_type in ("fetch", "xhr"):
            isi = open(os.path.join(FIX, state.get("fixture", fixture)), encoding="utf-8").read()
            return route.fulfill(status=state.get("status", 200), body=isi, content_type="text/html; charset=utf-8",
                                 headers={"access-control-allow-origin": "*"})
        state.setdefault("remote_img", []).append(req.url)
        return route.fulfill(status=200, body=PNG, content_type="image/png")
    page.route(lambda u: not u.startswith(f"http://127.0.0.1:{PORT}"), handler)

def buka(browser, fixture="home.html", **state):
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    log = {"console": [], "gagal_lokal": []}
    page.on("console", lambda m: log["console"].append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: log["console"].append(str(e)))
    page.on("response", lambda r: log["gagal_lokal"].append(r.url) if r.url.startswith(f"http://127.0.0.1:{PORT}") and r.status >= 400 else None)
    st = dict(state)
    pasang_rute(page, fixture, st)
    page.goto(f"http://127.0.0.1:{PORT}/index.html#/beranda")
    return ctx, page, st, log

with sync_playwright() as p:
    br = p.chromium.launch()

    # ---------- 1. Data seperti seeder ----------
    ctx, page, st, log = buka(br)
    page.wait_for_selector(".kategori")
    cek("Beranda: judul dari website", "Semua yang kamu cari" in page.inner_text(".hero h1"))
    cek("Beranda: 4 kartu kategori", page.locator(".kategori").count() == 4)
    cek("Spanduk offline tersembunyi saat online", page.locator("#statusBanner").is_hidden())
    page.screenshot(path=f"{OUT}/1-beranda.png")

    page.click('.tabbar__item[data-tab="produk"]'); page.wait_for_selector(".produk")
    cek("Produk: 12 makanan + 12 minuman", page.locator("#sec-makanan .produk").count() == 12 and page.locator("#sec-minuman .produk").count() == 12)
    cek("Produk: format harga Rp 10.000", "Rp 10.000" in page.inner_text("#sec-makanan"))
    cek("Produk: Momogi Rp 500", "Rp 500" in page.inner_text("#sec-makanan"))
    page.screenshot(path=f"{OUT}/2-produk.png")
    page.click('.chip[data-scroll="sec-minuman"]'); page.wait_for_timeout(700)
    page.screenshot(path=f"{OUT}/2b-minuman.png")

    page.click('.tabbar__item[data-tab="profil"]'); page.wait_for_selector(".orang")
    cek("Profil: 3 paragraf sejarah", page.locator(".kartu-hijau__isi p").count() == 3)
    cek("Profil: jam operasional", "08.00 - 14.00" in page.inner_text(".info-baris"))
    cek("Profil: tautan WhatsApp", page.get_attribute(".btn-wa", "href") == "https://wa.me/6283825960046")
    cek("Profil: 2 pengurus", page.locator(".orang").count() == 2)
    cek("Profil: alamat tampil", "Nagri Tengah" in page.inner_text(".alamat"))
    page.screenshot(path=f"{OUT}/3-profil.png", full_page=True)

    page.click('.tabbar__item[data-tab="galeri"]'); page.wait_for_selector(".galeri-item")
    cek("Galeri: 5 foto, 1 besar", page.locator(".galeri-item").count() == 5 and page.locator(".galeri-item--besar").count() == 1)
    page.screenshot(path=f"{OUT}/4-galeri.png")
    page.click('.galeri-item >> nth=2'); page.wait_for_timeout(200)
    cek("Galeri: penampil foto terbuka", page.locator("#lightbox").is_visible() and "Promo Alfa Class" in page.inner_text("#lbCaption"))
    page.screenshot(path=f"{OUT}/5-foto.png")
    page.click("#lbNext"); page.wait_for_timeout(100)
    cek("Galeri: tombol berikutnya", "(4/5)" in page.inner_text("#lbCaption"))
    page.go_back(); page.wait_for_timeout(200)
    cek("Galeri: tombol Back menutup foto (tetap di Galeri)", page.locator("#lightbox").is_hidden() and "#/galeri" in page.url)

    # Tentang Kami & Login (fitur tambahan)
    cek("Navigasi bawah punya 5 tab (termasuk Tentang)", page.locator(".tabbar__item").count() == 5)
    page.click('.tabbar__item[data-tab="tentang"]'); page.wait_for_selector(".tentang"); page.wait_for_timeout(350)
    cek("Tentang: nama pembuat tampil", "Anisa Paradina Agustin" in page.inner_text(".tentang"))
    cek("Tentang: ada >= 5 langkah cara penggunaan", page.locator(".langkah li").count() >= 5)
    page.screenshot(path=f"{OUT}/8-tentang.png")
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)"); page.wait_for_timeout(200)
    page.screenshot(path=f"{OUT}/8b-tentang-bawah.png")
    cek("Tombol Login ada di bilah atas", page.locator(".appbar__login").is_visible())
    page.click(".appbar__login"); page.wait_for_selector(".login"); page.wait_for_timeout(350)
    cek("Login: tombol mengarah ke halaman login website", page.get_attribute(".login a.btn", "href") == SITE + "/login")
    cek("Login: tidak ada kolom password (aplikasi tidak memproses password)", page.locator("input").count() == 0)
    with ctx.expect_page() as popup:
        page.click(".login a.btn")
    popup.value.close()
    cek("Login (komputer): dibuka di tab baru, halaman aplikasi tetap utuh", "#/login" in page.url and page.locator(".login").is_visible())

    # --- Sesi admin di HP: plugin InAppBrowser ditiru (mock) untuk menguji LOGIKA pemantau alamat ---
    MOCK = """window.cordova = {InAppBrowser: {open(url, target, opts) {
        const L = {}; window.__ditutup = 0;
        const ref = {addEventListener(n, f) { L[n] = f; }, close() { window.__ditutup++; L.exit && L.exit({}); }};
        window.__iab = {url, opts, L, ref}; return ref; }}};"""
    def sesi(urls):
        page.evaluate(MOCK); page.evaluate("location.hash = '#/login'"); page.wait_for_selector(".login")
        page.click(".login a.btn"); page.wait_for_timeout(100)
        hasil_ = [page.evaluate("window.__iab.url")]
        for u in urls:
            page.evaluate("(u) => window.__iab.L.loadstart({url: u})", SITE + u)
            hasil_.append(page.evaluate("window.__ditutup"))
        return hasil_
    r = sesi(["/login", "/admin/beranda", "/admin/produk"])
    cek("Admin HP: membuka halaman login website di dalam aplikasi", r[0] == SITE + "/login")
    cek("Admin HP: login & menu admin TIDAK menutup jendela", r[1:] == [0, 0, 0], str(r))
    page.evaluate("window.__iab.L.loadstart({url: '%s/login'})" % SITE)   # logout -> /login
    page.wait_for_timeout(150)
    cek("Admin HP: logout (/login setelah masuk admin) menutup jendela & kembali ke Beranda aplikasi",
        page.evaluate("window.__ditutup") == 1 and "#/beranda" in page.url)
    page.wait_for_selector(".kategori")
    cek("Admin HP: setelah kembali, tampilan aplikasi (bukan website) yang muncul", page.locator(".tabbar").is_visible() and page.locator(".kategori").count() == 4)
    r = sesi(["/login", "/login"])   # login gagal berulang: tetap di jendela
    cek("Admin HP: login gagal (kembali ke /login tanpa pernah masuk) tidak menutup jendela", r[1:] == [0, 0], str(r))
    page.evaluate("window.__iab.L.loadstart({url: '%s/'})" % SITE)   # beranda website
    page.wait_for_timeout(150)
    cek("Admin HP: membuka beranda website (/) menutup jendela & kembali ke aplikasi", page.evaluate("window.__ditutup") == 1 and "#/beranda" in page.url)
    page.evaluate("delete window.cordova")
    page.screenshot(path=f"{OUT}/9-login.png")

    # kartu beranda -> bagian Minuman
    page.click('.tabbar__item[data-tab="beranda"]'); page.wait_for_selector(".kategori")
    page.click('.kategori >> nth=1'); page.wait_for_timeout(500)
    cek("Beranda -> kartu 'Produk Minuman' membuka bagian Minuman", "#/produk/minuman" in page.url and page.evaluate("document.getElementById('sec-minuman').getBoundingClientRect().top < 200"))

    cek("Foto lokal dimuat tanpa 404", not log["gagal_lokal"], str(log["gagal_lokal"][:5]))
    cek("Tidak ada foto yang diambil dari website (semua lokal)", not st.get("remote_img"), str(st.get("remote_img", [])[:3]))
    cek("Tidak ada error JavaScript", not log["console"], str(log["console"][:3]))
    ctx.close()

    # ---------- 2. Data 'sulit' ----------
    ctx, page, st, log = buka(br, "home-variasi.html")
    page.click('.tabbar__item[data-tab="produk"]'); page.wait_for_selector(".produk")
    cek("Variasi: makanan kosong -> pesan kosong", "Belum ada produk makanan" in page.inner_text("#sec-makanan"))
    cek("Variasi: HTML di nama produk tidak dieksekusi", page.locator("#sec-minuman .produk b").count() == 0 and "<b>Teh</b>" in page.inner_text("#sec-minuman"))
    cek("Variasi: Rp 12.500", "Rp 12.500" in page.inner_text("#sec-minuman"))
    page.wait_for_timeout(300)
    remote = st.get("remote_img", [])
    cek("Variasi: foto upload diambil dari host asli via https", any(u == f"{SITE}/storage/produk/abc.jpg" for u in remote), str(remote))
    cek("Variasi: tidak ada permintaan ke localhost/http", not any(("localhost" in u or u.startswith("http://")) for u in remote), str(remote))
    page.click('.tabbar__item[data-tab="profil"]'); page.wait_for_selector(".orang")
    cek("Variasi: 10 pengurus tampil semua", page.locator(".orang").count() == 10)
    ctx.close()

    # ---------- 3. Offline dengan cache ----------
    ctx, page, st, log = buka(br)
    page.wait_for_selector(".kategori")
    st["putus"] = True
    page.reload(); page.wait_for_selector(".kategori"); page.wait_for_timeout(300)
    cek("Offline: data terakhir tetap tampil dari cache", page.locator(".kategori").count() == 4)
    cek("Offline: spanduk 'Mode offline' tampil", page.locator("#statusBanner").is_visible() and "Mode offline" in page.inner_text("#statusBanner"))
    page.screenshot(path=f"{OUT}/6-offline-cache.png")
    st["putus"] = False
    page.click("#btnRefresh"); page.wait_for_timeout(500)
    cek("Tombol muat ulang: kembali online, spanduk hilang", page.locator("#statusBanner").is_hidden())
    ctx.close()

    # ---------- 4. Error tanpa cache ----------
    ctx, page, st, log = buka(br, putus=True)
    page.wait_for_selector(".error")
    cek("Error: tampilan error muncul (tanpa cache)", "Gagal terhubung" in page.inner_text(".error h2"))
    page.screenshot(path=f"{OUT}/7-error.png")
    page.click('.tabbar__item[data-tab="tentang"]'); page.wait_for_selector(".tentang")
    cek("Tentang tetap bisa dibuka saat data gagal dimuat", "Anisa Paradina Agustin" in page.inner_text(".tentang"))
    page.click('.tabbar__item[data-tab="beranda"]'); page.wait_for_selector(".error")
    st["putus"] = False
    page.click("#btnRetry"); page.wait_for_selector(".kategori")
    cek("Error: tombol Coba Lagi memulihkan aplikasi", page.locator(".kategori").count() == 4)
    ctx.close()

    ctx, page, st, log = buka(br, "halaman-bot.html")
    page.wait_for_selector(".error")
    cek("Halaman asing (bukan Smekda Mart) -> error 'Data tidak dapat dibaca'", "tidak dapat dibaca" in page.inner_text(".error h2"))
    ctx.close()

    ctx, page, st, log = buka(br, status=503)
    page.wait_for_selector(".error")
    cek("Server 503 -> error 'Website sedang bermasalah'", "bermasalah" in page.inner_text(".error h2"))
    ctx.close()

    br.close()

httpd.shutdown()
ok, total = sum(hasil), len(hasil)
print(f"\nHASIL: {ok}/{total} lulus")
sys.exit(0 if ok == total else 1)
