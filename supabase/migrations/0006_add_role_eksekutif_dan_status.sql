-- ============================================================
-- 0006 — TAMBAH ROLE `eksekutif` DAN STATUS `mengundurkan_diri`
-- ============================================================
-- PENTING: file ini HARUS dijalankan SENDIRI (terpisah dari migration
-- berikutnya) dan tidak boleh digabung dalam satu eksekusi SQL dengan
-- statement lain yang memakai nilai enum baru ini. Ini batasan Postgres:
-- nilai enum baru tidak bisa dipakai dalam transaksi yang sama dengan
-- transaksi yang menambahkannya. Jalankan file ini dulu, tunggu sampai
-- selesai (klik Run terpisah), baru lanjut ke 0007.
-- ============================================================

-- Role baru: pimpinan/eksekutif (mis. Asisten Perekonomian dan
-- Pembangunan, Sekretaris Daerah) — akses lihat-saja lintas entitas,
-- tanpa hak ubah data apa pun.
alter type user_role add value if not exists 'eksekutif';

-- Status baru: peserta mengundurkan diri (dibedakan dari 'ditolak' yang
-- berarti gagal verifikasi/tidak lolos oleh panitia).
alter type status_seleksi add value if not exists 'mengundurkan_diri';
