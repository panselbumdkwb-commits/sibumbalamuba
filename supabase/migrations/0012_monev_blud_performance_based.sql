-- ============================================================
-- 0012 — MODUL MONEV BLUD BERBASIS KINERJA (PPK-BLUD)
-- ============================================================
-- Berbeda dari Monev BUMD (0011) yang berorientasi kinerja korporasi,
-- Monev BLUD berorientasi PELAYANAN PUBLIK + kepatuhan PPK-BLUD, sesuai
-- Permendagri 79/2018 & 77/2020. Perbedaan struktural utama dari 0011:
--
-- 1. Setiap realisasi WAJIB memuat: analisis penyebab deviasi, rencana
--    tindak lanjut, bukti dukung, dan status verifikasi 3-tingkat
--    ("belum diverifikasi" / "perlu perbaikan" / "disetujui") — bukan
--    cuma pending/terverifikasi/ditolak seperti BUMD.
-- 2. Periode pelaporan BLUD granular sampai BULANAN (bukan cuma
--    triwulan), jadi dipakai (jenis_periode, nomor_periode) alih-alih
--    enum tetap per-bulan.
-- 3. Ada modul tambahan yang tidak ada di BUMD: Inovasi Pelayanan, dan
--    Tindak Lanjut Rekomendasi (terpisah dari risiko — ini soal
--    rekomendasi audit/evaluasi OPD Pembina, bukan risiko internal).
-- 4. "OPD Pembina" pada dokumen sumber = admin_bpsda di sistem ini.
-- ============================================================

create type status_blud_enum as enum ('penuh', 'bertahap');
create type kategori_iku_blud as enum ('pelayanan', 'keuangan', 'tata_kelola', 'sdm', 'pengembangan');
create type jenis_periode_blud as enum ('bulanan', 'triwulanan', 'semester', 'tahunan');
create type status_verifikasi_blud as enum ('belum_diverifikasi', 'perlu_perbaikan', 'disetujui');
create type kategori_risiko_blud as enum ('strategis', 'pelayanan', 'sdm', 'keuangan', 'teknologi_informasi', 'hukum');
create type jenis_kepatuhan_blud as enum ('rba', 'laporan_keuangan', 'laporan_kinerja', 'opini_auditor', 'ppk_blud', 'pengadaan', 'perpajakan');
create type kategori_inovasi as enum ('digitalisasi', 'sistem_informasi', 'integrasi_layanan', 'simplifikasi_prosedur', 'lainnya');
create type status_inovasi as enum ('direncanakan', 'berjalan', 'selesai');
create type sumber_rekomendasi as enum ('audit_internal', 'audit_eksternal', 'evaluasi_bpsda', 'lainnya');

-- ----------------------------------------------------------
-- 1. PROFIL BLUD — perluasan master data (Bagian A matriks)
-- ----------------------------------------------------------
alter table public.blud
  add column if not exists opd_induk text,
  add column if not exists dasar_hukum_pembentukan text,
  add column if not exists status_blud status_blud_enum,
  add column if not exists tahun_penetapan int,
  add column if not exists alamat_kantor text,
  add column if not exists wilayah_pelayanan text;

