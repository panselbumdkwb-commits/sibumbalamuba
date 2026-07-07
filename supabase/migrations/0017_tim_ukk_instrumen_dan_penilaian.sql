-- ============================================================
-- 0017 — MODUL TIM UKK: INSTRUMEN BERBOBOT & PENILAIAN DIGITAL
-- ============================================================
-- Menerjemahkan "Matriks Tugas dan Fungsi Tim Uji Kelayakan dan
-- Kepatutan (UKK)" — PENTING: sesuai dasar hukum yang dikutip (PP
-- 54/2017, Permendagri 37/2018), Tim UKK BUKAN pengambil keputusan
-- akhir. Hasil kerjanya adalah PENILAIAN & REKOMENDASI PROFESIONAL;
-- penetapan lulus dan pengangkatan tetap wewenang Kepala Daerah/KPM.
-- Prinsip ini ditegakkan lewat RLS: Tim UKK hanya bisa MEMBERI NILAI,
-- tidak pernah bisa mengubah status kelulusan peserta_seleksi atau
-- membuat keputusan pengangkatan di sistem ini.
--
-- BERBEDA DENGAN nilai_ukk (0001) yang menyimpan SATU skor per tahap
-- (psikotes/tes_tulis/ukk/presentasi/wawancara) — modul ini MEMECAH
-- tahap "ukk" itu sendiri jadi 10 ASPEK KOMPETENSI BERBOBOT (Integritas,
-- Kepemimpinan, dst., sesuai matriks), supaya penilaian granular dan
-- bisa direkap dengan pembobotan resmi. Ini PELENGKAP, bukan pengganti
-- nilai_ukk yang sudah dipakai di rekap 5-tahap (peserta dashboard).
-- ============================================================

create type aspek_kompetensi_ukk as enum (
  'integritas',
  'kepemimpinan',
  'kompetensi_manajerial',
  'kompetensi_bisnis',
  'kompetensi_keuangan',
  'tata_kelola',
  'regulasi',
  'komunikasi',
  'problem_solving',
  'business_plan'
);

-- ----------------------------------------------------------
-- CATATAN PERBAIKAN: peserta_seleksi (0001) ternyata belum pernah
-- ditautkan ke seleksi_proses (0015) — keduanya dibangun terpisah.
-- Supaya Tim UKK bisa tahu "peserta mana yang termasuk siklus seleksi
-- mana", link ini perlu ada. Nullable supaya peserta lama (terdaftar
-- sebelum konsep seleksi_proses ada) tidak error.
-- ----------------------------------------------------------
alter table public.peserta_seleksi
  add column if not exists seleksi_proses_id uuid references public.seleksi_proses(id);
create index if not exists idx_peserta_seleksi_proses on public.peserta_seleksi(seleksi_proses_id);


-- ----------------------------------------------------------
-- Instrumen & bobot penilaian per siklus seleksi — disusun Tim UKK
-- sendiri (independensi profesional), TRANSPARAN bagi panitia/eksekutif
-- (bisa dilihat, tidak bisa diubah — supaya jelas sebelum UKK dimulai).
-- ----------------------------------------------------------
create table public.ukk_instrumen (
  id uuid primary key default gen_random_uuid(),
  seleksi_proses_id uuid not null references public.seleksi_proses(id) on delete cascade,
  aspek aspek_kompetensi_ukk not null,
  bobot numeric not null check (bobot > 0 and bobot <= 1),
  deskripsi_indikator text,
  dibuat_oleh uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seleksi_proses_id, aspek)
);
alter table public.ukk_instrumen enable row level security;

-- ----------------------------------------------------------
-- Penilaian per asesor (tim_ukk) per peserta per aspek — independen,
-- sama seperti pola nilai_ukk (0001): banyak asesor menilai peserta yang
-- sama secara independen, TIDAK PERNAH saling melihat nilai satu sama
-- lain (RLS di bawah), hanya rekap tertimbang yang boleh diakses pihak
-- lain (lewat fungsi, bukan tabel mentah).
-- ----------------------------------------------------------
create table public.ukk_penilaian (
  id uuid primary key default gen_random_uuid(),
  peserta_id uuid not null references public.peserta_seleksi(id) on delete cascade,
  instrumen_id uuid not null references public.ukk_instrumen(id) on delete cascade,
  tim_ukk_id uuid not null references public.profiles(id),
  skor numeric not null check (skor >= 0 and skor <= 100),
  catatan text,
  is_final boolean not null default false,
  created_at timestamptz not null default now(),
  unique (peserta_id, instrumen_id, tim_ukk_id)
);
alter table public.ukk_penilaian enable row level security;

