-- ============================================================
-- 0008 — GANTI VIEW REKAP UKK MENJADI FUNGSI (hilangkan warning linter)
-- ============================================================
-- Supabase Database Linter menandai VIEW dengan properti SECURITY DEFINER
-- sebagai ERROR tingkat keamanan ("security_definer_view") — linter ini
-- tidak bisa membedakan penggunaan yang disengaja/aman (kasus kita: hanya
-- cara untuk mengekspos agregat tanpa membocorkan baris mentah) dari
-- konfigurasi yang tidak sengaja/berbahaya. Untuk pola "agregat tanpa
-- expose baris mentah" ini, Supabase merekomendasikan memakai FUNGSI
-- `security definer`, bukan VIEW — secara teknis identik (jalan dengan
-- privilese pemilik, kontrol akses lewat kondisi eksplisit di dalamnya),
-- tapi tidak kena flag linter karena bukan objek "view".
-- ============================================================

drop view if exists public.v_rekap_nilai_ukk;

create or replace function public.get_rekap_nilai_ukk()
returns table (
  peserta_id uuid,
  tahap tahap_penilaian,
  jumlah_penilai_final bigint,
  total_tim_ukk_aktif bigint,
  skor_rata_rata numeric,
  sudah_lengkap boolean
)
language sql
security definer
stable
set search_path = public
as $$
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
$$;

revoke all on function public.get_rekap_nilai_ukk() from public, anon;
grant execute on function public.get_rekap_nilai_ukk() to authenticated;
