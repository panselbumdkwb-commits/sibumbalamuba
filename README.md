# SIBUMBALUMBA

Sistem Informasi BUMD-BLUD Kota Batu — manajemen, monitoring, evaluasi, dan
seleksi Direksi/Dewan Pengawas/Komisaris. Next.js 15 + Supabase (Postgres,
Auth, RLS) + Vercel.

## Status paket ini

- ✅ `npm run build` sukses, `npm run test` sukses (16 test)
- ✅ Desain modern: hero publik, kartu, palet warna khusus (navy + hijau),
  tanpa dependensi font eksternal saat build (font sistem, lebih stabil &
  cepat, tidak mengirim data ke Google Fonts)
- ✅ **Dua portal login terpisah**: `/login/internal` (pegawai pemda) dan
  `/login/peserta` (peserta seleksi) — tidak bisa saling menyeberang,
  dijaga di sisi client, middleware, dan RLS
- ✅ **Login & registrasi pakai username**, bukan email (email tetap
  dikumpulkan saat registrasi peserta untuk konfirmasi akun & pemulihan
  kata sandi, tapi tidak dipakai sehari-hari untuk login)
- ✅ **Verifikasi manusia (Cloudflare Turnstile)** terpasang di form login
  dan registrasi
- ✅ **7 role dengan hak akses terpisah jelas**: `super_admin`,
  `admin_bpsda`, `admin_bumd`, `admin_blud`, `panitia_seleksi`, `tim_ukk`,
  `peserta` — lihat matriks di bagian 6
- ⏳ Modul Monev BUMD/BLUD performance-based (form indikator, workflow
  verifikasi berjenjang) masih tahap skema, halaman frontend menyusul

## 1. Setup Supabase

