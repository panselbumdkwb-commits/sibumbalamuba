-- ============================================================
-- 0010 — WEWENANG TANDA TANGAN SURAT (ketua_pansel) & PARITAS AKSES
--          DENGAN panitia_seleksi
-- ============================================================
-- Jalankan SETELAH 0009 selesai.
-- ============================================================

-- ----------------------------------------------------------
-- 1. dokumen_internal — administrasi surat-menyurat panitia seleksi
-- ----------------------------------------------------------
-- Pemisahan yang diminta: panitia_seleksi (anggota biasa) hanya boleh
-- MEMBUAT draf dan MENGAJUKAN, TIDAK BOLEH menyetujui/menandatangani
-- sendiri. Hanya ketua_pansel dan super_admin yang boleh mengubah status
-- jadi 'disetujui'/'ditolak' (yaitu bertindak sebagai approver_id).
drop policy if exists "dokumen_internal_own_or_approver" on public.dokumen_internal;

-- SELECT: pembuat boleh lihat draf miliknya; ketua_pansel/super_admin
-- boleh lihat semua surat (perlu meninjau semua yang diajukan).
create policy "dokumen_internal_select"
  on public.dokumen_internal for select
  using (
    pembuat_id = auth.uid()
    or exists (
      select 1 from public.profiles p where p.id = auth.uid()
        and p.role in ('ketua_pansel', 'super_admin')
    )
  );

-- INSERT: panitia_seleksi, ketua_pansel, super_admin boleh membuat draf
-- surat baru — TAPI harus dirinya sendiri sebagai pembuat, dan TIDAK
-- boleh langsung mengisi approver_id/status 'disetujui' saat membuat.
create policy "dokumen_internal_insert"
  on public.dokumen_internal for insert
  with check (
    pembuat_id = auth.uid()
    and status in ('draft', 'diajukan')
    and approver_id is null
    and exists (
      select 1 from public.profiles p where p.id = auth.uid()
        and p.role in ('panitia_seleksi', 'ketua_pansel', 'super_admin')
    )
  );

-- UPDATE (bagian paling penting — INI pemisah "administrasi
-- penandatanganan"):
-- (a) Pembuat boleh mengubah draf MILIKNYA SENDIRI selama masih
--     berstatus 'draft' atau menaikkan ke 'diajukan' — tidak boleh
--     mengisi approver_id atau langsung set 'disetujui' sendiri.
create policy "dokumen_internal_update_pembuat"
  on public.dokumen_internal for update
  using (pembuat_id = auth.uid())
  with check (
    pembuat_id = auth.uid()
    and status in ('draft', 'diajukan')
    and approver_id is null
  );

-- (b) HANYA ketua_pansel/super_admin yang boleh menyetujui/menolak
--     (mengisi approver_id = dirinya sendiri, mengubah status jadi
--     'disetujui'/'ditolak'/'diarsipkan').
create policy "dokumen_internal_update_approver"
  on public.dokumen_internal for update
  using (
    exists (
      select 1 from public.profiles p where p.id = auth.uid()
        and p.role in ('ketua_pansel', 'super_admin')
    )
  )
  with check (
    approver_id = auth.uid()
    and status in ('disetujui', 'ditolak', 'diarsipkan')
  );

-- ----------------------------------------------------------
-- 2. Paritas akses: ketua_pansel punya hak yang sama dengan
--    panitia_seleksi di semua tempat lain (verifikasi berkas, kelola
--    pendaftaran, lihat rekap UKK) — ketua_pansel BUKAN role terpisah
--    yang lebih sempit, dia panitia biasa + wewenang tanda tangan.
-- ----------------------------------------------------------
drop policy if exists "peserta_update_panitia_administrasi" on public.peserta_seleksi;
create policy "peserta_update_panitia_administrasi"
  on public.peserta_seleksi for update
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and p.role in ('panitia_seleksi', 'ketua_pansel', 'super_admin')
  ));

-- Kebijakan select/verify berkas & peserta_seleksi yang sudah memuat
-- 'panitia_seleksi' di migration sebelumnya (0001) perlu diperbarui juga
-- supaya ketua_pansel setara. Nama-nama policy berikut mengikuti 0001.
drop policy if exists "berkas_own_or_internal" on public.berkas;
create policy "berkas_own_or_internal"
  on public.berkas for select
  using (
    exists (
      select 1 from public.peserta_seleksi ps
      where ps.id = berkas.peserta_id and ps.user_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p where p.id = auth.uid()
        and p.role in ('panitia_seleksi', 'ketua_pansel', 'super_admin')
    )
  );

-- BUG DITEMUKAN & DIPERBAIKI: tabel berkas di 0001 TIDAK PERNAH punya
-- kebijakan UPDATE — artinya tombol "Lolos/Tolak" di halaman Kelola
-- Seleksi (memanggil verifyBerkas()) selama ini gagal diam-diam (RLS
-- menolak, 0 baris berubah, tanpa error yang jelas ke pengguna).
create policy "berkas_update_verifikasi"
  on public.berkas for update
  using (
    exists (
      select 1 from public.profiles p where p.id = auth.uid()
        and p.role in ('panitia_seleksi', 'ketua_pansel', 'super_admin')
    )
  );

-- Fungsi rekap UKK (0008): tambahkan ketua_pansel setara panitia_seleksi.
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
    exists (
      select 1 from public.peserta_seleksi ps
      where ps.id = n.peserta_id and ps.user_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p where p.id = auth.uid()
        and p.role in ('panitia_seleksi', 'ketua_pansel', 'eksekutif', 'super_admin', 'admin_bpsda')
    )
  group by n.peserta_id, n.tahap;
$$;
