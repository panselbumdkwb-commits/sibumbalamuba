# SIBUMBALAMUBA

Sistem Informasi BUMD-BLUD Kota Batu — manajemen, monitoring, evaluasi, dan
seleksi Direksi/Dewan Pengawas/Komisaris. Next.js 15 + Supabase (Postgres,
Auth, RLS) + Vercel.

## Status paket ini

- ✅ `npm run build` sukses, `npm run test` sukses (16 test)
- ✅ Desain modern: hero publik & Dashboard Internal pakai foto udara
  Kota Batu sebagai latar (dibuat AI), kartu berwarna dengan ikon per
  menu, header berwarna berbeda tiap halaman supaya terasa beda saat
  berpindah "layer"
- ✅ **Dua portal login terpisah**: `/login/internal` (pegawai pemda) dan
  `/login/peserta` (peserta seleksi) — tidak bisa saling menyeberang,
  dijaga di sisi client, middleware, dan RLS
- ✅ **Login & registrasi pakai username**, bukan email (email tetap
  dikumpulkan saat registrasi peserta untuk konfirmasi akun & pemulihan
  kata sandi, tapi tidak dipakai sehari-hari untuk login)
- ✅ **Verifikasi manusia (Cloudflare Turnstile)** terpasang di form login
  dan registrasi
- ✅ **9 role dengan hak akses terpisah jelas**: `super_admin`,
  `admin_bpsda`, `admin_bumd`, `admin_blud`, `panitia_seleksi`,
  `ketua_pansel`, `tim_ukk`, `eksekutif`, `peserta` — lihat matriks di
  bagian 6
- ✅ **Kelola Akun Pengguna** langsung dari aplikasi (`super_admin` buat
  akun, reset password, aktif/nonaktifkan — tidak perlu SQL Editor lagi)
- ✅ **Surat & Dokumen** dengan pemisahan wewenang tanda tangan
  (`ketua_pansel` vs `panitia_seleksi` biasa)
- ✅ **Monev BUMD Berbasis Kinerja** — 4 halaman terintegrasi:
  Perencanaan Kinerja (RKAP + KPI/IKU), Monitoring Realisasi (lapor +
  verifikasi), Dashboard Kinerja (visual), Manajemen Risiko
- ⏳ Modul Monev **BLUD** performance-based (skema serupa BUMD, belum
  dibuat) — beri tahu saya kalau dibutuhkan juga

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
   - `supabase/migrations/0008_ganti_view_rekap_jadi_fungsi.sql`
   - `supabase/migrations/0009_add_role_ketua_pansel.sql`
     **(jalankan ini SENDIRI, terpisah dari file lain — sama seperti 0006)**
   - `supabase/migrations/0010_wewenang_tandatangan_ketua_pansel.sql`
   - `supabase/migrations/0011_monev_bumd_performance_based.sql`
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
# Ganti URL di bawah dengan nama repo GitHub Anda yang SEBENARNYA — nama
# aplikasi (SIBUMBALAMUBA) tidak harus sama dengan nama repo Git.
git remote add origin https://github.com/panselbumdkwb-commits/sibumbalamuba.git
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
| `/internal/dashboard` | 9 role internal | Menu dinamis sesuai role |
| `/internal/laporan` | eksekutif, super_admin | Ringkasan lintas entitas (lihat saja) |
| `/internal/bumd/profil` | admin_bumd (edit), admin_bpsda/eksekutif (lihat saja), super_admin | Profil BUMD |
| `/internal/blud/profil` | admin_blud (edit), admin_bpsda/eksekutif (lihat saja), super_admin | Profil BLUD |
| `/internal/bumd/perencanaan` | admin_bumd, admin_bpsda, eksekutif, super_admin | RKAP & target KPI/IKU |
| `/internal/bumd/monitoring` | admin_bumd, admin_bpsda, eksekutif, super_admin | Lapor & verifikasi realisasi |
| `/internal/bumd/dashboard-kinerja` | admin_bumd, admin_bpsda, eksekutif, super_admin | Visual target vs realisasi |
| `/internal/bumd/risiko` | admin_bumd, admin_bpsda, eksekutif, super_admin | Registrasi risiko |
| `/internal/bobot-indikator` | admin_bpsda, eksekutif, super_admin | Bobot indikator evaluasi |
| `/internal/seleksi` | panitia_seleksi, ketua_pansel, super_admin | Verifikasi berkas & batalkan pendaftaran |
| `/internal/dokumen` | panitia_seleksi, ketua_pansel, super_admin | Surat: draf/ajukan (panitia), setujui/tanda tangan (ketua) |
| `/internal/seleksi/dewas-komisaris/assisted-entry` | super_admin | Assisted-entry |
| `/internal/seleksi/penilaian-ukk` | tim_ukk, super_admin | Input nilai UKK (nilai sendiri) |
| `/internal/kelola-akun` | super_admin | Buat akun, reset password, aktif/nonaktif |
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
| `panitia_seleksi` | Kelola administrasi seleksi, verifikasi berkas, **batalkan pendaftaran** (mis. peserta mengundurkan diri), lihat rekap UKK (bukan nilai mentah), buat draf & ajukan surat | **Nilai UKK mentah per penilai** (disengaja — pemisahan tugas), assisted-entry, **menyetujui/menandatangani surat sendiri** |
| `ketua_pansel` | Sama seperti `panitia_seleksi` di atas, **plus** satu-satunya (selain super_admin) yang boleh menyetujui/menandatangani surat resmi panitia | Assisted-entry |
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