1. Buat project di [supabase.com](https://supabase.com).
2. **SQL Editor**, jalankan berurutan:
   - `supabase/migrations/0001_init_schema.sql`
   - `supabase/migrations/0002_auth_trigger_and_fixes.sql`
   - `supabase/migrations/0003_username_login.sql`
   - `supabase/migrations/0004_rename_blud_upt.sql`
   - `supabase/migrations/0005_fix_profiles_rls_recursion.sql`
   - `supabase/migrations/0006_add_role_eksekutif_dan_status.sql`
     **(jalankan ini SENDIRI, terpisah dari file lain — lihat catatan di
     dalam file, ini batasan Postgres untuk enum baru)**
   - `supabase/migrations/0007_rbac_readonly_dan_ukk_multipenilai.sql`
   - `supabase/seed.sql` (opsional, data contoh)
3. **Project Settings > API** → salin `Project URL` dan `anon public key`.
4. Buat akun `super_admin` pertama lewat **Authentication > Add User**,
   lalu di SQL Editor:
   ```sql
   update public.profiles
   set role = 'super_admin', username = 'admin_kotabatu'
   where id = (select id from auth.users where email = 'admin@contoh.go.id');
   ```

### Aktifkan verifikasi "saya bukan robot" (wajib untuk produksi)

1. Buat site Turnstile gratis di [dash.cloudflare.com](https://dash.cloudflare.com)
   → Turnstile → Add Site. Widget mode: **Managed**.
2. Salin **Site Key** → isi `NEXT_PUBLIC_TURNSTILE_SITE_KEY` di `.env.local`
   / Vercel Environment Variables.
3. Salin **Secret Key** → di Supabase Dashboard: **Authentication >
   Attack Protection > Enable Captcha protection** → provider
   **Turnstile** → tempel secret key.
4. Tanpa langkah ini, aplikasi tetap berjalan (login/daftar tetap
   berfungsi) tapi tanpa lapisan verifikasi manusia — cocok untuk
   development, **tidak disarankan untuk produksi**.

## 2. Jalankan Lokal

```bash
npm install
cp .env.example .env.local   # isi kredensial Supabase + Turnstile
npm run dev
```

```bash
npm run test     # unit test (Vitest)
npm run build    # verifikasi production build + type-check
```

## 3. Deploy ke GitHub & Vercel

```bash
git init && git add . && git commit -m "Redesain modern + dual portal + username auth"
git branch -M main
git remote add origin https://github.com/panselbumdkwb-commits/sibumbalumba.git
git push -u origin main
```

Kalau repo sudah berisi kode sebelumnya, dorong ke branch baru dulu lalu
buka Pull Request, jangan langsung force-push:

```bash
git checkout -b redesain-modern
git push -u origin redesain-modern
```

Di **Vercel**: import repo → isi Environment Variables
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_TURNSTILE_SITE_KEY`) untuk Production, Preview, dan
Development → Deploy.

## 4. Struktur Rute

| Rute | Akses | Isi |
|---|---|---|
| `/` | Publik | Landing modern: transparansi BUMD/BLUD, evaluasi, info seleksi |
| `/login/internal` | Publik | Login pegawai pemda (6 role internal) |
| `/login/peserta` | Publik | Login peserta seleksi |
| `/daftar` | Publik | Registrasi akun peserta (username + email) |
| `/internal/dashboard` | 6 role internal | Menu dinamis sesuai role |
| `/internal/bumd/profil` | admin_bumd, admin_bpsda, super_admin | Kelola profil BUMD (scoped) |
| `/internal/blud/profil` | admin_blud, admin_bpsda, super_admin | Kelola profil BLUD (scoped) |
| `/internal/bobot-indikator` | admin_bpsda, super_admin | Atur bobot indikator evaluasi |
| `/internal/seleksi` | panitia_seleksi, super_admin | Verifikasi berkas administrasi |
| `/internal/seleksi/dewas-komisaris/assisted-entry` | super_admin | Assisted-entry |
| `/internal/seleksi/penilaian-ukk` | tim_ukk, super_admin | Input nilai UKK |
| `/internal/audit-log` | super_admin | Log aksi sensitif |
| `/peserta/dashboard` | peserta | Status pendaftaran, berkas, nilai final |

**Kenapa dua portal terpisah, bukan satu login universal?** Memisahkan
`/login/internal` dan `/login/peserta` mencegah kesalahan manusiawi
(peserta tidak sengaja mencoba masuk ke area internal, atau sebaliknya)
dan membuat pesan error lebih jelas ("akun ini terdaftar sebagai ...").
Di baliknya tetap satu sistem Supabase Auth — pemisahan ini murni lapisan
UX, keamanan sesungguhnya tetap dari role + RLS.

## 5. Login dengan Username — Cara Kerja

Supabase Auth secara native hanya mendukung login email+password. Untuk
username, alurnya:

1. Form login mengambil `username` yang diketik user.
2. Client memanggil RPC `get_email_by_username(username)` — fungsi
   `security definer` di Postgres yang **hanya** mengembalikan email
   terkait (kolom lain, termasuk hash password, tidak pernah ikut
   terekspos), dan sengaja tidak membedakan pesan error "username tidak
   ada" vs "salah password" (mencegah *username enumeration*).
3. Client memanggil `signInWithPassword({ email, password, options: { captchaToken } })`
   dengan email hasil resolusi.
4. Setelah berhasil, sistem mengecek `profiles.role` user cocok dengan
   portal yang dipakai (internal vs peserta) — kalau tidak cocok, sesi
   langsung di-*sign out* dan ditolak.

Lihat `supabase/migrations/0003_username_login.sql` untuk detail
implementasi database-nya.

## 6. Matriks Hak Akses (RBAC)

| Role | Lingkup | Tidak bisa |
|---|---|---|
| `super_admin` | Semua data & fungsi, satu-satunya yang bisa assisted-entry dan lihat audit log penuh | — |
| `admin_bpsda` | **Lihat saja** (read-only) semua BUMD/BLUD, evaluasi, bobot indikator, lintas entitas | Mengubah profil BUMD/BLUD, assisted-entry, verifikasi berkas seleksi, input nilai UKK |
| `admin_bumd` | Kelola profil & data BUMD miliknya sendiri saja (`entity_id`) | Data BUMD lain, data BLUD, seleksi, nilai UKK |
| `admin_blud` | Kelola profil & data BLUD miliknya sendiri saja | Data BLUD lain, data BUMD, seleksi, nilai UKK |
| `panitia_seleksi` | Kelola administrasi seleksi, verifikasi berkas, **batalkan pendaftaran** (mis. peserta mengundurkan diri), lihat rekap UKK (bukan nilai mentah) | **Nilai UKK mentah per penilai** (disengaja — pemisahan tugas), assisted-entry |
| `tim_ukk` | Input & finalisasi nilai UKK miliknya sendiri untuk **semua peserta di semua tahap** (psikotes, tes tulis, wawancara, presentasi) | Nilai UKK milik 4 anggota tim lain, data administrasi seleksi, data BUMD/BLUD |
| `eksekutif` | **Lihat saja** ringkasan lintas entitas (BUMD, BLUD, evaluasi, status seleksi) untuk pimpinan (Asisten Perekonomian dan Pembangunan, Sekda) | Mengubah data apa pun, nilai UKK mentah, berkas individual peserta |
| `peserta` | Data pendaftaran & hasil miliknya sendiri saja (nilai UKK yang tampil adalah **rata-rata dari 5 tim penilai**, bukan nilai mentah individual) | Data peserta lain, semua data internal |

Pemisahan ini ditegakkan di **tiga lapisan sekaligus** (defense in depth):

1. **RLS di Postgres** (`supabase/migrations/0001-0007`) — lapisan utama,
   tidak bisa dilewati meskipun ada bug di kode aplikasi.
2. **`requireRole()` / pengecekan role di server** (`lib/auth/rbac.ts`,
   tiap page dan server action) — lapisan kedua.
3. **`middleware.ts`** — lapisan UX, mencegah render halaman yang tidak
   relevan dan memisahkan portal internal vs peserta.

### Penilaian UKK oleh 5 tim penilai (direkap)

Sejak migration `0007`, satu peserta di satu tahap bisa dinilai oleh
**hingga 5 anggota tim_ukk secara independen** (`unique(peserta_id, tahap,
tim_ukk_id)` — bukan lagi satu nilai per tahap). Nilai mentah tiap
penilai **tidak pernah** terlihat oleh siapa pun selain penilai itu
sendiri dan `super_admin`/`admin_bpsda` (untuk audit). Yang terlihat oleh
`panitia_seleksi`, `eksekutif`, dan peserta yang bersangkutan **hanya
rata-rata (`v_rekap_nilai_ukk`)**, dan hanya setelah seluruh tim_ukk aktif
menyelesaikan penilaiannya (`sudah_lengkap = true`). Ini mencegah siapa
pun mempengaruhi penilai berdasarkan nilai individu yang sudah masuk.

## 7. Akun & Keamanan Login

- Admin bebas menentukan username/password awal saat membuat akun baru.
- Setiap pemilik akun bisa mengganti password sendiri kapan saja.
- Admin bisa reset password akun siapa pun yang lupa (lewat Supabase
  Dashboard > Authentication, atau bangun halaman admin khusus untuk ini
  sebagai langkah lanjutan).
- Verifikasi Turnstile wajib diselesaikan sebelum login/registrasi
  diproses (jika `NEXT_PUBLIC_TURNSTILE_SITE_KEY` diisi).
- Username unik, format 4–32 karakter (huruf/angka/underscore/titik),
  divalidasi di client (Zod-style regex) dan dikunci ulang di database
  (`constraint username_format`) — validasi ganda supaya tidak bisa
  dilewati lewat panggilan API langsung.

## 8. Dasar Regulasi

- **PP No. 54 Tahun 2017** — Badan Usaha Milik Daerah
- **Permendagri No. 37 Tahun 2018** — Pengelolaan BUMD
- **Permendagri No. 79 Tahun 2018** — Badan Layanan Umum Daerah
- **Permendagri No. 121 Tahun 2018** — Fasilitasi Penyertaan Modal Daerah
  pada BUMD (jika relevan dengan seleksi Direksi/Dewas/Komisaris)

Halaman footer publik mencantumkan rujukan ini secara ringkas untuk
transparansi ke masyarakat. Sesuaikan/lengkapi dengan Peraturan Wali
Kota Batu terbaru yang mengatur seleksi Direksi/Dewas/Komisaris BUMD
setempat.

## 9. Langkah Selanjutnya

1. Modul Monev BUMD/BLUD performance-based (8 tabel baru + halaman
   `/internal/monev/*`) — lihat catatan desain di dokumen tahap terkait.
2. Halaman admin untuk reset password & kelola akun (`/internal/akun`),
   khusus `super_admin`.
3. Halaman edit detail seleksi (`/internal/seleksi/[id]`) dengan riwayat
   tahapan lengkap.
4. Form pendaftaran mandiri peserta Direksi (upload berkas) yang
   memanggil `registerPesertaDireksi()` — sudah siap di
   `actions/seleksi.actions.ts`.
5. Uji integrasi RLS terhadap project Supabase staging sebelum produksi.
6. Review keamanan oleh pihak kedua (four-eyes principle) untuk modul
   assisted-entry dan penilaian UKK, mengingat sensitivitasnya.
