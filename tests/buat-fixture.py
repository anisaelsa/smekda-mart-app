"""
buat-fixture.py — Membuat contoh halaman website (HTML) untuk pengujian OFFLINE.

Strukturnya meniru resources/views/index.blade.php milik website Smekda Mart,
diisi data dari database/seeders/DatabaseSeeder.php. Hasilnya dipakai untuk
menguji parser (www/js/api.js) tanpa menyentuh website asli.

Jalankan:  python3 tests/buat-fixture.py
"""
import html, os

OUT = os.path.join(os.path.dirname(__file__), "fixture")
os.makedirs(OUT, exist_ok=True)
BASE = "https://alfaclasssmkn2pwk.site.je"
e = html.escape


def rp(n):
    return "Rp " + f"{n:,}".replace(",", ".")


MAKANAN = [("Slay-olay", 2000, "slay olay.jpg"), ("Beng-Beng", 2000, "bengbeng.jpg"), ("French Fries", 2000, "french fries.jpg"),
           ("Coki-coki", 1000, "coki.jpg"), ("Sponge", 10000, "sponge.webp"), ("Garuda Rosta", 2000, "garuda rosta.jpg"),
           ("Malkist", 2000, "malkist.webp"), ("Pop Mie", 7000, "pop mie.jpg"), ("Momogi", 500, "momogi.webp"),
           ("Choco Pie", 3000, "choco pie.webp"), ("Nabati", 2000, "nabati.webp"), ("Aoka", 3000, "aoka.webp")]
MINUMAN = [("Cimory", 7000, "cimory.webp"), ("Ultramilk", 7000, "ultramilk.jpg"), ("Aqua Botol", 3000, "aqua.webp"),
           ("Isoplus", 4000, "isoplus.webp"), ("Fresstea", 4000, "frestea.webp"), ("Teh Kotak", 4000, "teh kotak.jpg"),
           ("Teh Pucuk", 4000, "teh pucuk.jpeg"), ("Good Day", 5000, "kopi.jpg"), ("Aqua Galon", 5000, "aqua galon.jpg"),
           ("Le Minerale", 3000, "le mineral.jpg"), ("Nipis Madu", 3000, "nipis madu.jpg"), ("Mizone", 7000, "mizone.jpg")]
ITEM = [("Produk Makanan", "foto makanan.jpg", "#produk"), ("Produk Minuman", "foto minuman.jpg", "#minuman"),
        ("Profil Usaha", "poto profil usaha.jpeg", "#profil"), ("Galeri", "alfa.jpeg", "#galeri")]
TENTANG = ("Sejarah awal Smekda Mart di SMK Negeri 2 Purwakarta bermula dari keinginan sekolah untuk menyediakan fasilitas dan media yang dapat membantu siswa dalam mengenal dan mengembangkan keterampilan di bidang kewirausahaan.\n\n"
           "Smekda Mart merupakan sebuah bentuk layanan dan fasilitas sekolah yang menyediakan berbagai macam kebutuhan siswa, mulai dari makanan, minuman hingga berbagai produk lainnya. Kehadiran Smekda Mart diharapkan dapat menjadi sarana bagi siswa untuk belajar mengenai pengelolaan usaha secara nyata.\n\n"
           "Selain sebagai tempat berwirausaha, Smekda Mart juga menjadi media pembelajaran bagi siswa dalam mengembangkan kemampuan bekerja sama, bertanggung jawab dan berkomunikasi.")
PENGURUS = [("Pembina", "Dra. Eva Latifah S.Pd"), ("Kepala Toko", "Pengelola Alfa Class")]
GALERI = [("Suasana Alfa Class", "suasana1.jpeg", False), ("Suasana Alfa Class", "suasana2.jpeg", False),
          ("Promo Alfa Class", "Promo3.jpeg", True), ("Suasana Alfa Class", "poto profil usaha.jpeg", False),
          ("Suasana Alfa Class", "alfa.jpeg", False)]


def asset(path, base=BASE):
    return f"{base}/{path}"


def footer():
    return '<footer class="footer"><span><i class="fa-brands fa-instagram"></i> smekda.official</span><span><i class="fa-brands fa-tiktok"></i> SMKN 2 PURWAKARTA</span></footer>'