### Surat & Dokumen — pembeda `panitia_seleksi` vs `ketua_pansel`

Halaman `/internal/dokumen` mengimplementasikan alur:

```
draft (dibuat panitia) → diajukan (panitia) → disetujui/ditolak (HANYA ketua_pansel/super_admin)
```

Anggota panitia biasa **bisa** membuat draf surat dan mengajukannya, tapi
**tidak bisa** menyetujui/menandatangani surat yang dia buat sendiri —
tombol "Setujui & Tanda Tangani" hanya muncul untuk `ketua_pansel`. Ini
ditegakkan di RLS (migration `0010`, policy
`dokumen_internal_update_approver`), bukan cuma disembunyikan di
tampilan — kalau anggota panitia biasa mencoba memanggil update lewat
API langsung, database tetap menolak.

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

## 7. Kelola Akun Pengguna (Kelola Akun)

`super_admin` sekarang bisa membuat akun internal baru **langsung dari
aplikasi** (`/internal/kelola-akun`), tidak perlu lagi lewat Supabase
Dashboard + SQL Editor secara manual:

- Buat akun baru: isi nama, username, email, password awal, pilih role
  (termasuk pilih entitas BUMD/BLUD untuk role `admin_bumd`/`admin_blud`)
- Reset password akun mana pun
- Aktifkan/nonaktifkan akun

**Wajib diisi agar fitur ini berfungsi**: `SUPABASE_SERVICE_ROLE_KEY` di
environment variables (lihat `.env.example`) — ambil dari **Supabase
Dashboard > Project Settings > API > service_role key** (bukan anon key).
Variabel ini **rahasia**, jangan pernah diberi prefix `NEXT_PUBLIC_`, dan
hanya dipakai di `lib/supabase/admin.ts` yang diberi pengaman `import
"server-only"` supaya build akan gagal kalau sampai ter-bundle ke kode
browser.

Contoh akun yang bisa dibuat lewat fitur ini:

| Username (contoh) | Role | Catatan |
|---|---|---|
| `kabag_bpsda` | `admin_bpsda` | Lihat saja, lintas entitas |
| `admin_asisten` | `eksekutif` | Asisten Perekonomian dan Pembangunan |
| `admin_sekda` | `eksekutif` | Sekretaris Daerah |
| `ketua_pansel` | `ketua_pansel` | Ketua panitia seleksi — role terpisah, satu-satunya yang bisa menyetujui/menandatangani surat |
| `penilai_ukk01` … `penilai_ukk05` | `tim_ukk` | 5 akun terpisah, satu per anggota tim penilai |
| (satu per entitas) | `admin_bumd` | Perlu 1 akun untuk Perumdam Among Tirto, 1 untuk PT. Batu Wisata Resource |
| (satu per entitas) | `admin_blud` | Perlu 1 akun untuk tiap UPT Puskesmas (5 akun) |

> **Update**: `ketua_pansel` sekarang role TERSENDIRI (bukan lagi sama
> dengan `panitia_seleksi`) — lihat halaman **Surat & Dokumen**
> (`/internal/dokumen`) di bagian 6 untuk pembedanya.

## 8. Modul Monev BUMD Berbasis Kinerja

Menerjemahkan matriks data Monev BUMD (identitas, tata kelola,
perencanaan, keuangan, operasional, pelayanan, kontribusi daerah,
kepatuhan, SDM, risiko) menjadi 4 halaman kerja + reuse modul evaluasi
yang sudah ada:

| Halaman | Modul | Siapa menetapkan / mengisi |
|---|---|---|
| `/internal/bumd/perencanaan` | Perencanaan Kinerja (RKAP + KPI/IKU) | **Target** ditetapkan `admin_bpsda`/`super_admin` (fungsi pengawasan) |
| `/internal/bumd/monitoring` | Monitoring Realisasi | **Realisasi** dilapor `admin_bumd` (kinerja sendiri), **diverifikasi** `admin_bpsda` |
| `/internal/bumd/dashboard-kinerja` | Dashboard Kinerja | Visual capaian — hanya realisasi yang **sudah terverifikasi** yang tampil |
| `/internal/bumd/risiko` | Manajemen Risiko | Dicatat `admin_bumd`, diawasi `admin_bpsda`/`super_admin` |
| `/internal/laporan` (sudah ada) | Penilaian Kesehatan | Pakai ulang `evaluasi_bumd`/`konfigurasi_bobot` (0001) — skor & kategori kesehatan |

**Kenapa target dan realisasi dipisah wewenangnya?** Kalau `admin_bumd`
bisa menetapkan target KPI-nya sendiri, dia bisa menetapkan target yang
mudah dicapai untuk terlihat baik di laporan. Target adalah fungsi
**pengawasan** BPSDA; realisasi adalah **pelaporan** BUMD; verifikasi
realisasi juga BPSDA — supaya tidak ada pihak yang menilai kinerjanya
sendiri tanpa pemeriksaan independen.

**Kenapa indikator KPI/rasio keuangan tidak dibuat jadi puluhan kolom
tetap?** Dokumen sumber mencantumkan puluhan data detail (rasio
keuangan, data operasional, data pelayanan, dst.) yang dikelompokkan ke
5 perspektif IKU (keuangan, operasional, pelayanan, tata kelola,
kontribusi daerah). Daripada membuat kolom tetap untuk tiap rasio (susah
berkembang, perlu migration setiap kali ada indikator baru), dipakai
pola **indikator fleksibel** (tabel `bumd_kpi` + `bumd_realisasi`) —
BPSDA bebas menambah indikator apa pun di kategori mana pun langsung
dari halaman Perencanaan, tanpa perlu migration SQL baru.

**Catatan cakupan**: modul ini baru untuk **BUMD**. Dokumen sumber yang
Anda kirim khusus membahas matriks Monev BUMD — kalau BLUD (5 UPT
Puskesmas) butuh modul serupa, beri tahu saya struktur datanya (kalau
beda dari BUMD) supaya bisa dibuatkan migration `0012` yang sejenis.

## 9. Akun & Keamanan Login

- Setiap pemilik akun bisa mengganti password sendiri kapan saja.
- Verifikasi Turnstile wajib diselesaikan sebelum login/registrasi
  diproses (jika `NEXT_PUBLIC_TURNSTILE_SITE_KEY` diisi).
- Username unik, format 4–32 karakter (huruf/angka/underscore/titik),
  divalidasi di client (Zod-style regex) dan dikunci ulang di database
  (`constraint username_format`) — validasi ganda supaya tidak bisa
  dilewati lewat panggilan API langsung.

## 10. Dasar Regulasi

- **PP No. 54 Tahun 2017** — Badan Usaha Milik Daerah
- **Permendagri No. 37 Tahun 2018** — Pengelolaan BUMD
- **Permendagri No. 79 Tahun 2018** — Badan Layanan Umum Daerah
- **Permendagri No. 121 Tahun 2018** — Fasilitasi Penyertaan Modal Daerah
  pada BUMD (jika relevan dengan seleksi Direksi/Dewas/Komisaris)

Halaman footer publik mencantumkan rujukan ini secara ringkas untuk
transparansi ke masyarakat. Sesuaikan/lengkapi dengan Peraturan Wali
Kota Batu terbaru yang mengatur seleksi Direksi/Dewas/Komisaris BUMD
setempat.

## 11. Langkah Selanjutnya

1. Modul Monev **BLUD** performance-based (skema serupa BUMD di
   migration `0011`, tapi untuk 5 UPT Puskesmas — belum dibuat).
2. Halaman edit detail seleksi (`/internal/seleksi/[id]`) dengan riwayat
   tahapan lengkap.
3. Form pendaftaran mandiri peserta Direksi (upload berkas) yang
   memanggil `registerPesertaDireksi()` — sudah siap di
   `actions/seleksi.actions.ts`.
4. Uji integrasi RLS terhadap project Supabase staging sebelum produksi.
5. Review keamanan oleh pihak kedua (four-eyes principle) untuk modul
   assisted-entry dan penilaian UKK, mengingat sensitivitasnya.
6. Pertimbangkan role terpisah untuk "ketua panitia" vs anggota biasa
   jika ada hak akses yang perlu dibedakan (lihat catatan di bagian 6).
