-- ============================================================
-- 0004 — RAPIKAN NAMA RESMI BLUD PUSKESMAS
-- ============================================================
-- Jika supabase/seed.sql versi lama sudah pernah dijalankan di project
-- Anda (nama tanpa "UPT"), migration ini merapikannya ke penamaan resmi
-- tanpa duplikasi data. Aman dijalankan meski data belum pernah ada sama
-- sekali (tidak melakukan apa-apa).
-- ============================================================

update public.blud set nama = 'UPT Puskesmas Batu' where nama = 'Puskesmas Batu';
update public.blud set nama = 'UPT Puskesmas Beji' where nama = 'Puskesmas Beji';
update public.blud set nama = 'UPT Puskesmas Bumiaji' where nama = 'Puskesmas Bumiaji';
update public.blud set nama = 'UPT Puskesmas Junrejo' where nama = 'Puskesmas Junrejo';
update public.blud set nama = 'UPT Puskesmas Sisir' where nama = 'Puskesmas Sisir';
