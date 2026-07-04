-- ============================================================
-- 0007 — admin_bpsda JADI READ-ONLY, ROLE eksekutif, DAN
--          PENILAIAN UKK OLEH 5 TIM PENILAI (DIREKAP)
-- ============================================================
-- Jalankan SETELAH 0006 selesai (butuh nilai enum 'eksekutif' dan
-- 'mengundurkan_diri' sudah ter-commit).
-- ============================================================

-- ----------------------------------------------------------
-- 1. admin_bpsda: dari "kelola semua BUMD/BLUD" menjadi "lihat saja"
-- ----------------------------------------------------------
-- Halaman publik (bumd_public_read / blud_public_read) sudah mengizinkan
-- SIAPA SAJA membaca data ini, termasuk admin_bpsda — jadi tidak perlu
-- policy select tambahan. Yang diubah hanya policy WRITE: admin_bpsda
-- dikeluarkan dari daftar yang boleh insert/update/delete.
drop policy if exists "bumd_write_authorized" on public.bumd;
create policy "bumd_write_authorized"
  on public.bumd for all
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and (p.role = 'super_admin'
           or (p.role = 'admin_bumd' and p.entity_id = bumd.id))
  ));

drop policy if exists "blud_write_authorized" on public.blud;
create policy "blud_write_authorized"
  on public.blud for all
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and (p.role = 'super_admin'
           or (p.role = 'admin_blud' and p.entity_id = blud.id))
  ));

-- ----------------------------------------------------------
-- 2. Role `eksekutif`: lihat saja, lintas entitas, tanpa hak ubah
-- ----------------------------------------------------------
-- Evaluasi BUMD/BLUD: eksekutif boleh lihat SEMUA (termasuk yang belum
-- published — beda dengan publik yang cuma lihat status 'published').
create policy "evaluasi_bumd_read_eksekutif"
  on public.evaluasi_bumd for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'eksekutif'));

create policy "evaluasi_blud_read_eksekutif"
  on public.evaluasi_blud for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'eksekutif'));

-- Status pendaftaran seleksi (bukan nilai mentah) boleh dilihat eksekutif
-- untuk keperluan laporan pimpinan.
create policy "peserta_seleksi_read_eksekutif"
  on public.peserta_seleksi for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'eksekutif'));

-- Bobot indikator: boleh dilihat (konteks laporan), tidak boleh diubah.
create policy "konfigurasi_bobot_read_eksekutif"
  on public.konfigurasi_bobot for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'eksekutif'));

-- Catatan: eksekutif SENGAJA TIDAK diberi policy apa pun di nilai_ukk
-- atau berkas — pimpinan melihat ringkasan lewat view rekap di bagian 4,
-- bukan data mentah individu peserta/penilai.

-- ----------------------------------------------------------
-- 3. Penilaian UKK oleh 5 tim penilai independen per peserta per tahap
-- ----------------------------------------------------------
-- Skema lama (0001) memakai `unique (peserta_id, tahap)` — artinya HANYA
-- SATU baris nilai per peserta per tahap, seolah cuma ada satu penilai.
-- Ini tidak sesuai kebutuhan riil: 5 anggota tim_ukk masing-masing
-- menilai SEMUA peserta di SEMUA tahap secara independen, lalu hasilnya
-- direkap (dirata-rata) jadi satu nilai akhir. Perbaikan:
alter table public.nilai_ukk drop constraint if exists nilai_ukk_peserta_id_tahap_key;
alter table public.nilai_ukk
  add constraint nilai_ukk_unik_per_penilai unique (peserta_id, tahap, tim_ukk_id);

-- SELECT lama mengizinkan peserta melihat baris MENTAH miliknya sendiri
-- begitu is_final = true — ini SALAH sekarang, karena berarti peserta
-- akan melihat 5 angka terpisah dari 5 penilai, bukan satu nilai rekap.
-- Ganti: peserta, panitia_seleksi, dan eksekutif TIDAK diberi policy
-- select apa pun di tabel nilai_ukk mentah — hanya tim_ukk (baris
-- miliknya) dan super_admin/admin_bpsda (audit) yang boleh. Akses rekap
-- untuk peserta/panitia/eksekutif HANYA lewat view di bagian 4.
drop policy if exists "nilai_ukk_select_restricted" on public.nilai_ukk;
create policy "nilai_ukk_select_restricted"
  on public.nilai_ukk for select
  using (
    tim_ukk_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin_bpsda'))
  );

-- ----------------------------------------------------------
-- 4. View rekap: rata-rata nilai dari seluruh tim_ukk yang sudah
--    finalisasi, per peserta per tahap — INI yang boleh dilihat peserta,
--    panitia_seleksi, dan eksekutif (bukan nilai mentah per penilai).
-- ----------------------------------------------------------
-- PENTING: view ini SENGAJA dibuat TANPA `security_invoker`, supaya
-- query di dalamnya berjalan dengan hak akses pemilik view (bisa
-- membaca seluruh baris nilai_ukk untuk dihitung rata-ratanya),
-- BUKAN hak akses pemanggil. Kontrol akses "siapa boleh lihat rekap
-- siapa" dilakukan lewat klausa WHERE di dalam view ini sendiri
-- (bukan lewat RLS tabel dasar) — pola ini disebut "security definer
-- view" dan merupakan satu-satunya cara mengekspos hasil agregat tanpa
-- ikut mengekspos baris mentah per penilai lewat tabel dasarnya.
create view public.v_rekap_nilai_ukk as
select
  n.peserta_id,
  n.tahap,
  count(*) filter (where n.is_final) as jumlah_penilai_final,
  (select count(*) from public.profiles where role = 'tim_ukk' and is_active = true) as total_tim_ukk_aktif,
  round(avg(n.skor) filter (where n.is_final), 2) as skor_rata_rata,
  (
    count(*) filter (where n.is_final) >=
    (select count(*) from public.profiles where role = 'tim_ukk' and is_active = true)
  ) as sudah_lengkap
from public.nilai_ukk n
where
  -- peserta boleh lihat rekap miliknya sendiri
  exists (
    select 1 from public.peserta_seleksi ps
    where ps.id = n.peserta_id and ps.user_id = auth.uid()
  )
  -- panitia_seleksi, eksekutif, super_admin, admin_bpsda boleh lihat semua
  or exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and p.role in ('panitia_seleksi', 'eksekutif', 'super_admin', 'admin_bpsda')
  )
group by n.peserta_id, n.tahap;

revoke all on public.v_rekap_nilai_ukk from public, anon;
grant select on public.v_rekap_nilai_ukk to authenticated;

-- View lama (0001 §7) sudah digantikan v_rekap_nilai_ukk di atas — view
-- lama itu hanya agregat per peserta (bukan per tahap) dan tidak
-- benar-benar bisa diakses panitia_seleksi (bug lama, lihat komentar
-- aslinya). Dihapus supaya tidak ada dua sumber kebenaran yang beda.
drop view if exists public.v_status_penilaian_ukk;