-- Pejabat pengelola (Bagian B): Pimpinan BLUD, Pejabat Keuangan, Dewan Pengawas.
create table public.blud_pejabat_pengelola (
  id uuid primary key default gen_random_uuid(),
  blud_id uuid not null references public.blud(id) on delete cascade,
  nama text not null,
  jabatan text not null, -- 'Pimpinan BLUD', 'Pejabat Keuangan', 'Anggota Dewan Pengawas', dst
  sk_pengangkatan text,
  mulai_menjabat date,
  akhir_menjabat date,
  is_aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.blud_pejabat_pengelola enable row level security;

-- ----------------------------------------------------------
-- 2. PERENCANAAN — Renstra Bisnis & RBA (Bagian C)
-- ----------------------------------------------------------
create table public.blud_renstra_rba (
  id uuid primary key default gen_random_uuid(),
  blud_id uuid not null references public.blud(id) on delete cascade,
  tahun int not null,
  target_pendapatan numeric,
  target_belanja numeric,
  ringkasan_target_layanan text,
  file_path text,
  status status_dokumen not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (blud_id, tahun)
);
alter table public.blud_renstra_rba enable row level security;

-- Target KPI/IKU — pola fleksibel sama seperti bumd_kpi (0011), 5
-- perspektif sesuai dokumen: pelayanan, keuangan, tata_kelola, sdm, pengembangan.
create table public.blud_kpi (
  id uuid primary key default gen_random_uuid(),
  blud_id uuid not null references public.blud(id) on delete cascade,
  tahun int not null,
  kategori kategori_iku_blud not null,
  nama_indikator text not null,
  target_nilai numeric not null,
  satuan text,
  created_at timestamptz not null default now()
);
alter table public.blud_kpi enable row level security;

-- ----------------------------------------------------------
-- 3. MONITORING REALISASI — versi kaya sesuai kebutuhan pembinaan PPK-BLUD
-- ----------------------------------------------------------
create table public.blud_realisasi (
  id uuid primary key default gen_random_uuid(),
  blud_kpi_id uuid not null references public.blud_kpi(id) on delete cascade,
  jenis_periode jenis_periode_blud not null,
  nomor_periode int not null, -- 1-12 (bulanan), 1-4 (triwulanan), 1-2 (semester), 1 (tahunan)
  tahun int not null,
  nilai_realisasi numeric not null,
  analisis_penyebab text, -- wajib diisi kalau capaian jauh dari target (divalidasi di aplikasi, bukan DB)
  rencana_tindak_lanjut text,
  bukti_dukung_url text,
  status_verifikasi status_verifikasi_blud not null default 'belum_diverifikasi',
  catatan_verifikasi text, -- alasan "perlu_perbaikan" dari OPD Pembina
  diinput_oleh uuid references public.profiles(id),
  diverifikasi_oleh uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (blud_kpi_id, jenis_periode, nomor_periode, tahun)
);
alter table public.blud_realisasi enable row level security;

-- View: persentase capaian dihitung OTOMATIS (bukan disimpan manual),
-- supaya tidak pernah tidak-sinkron dengan target/realisasi aslinya.
create view public.v_blud_capaian as
select
  r.id as realisasi_id,
  r.blud_kpi_id,
  k.blud_id,
  k.tahun,
  k.kategori,
  k.nama_indikator,
  k.target_nilai,
  r.jenis_periode,
  r.nomor_periode,
  r.nilai_realisasi,
  r.status_verifikasi,
  case when k.target_nilai = 0 then null
       else round((r.nilai_realisasi / k.target_nilai) * 100, 1)
  end as persentase_capaian
from public.blud_realisasi r
join public.blud_kpi k on k.id = r.blud_kpi_id;

alter view public.v_blud_capaian set (security_invoker = true);

-- ----------------------------------------------------------
-- 6. RISIKO PELAYANAN (Bagian J)
-- ----------------------------------------------------------
create table public.blud_risiko (
  id uuid primary key default gen_random_uuid(),
  blud_id uuid not null references public.blud(id) on delete cascade,
  tahun int not null,
  kategori kategori_risiko_blud not null,
  deskripsi text not null,
  tingkat tingkat_risiko not null, -- reuse enum tingkat_risiko dari 0011
  mitigasi text,
  status status_tindak_lanjut not null default 'belum_ditangani', -- reuse enum dari 0011
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.blud_risiko enable row level security;

-- ----------------------------------------------------------
-- 7. KEPATUHAN PPK-BLUD (Bagian H)
-- ----------------------------------------------------------
create table public.blud_kepatuhan (
  id uuid primary key default gen_random_uuid(),
  blud_id uuid not null references public.blud(id) on delete cascade,
  tahun int not null,
  jenis jenis_kepatuhan_blud not null,
  status status_kepatuhan not null default 'belum_disampaikan', -- reuse enum dari 0011
  tanggal_pemenuhan date,
  keterangan text,
  created_at timestamptz not null default now(),
  unique (blud_id, tahun, jenis)
);
alter table public.blud_kepatuhan enable row level security;

-- ----------------------------------------------------------
-- 8. INOVASI PELAYANAN (Bagian I — modul yang TIDAK ADA di BUMD)
-- ----------------------------------------------------------
create table public.blud_inovasi (
  id uuid primary key default gen_random_uuid(),
  blud_id uuid not null references public.blud(id) on delete cascade,
  tahun int not null,
  nama_inovasi text not null,
  kategori kategori_inovasi not null,
  deskripsi text,
  manfaat text,
  status status_inovasi not null default 'direncanakan',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.blud_inovasi enable row level security;

-- ----------------------------------------------------------
-- 9. TINDAK LANJUT REKOMENDASI (Bagian K — beda dari risiko: ini
--    rekomendasi audit/evaluasi OPD Pembina, bukan risiko internal)
-- ----------------------------------------------------------
create table public.blud_tindak_lanjut (
  id uuid primary key default gen_random_uuid(),
  blud_id uuid not null references public.blud(id) on delete cascade,
  tahun int not null,
  sumber sumber_rekomendasi not null,
  rekomendasi text not null,
  rencana_tindak_lanjut text,
  persentase_penyelesaian int not null default 0 check (persentase_penyelesaian between 0 and 100),
  bukti_dukung_url text,
  target_penyelesaian date,
  status status_tindak_lanjut not null default 'belum_ditangani',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.blud_tindak_lanjut enable row level security;

-- ============================================================
-- RLS — pola SAMA seperti Monev BUMD (0011):
--   admin_blud   : kelola PENUH data entitasnya sendiri (realisasi,
--                  risiko, inovasi, tindak lanjut miliknya)
--   admin_bpsda  : TARGET (blud_kpi) & VERIFIKASI (blud_realisasi,
--                  approve tindak lanjut) — fungsi "OPD Pembina" dalam
--                  dokumen sumber
--   eksekutif    : lihat semua, tanpa hak ubah
--   super_admin  : semua akses
-- ============================================================

create policy "blud_pejabat_read" on public.blud_pejabat_pengelola for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role in ('super_admin','admin_bpsda','eksekutif') or (p.role = 'admin_blud' and p.entity_id = blud_pejabat_pengelola.blud_id))));
create policy "blud_pejabat_write" on public.blud_pejabat_pengelola for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role = 'super_admin' or (p.role = 'admin_blud' and p.entity_id = blud_pejabat_pengelola.blud_id))));