-- ============================================================
-- RLS
-- ============================================================
-- Instrumen: tim_ukk & super_admin kelola; panitia/ketua/eksekutif/
-- admin_bpsda lihat saja (transparansi metode sebelum pelaksanaan).
create policy "ukk_instrumen_read" on public.ukk_instrumen for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and p.role in ('tim_ukk','panitia_seleksi','ketua_pansel','eksekutif','admin_bpsda','super_admin')));
create policy "ukk_instrumen_write" on public.ukk_instrumen for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and p.role in ('tim_ukk','super_admin')));

-- Penilaian mentah: HANYA tim_ukk (baris miliknya sendiri) & super_admin.
-- Tidak ada satu pun policy untuk panitia_seleksi/ketua_pansel/eksekutif
-- di sini — mereka HARUS lewat get_rekap_ukk_tertimbang() di bawah.
create policy "ukk_penilaian_select_own" on public.ukk_penilaian for select
  using (
    tim_ukk_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );
create policy "ukk_penilaian_insert_own" on public.ukk_penilaian for insert
  with check (tim_ukk_id = auth.uid());
-- Nilai yang sudah is_final TIDAK bisa diubah lagi lewat aplikasi
-- (konsisten dengan prinsip nilai_ukk 0001) — hanya boleh update
-- selama belum final.
create policy "ukk_penilaian_update_own_draft" on public.ukk_penilaian for update
  using (tim_ukk_id = auth.uid() and is_final = false);

create trigger trg_touch_ukk_instrumen before update on public.ukk_instrumen
  for each row execute function public.touch_updated_at();

create trigger trg_audit_ukk_instrumen
  after insert or update on public.ukk_instrumen
  for each row execute function public.log_audit_generic();
create trigger trg_audit_ukk_penilaian
  after insert or update on public.ukk_penilaian
  for each row execute function public.log_audit_generic();

-- ============================================================
-- Fungsi rekap tertimbang — pola SAMA seperti get_rekap_nilai_ukk
-- (0008): security definer FUNCTION (bukan VIEW, supaya tidak kena
-- warning linter "security_definer_view"), dengan filter akses
-- eksplisit di WHERE clause. Mengembalikan skor akhir per peserta =
-- rata-rata (across asesor final) dari sum(skor x bobot).
-- ============================================================
create or replace function public.get_rekap_ukk_tertimbang(p_seleksi_proses_id uuid)
returns table (
  peserta_id uuid,
  jumlah_asesor_final bigint,
  total_tim_ukk_aktif bigint,
  skor_akhir numeric,
  sudah_lengkap boolean,
  peringkat bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return query
  with skor_per_asesor as (
    -- skor tertimbang SATU asesor untuk SATU peserta = sum(skor*bobot)/sum(bobot)
    select
      pn.peserta_id,
      pn.tim_ukk_id,
      sum(pn.skor * i.bobot) / nullif(sum(i.bobot), 0) as skor_tertimbang_asesor
    from public.ukk_penilaian pn
    join public.ukk_instrumen i on i.id = pn.instrumen_id
    where i.seleksi_proses_id = p_seleksi_proses_id
      and pn.is_final = true
    group by pn.peserta_id, pn.tim_ukk_id
  ),
  rekap as (
    select
      s.peserta_id,
      count(*) as jumlah_asesor_final,
      (select count(*) from public.profiles where role = 'tim_ukk' and is_active = true) as total_tim_ukk_aktif,
      round(avg(s.skor_tertimbang_asesor), 2) as skor_akhir
    from skor_per_asesor s
    group by s.peserta_id
  ),
  -- PENTING: peringkat dihitung atas SELURUH peserta dulu, SEBELUM
  -- difilter siapa yang boleh melihat baris ini — kalau urutannya
  -- dibalik (filter dulu baru rank), peserta akan selalu melihat
  -- peringkat 1 karena hanya baris miliknya sendiri yang terlihat saat
  -- window function dihitung.
  peringkat_semua as (
    select r.*, rank() over (order by r.skor_akhir desc) as peringkat
    from rekap r
  )
  select
    pr.peserta_id,
    pr.jumlah_asesor_final,
    pr.total_tim_ukk_aktif,
    pr.skor_akhir,
    (pr.jumlah_asesor_final >= pr.total_tim_ukk_aktif) as sudah_lengkap,
    pr.peringkat
  from peringkat_semua pr
  where
    -- peserta boleh lihat rekap miliknya sendiri
    exists (select 1 from public.peserta_seleksi ps where ps.id = pr.peserta_id and ps.user_id = auth.uid())
    -- panitia/ketua/eksekutif/super_admin/admin_bpsda boleh lihat semua peserta
    or exists (select 1 from public.profiles p where p.id = auth.uid()
      and p.role in ('panitia_seleksi','ketua_pansel','eksekutif','super_admin','admin_bpsda'));
end;
$$;

revoke all on function public.get_rekap_ukk_tertimbang(uuid) from public, anon;
grant execute on function public.get_rekap_ukk_tertimbang(uuid) to authenticated;
