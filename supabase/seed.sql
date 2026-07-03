-- ============================================================
-- SEED DATA — SIBUMBALUMBA
-- ============================================================
-- Jalankan SETELAH migration 0001 dan 0002 berhasil.
-- Aman dijalankan berulang kali (pakai on conflict).
-- Data ini adalah data dasar Kota Batu: 2 BUMD + 5 BLUD Puskesmas.
-- ============================================================

insert into public.bumd (nama, jenis_usaha, status, profil_singkat) values
  ('Perumdam Among Tirto', 'Perumdam - Air Minum', 'aktif',
   'Perusahaan Umum Daerah Air Minum Kota Batu.'),
  ('PT. Batu Wisata Resource', 'Perseroda - Pariwisata', 'aktif',
   'Perseroan Daerah bidang pengelolaan aset dan destinasi wisata Kota Batu.')
on conflict do nothing;

insert into public.blud (nama, jenis_layanan, status, profil_singkat) values
  ('Puskesmas Batu', 'Pelayanan Kesehatan Dasar', 'aktif', 'BLUD Puskesmas Kecamatan Batu.'),
  ('Puskesmas Beji', 'Pelayanan Kesehatan Dasar', 'aktif', 'BLUD Puskesmas Beji.'),
  ('Puskesmas Bumiaji', 'Pelayanan Kesehatan Dasar', 'aktif', 'BLUD Puskesmas Kecamatan Bumiaji.'),
  ('Puskesmas Junrejo', 'Pelayanan Kesehatan Dasar', 'aktif', 'BLUD Puskesmas Kecamatan Junrejo.'),
  ('Puskesmas Sisir', 'Pelayanan Kesehatan Dasar', 'aktif', 'BLUD Puskesmas Sisir.')
on conflict do nothing;

-- Bobot indikator dasar (contoh — sesuaikan dengan regulasi terbaru
-- lewat halaman admin, bukan dengan mengedit seed ini di production)
insert into public.konfigurasi_bobot (jenis_entitas, nama_indikator, bobot) values
  ('bumd', 'Kinerja Keuangan', 0.40),
  ('bumd', 'Kepatuhan Tata Kelola', 0.30),
  ('bumd', 'Kontribusi PAD', 0.30),
  ('blud', 'Mutu Layanan', 0.40),
  ('blud', 'Kepatuhan Tata Kelola Keuangan BLUD', 0.30),
  ('blud', 'Kepuasan Masyarakat', 0.30)
on conflict do nothing;

-- CATATAN PENTING SOAL AKUN:
-- Akun user (super_admin, admin_bumd, dll.) TIDAK dibuat lewat seed SQL,
-- karena harus melalui Supabase Auth (auth.users) agar password ter-hash
-- dengan benar. Trigger 0002 (trg_handle_new_user) otomatis membuat baris
-- public.profiles dengan role default 'peserta' begitu user baru dibuat.
--
-- Untuk menjadikan seseorang super_admin pertama kali:
-- 1. Buat user lewat Supabase Dashboard > Authentication > Add User
--    (atau lewat halaman registrasi aplikasi).
-- 2. Jalankan SQL berikut di SQL Editor, ganti email sesuai akun admin:
--
--   update public.profiles set role = 'super_admin'
--   where id = (select id from auth.users where email = 'admin@contoh.go.id');