def halaman(makanan, minuman, item, pengurus, galeri, base=BASE, foto_prefix="images/", wa="6283825960046"):
    kartu = "".join(
        f'<div class="kategori-card" onclick="if(document.querySelector(\'{l}\')) {{ document.querySelector(\'{l}\').scrollIntoView({{behavior: \'smooth\'}}); }} else {{ document.getElementById(\'produk\').scrollIntoView({{behavior: \'smooth\'}}); }}">'
        f'<img src="{e(asset(foto_prefix + f, base))}" alt="{e(j)}"><div>{e(j)}</div></div>' for j, f, l in item)

    def grid(lst, kosong):
        if not lst:
            return f'<p style="grid-column: 1 / -1; text-align: center; color: #777; padding: 20px 0;">{kosong}</p>'
        return "".join(f'<div class="produk-card"><img src="{e(asset(foto_prefix + f, base))}" alt="{e(n)}"><p>{e(n)}</p><span>{rp(h)}</span></div>' for n, h, f in lst)

    paragraf = "".join(f"<p>{e(p.strip())}</p>" for p in TENTANG.split("\n\n") if p.strip())
    org = "".join(f'<div class="orang"><span>{e(j)}</span><p>{e(n)}</p></div>' for j, n in pengurus)
    gal = "".join(
        f'<div class="galeri-item {"besar" if b else ""}"><img src="{e(asset(foto_prefix + f, base))}" alt="{e(j)}"><span>{e(j)}</span></div>' for j, f, b in galeri)
    return f"""<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Alfa Class - SMKN 2 PURWAKARTA</title></head><body>
<div class="website">
<header class="navbar"><div class="logo-area"><img src="{asset('images/smekda-removebg-preview.png', base)}" alt="Logo"></div>
<div class="navbar-kanan"><div class="school-name">SMKN 2 PURWAKARTA</div><a href="{base}/login" class="btn-login">Login</a></div></header>
<nav class="menu"><a href="#beranda">Beranda</a><a href="#produk">Produk</a><a href="#profil">Profil Usaha</a><a href="#galeri">Galeri</a></nav>
<section class="page beranda" id="beranda"><div class="beranda-content">
<h2>Semua yang kamu cari, ada di sini!</h2>
<p>Selamat datang di Smekda Mart. Smekda Mart hadir untuk memudahkan kamu dalam menemukan berbagai pilihan makanan dan minuman yang tersedia.</p>
<div class="kategori-beranda">{kartu}</div></div>{footer()}</section>
<section class="page produk" id="produk"><div class="produk-container">
<h3 class="judul-kategori">Makanan</h3><div class="produk-grid">{grid(makanan, 'Belum ada produk makanan.')}</div>
<h3 class="judul-kategori" id="minuman" style="margin-top: 40px;">Minuman</h3><div class="produk-grid">{grid(minuman, 'Belum ada produk minuman.')}</div>
</div>{footer()}</section>
<section class="page profil" id="profil"><div class="profil-content"><h2 class="profil-title">Alfa Class</h2>
<div class="sejarah"><h3>Sejarah Alfa Class</h3>{paragraf}
<div class="jam"><i class="fa-regular fa-clock"></i> Senin - Jumat | Pukul 08.00 - 14.00</div>
<a href="https://wa.me/{wa}" class="whatsapp" target="_blank"><i class="fa-brands fa-whatsapp"></i> Chat Via WhatsApp</a></div>
<div class="struktur"><h3>Struktur Kepengurusan</h3><div class="struktur-box" id="strukturBox">{org}</div></div></div>
<div class="alamat"><i class="fa-solid fa-location-dot"></i> Jalan Jenderal A. Yani No. 99, Kelurahan Nagri Tengah, Kecamatan Purwakarta, Kabupaten Purwakarta, Provinsi Jawa Barat. Kode Pos 41114</div>{footer()}</section>
<section class="page galeri" id="galeri"><div class="galeri-content"><h2>Galeri Alfa Class</h2><div class="galeri-grid">{gal if galeri else '<p style="grid-column: 1 / -1;">Belum ada foto galeri.</p>'}</div></div>{footer()}</section>
</div></body></html>"""


def tulis(nama, isi):
    with open(os.path.join(OUT, nama), "w", encoding="utf-8") as f:
        f.write(isi)
    print("dibuat:", nama)


# 1. Data persis seperti seeder
tulis("home.html", halaman(MAKANAN, MINUMAN, ITEM, PENGURUS, GALERI))

# 2. Variasi "sulit": host localhost + http, foto upload /storage, makanan kosong,
#    nama produk berisi karakter HTML, pengurus banyak
variasi = halaman(
    [], [("Es <b>Teh</b> & \"Susu\"", 12500, "../storage/produk/abc.jpg"), ("Kopi", 5000, "kopi.jpg")],
    [("Galeri", "alfa.jpeg", "#galeri")], [(f"Jabatan {i}", f"Nama {i}") for i in range(1, 11)], GALERI[:2],
    base="http://localhost", foto_prefix="images/")
tulis("home-variasi.html", variasi)

# 3. Halaman bukan Smekda Mart (mis. pengaman bot / pemeliharaan)
tulis("halaman-bot.html", "<html><body><noscript>This site requires JavaScript.</noscript><script>document.cookie='x=1'</script></body></html>")