create policy "blud_renstra_rba_read" on public.blud_renstra_rba for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role in ('super_admin','admin_bpsda','eksekutif') or (p.role = 'admin_blud' and p.entity_id = blud_renstra_rba.blud_id))));
create policy "blud_renstra_rba_write" on public.blud_renstra_rba for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role in ('super_admin','admin_bpsda') or (p.role = 'admin_blud' and p.entity_id = blud_renstra_rba.blud_id))));

create policy "blud_kpi_read" on public.blud_kpi for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role in ('super_admin','admin_bpsda','eksekutif') or (p.role = 'admin_blud' and p.entity_id = blud_kpi.blud_id))));
create policy "blud_kpi_write" on public.blud_kpi for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin_bpsda')));

create policy "blud_realisasi_read" on public.blud_realisasi for select
  using (exists (
    select 1 from public.blud_kpi k join public.profiles p on p.id = auth.uid()
    where k.id = blud_realisasi.blud_kpi_id
      and (p.role in ('super_admin','admin_bpsda','eksekutif') or (p.role = 'admin_blud' and p.entity_id = k.blud_id))
  ));
create policy "blud_realisasi_insert" on public.blud_realisasi for insert
  with check (exists (
    select 1 from public.blud_kpi k join public.profiles p on p.id = auth.uid()
    where k.id = blud_realisasi.blud_kpi_id
      and (p.role = 'super_admin' or (p.role = 'admin_blud' and p.entity_id = k.blud_id))
  ));
-- admin_blud boleh EDIT selama belum 'disetujui' (masih bisa perbaiki
-- kalau status 'perlu_perbaikan'); OPD Pembina (admin_bpsda) selalu boleh.
create policy "blud_realisasi_update" on public.blud_realisasi for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin_bpsda'))
    or exists (
      select 1 from public.blud_kpi k join public.profiles p on p.id = auth.uid()
      where k.id = blud_realisasi.blud_kpi_id and p.role = 'admin_blud' and p.entity_id = k.blud_id
        and blud_realisasi.status_verifikasi in ('belum_diverifikasi', 'perlu_perbaikan')
    )
  );

create policy "blud_risiko_read" on public.blud_risiko for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role in ('super_admin','admin_bpsda','eksekutif') or (p.role = 'admin_blud' and p.entity_id = blud_risiko.blud_id))));
create policy "blud_risiko_write" on public.blud_risiko for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role in ('super_admin','admin_bpsda') or (p.role = 'admin_blud' and p.entity_id = blud_risiko.blud_id))));

create policy "blud_kepatuhan_read" on public.blud_kepatuhan for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role in ('super_admin','admin_bpsda','eksekutif') or (p.role = 'admin_blud' and p.entity_id = blud_kepatuhan.blud_id))));
create policy "blud_kepatuhan_write" on public.blud_kepatuhan for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role in ('super_admin','admin_bpsda') or (p.role = 'admin_blud' and p.entity_id = blud_kepatuhan.blud_id))));

create policy "blud_inovasi_read" on public.blud_inovasi for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role in ('super_admin','admin_bpsda','eksekutif') or (p.role = 'admin_blud' and p.entity_id = blud_inovasi.blud_id))));
create policy "blud_inovasi_write" on public.blud_inovasi for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role in ('super_admin','admin_bpsda') or (p.role = 'admin_blud' and p.entity_id = blud_inovasi.blud_id))));

create policy "blud_tindak_lanjut_read" on public.blud_tindak_lanjut for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role in ('super_admin','admin_bpsda','eksekutif') or (p.role = 'admin_blud' and p.entity_id = blud_tindak_lanjut.blud_id))));
create policy "blud_tindak_lanjut_write" on public.blud_tindak_lanjut for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role in ('super_admin','admin_bpsda') or (p.role = 'admin_blud' and p.entity_id = blud_tindak_lanjut.blud_id))));

-- Auto-touch updated_at
create trigger trg_touch_blud_pejabat before update on public.blud_pejabat_pengelola
  for each row execute function public.touch_updated_at();
create trigger trg_touch_blud_renstra_rba before update on public.blud_renstra_rba
  for each row execute function public.touch_updated_at();
create trigger trg_touch_blud_risiko before update on public.blud_risiko
  for each row execute function public.touch_updated_at();
create trigger trg_touch_blud_inovasi before update on public.blud_inovasi
  for each row execute function public.touch_updated_at();
create trigger trg_touch_blud_tindak_lanjut before update on public.blud_tindak_lanjut
  for each row execute function public.touch_updated_at();
