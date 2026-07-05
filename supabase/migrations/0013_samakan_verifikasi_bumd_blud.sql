-- ============================================================
-- 0013 — SAMAKAN ALUR VERIFIKASI REALISASI BUMD DENGAN BLUD
-- ============================================================
-- Sebelumnya admin_bpsda hanya bisa "terverifikasi"/"ditolak" tanpa bisa
-- menuliskan analisa/tanggapan tertulis atas laporan admin_bumd — beda
-- dengan alur BLUD (0012) yang sudah punya catatan_verifikasi & status
-- 3-tingkat. Migration ini menyamakan keduanya: admin_bpsda sekarang
-- bisa merespons/menganalisis/menjawab laporan admin_bumd secara
-- tertulis, bukan cuma klik terima/tolak.
-- ============================================================

alter table public.bumd_realisasi
  add column if not exists analisis_penyebab text,
  add column if not exists rencana_tindak_lanjut text,
  add column if not exists bukti_dukung_url text,
  add column if not exists catatan_verifikasi text;

-- Perluas nilai status_verifikasi yang valid (kolom ini text bebas sejak
-- awal, bukan enum, supaya migrasi berikutnya tidak pernah terbentur
-- masalah "unsafe use of new enum value" seperti kasus user_role dulu).
-- Nilai yang sekarang dipakai aplikasi: 'pending', 'perlu_perbaikan',
-- 'terverifikasi', 'ditolak'.
comment on column public.bumd_realisasi.status_verifikasi is
  'Nilai valid: pending | perlu_perbaikan | terverifikasi | ditolak';

-- admin_bumd sebelumnya (0011) hanya boleh revisi laporan selama status
-- 'pending'. Sekarang admin_bpsda bisa minta perbaikan ('perlu_perbaikan')
-- dan admin_bumd perlu bisa merevisi laporannya sendiri saat itu terjadi.
drop policy if exists "bumd_realisasi_update" on public.bumd_realisasi;
create policy "bumd_realisasi_update" on public.bumd_realisasi for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin_bpsda'))
    or exists (
      select 1 from public.bumd_kpi k join public.profiles p on p.id = auth.uid()
      where k.id = bumd_realisasi.bumd_kpi_id and p.role = 'admin_bumd' and p.entity_id = k.bumd_id
        and bumd_realisasi.status_verifikasi in ('pending', 'perlu_perbaikan')
    )
  );
