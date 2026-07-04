-- ============================================================
-- 0009 — TAMBAH ROLE `ketua_pansel`
-- ============================================================
-- PENTING: jalankan file ini SENDIRI (terpisah), sama seperti 0006 —
-- batasan Postgres, nilai enum baru tidak bisa dipakai di transaksi yang
-- sama dengan yang menambahkannya. Tunggu selesai, baru jalankan 0010.
-- ============================================================

-- Ketua panitia seleksi — sama seperti panitia_seleksi biasa (verifikasi
-- berkas, kelola pendaftaran), TAPI hanya ketua_pansel (dan super_admin)
-- yang boleh menyetujui/menandatangani surat-menyurat resmi (tabel
-- dokumen_internal). Anggota panitia biasa hanya bisa membuat draf dan
-- mengajukan, tidak bisa menyetujui/menandatangani sendiri.
alter type user_role add value if not exists 'ketua_pansel';
