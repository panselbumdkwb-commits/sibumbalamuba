-- ============================================================
-- 0011 — MODUL MONEV BUMD BERBASIS KINERJA
-- ============================================================
-- Menerjemahkan "Matriks Data Monitoring dan Evaluasi BUMD Berbasis
-- Kinerja" jadi 7 modul terintegrasi:
--   1. Profil BUMD (master data)      -> perluasan tabel bumd
--   2. Perencanaan Kinerja            -> bumd_rencana_bisnis, bumd_rkap, bumd_kpi
--   3. Monitoring realisasi           -> bumd_realisasi
--   4. Dashboard Kinerja              -> dihitung dari bumd_kpi + bumd_realisasi (tidak perlu tabel baru)
--   5. Penilaian Kesehatan            -> PAKAI ULANG evaluasi_bumd/evaluasi_indikator/konfigurasi_bobot (0001)
--   6. Manajemen Risiko               -> bumd_risiko
--   7. Kepatuhan & Pelaporan          -> bumd_kepatuhan
--
-- KEPUTUSAN DESAIN: puluhan "data detail" di matriks (rasio keuangan,
-- data operasional, data pelayanan, dst.) SENGAJA tidak dibuat jadi
-- puluhan kolom tetap — itu akan sulit berkembang. Sebagai gantinya
-- dipakai pola INDIKATOR FLEKSIBEL (bumd_kpi + bumd_realisasi), persis
-- seperti pola konfigurasi_bobot yang sudah ada di 0001. Setiap baris
-- KPI punya `kategori` (keuangan/operasional/pelayanan/tata_kelola/
-- kontribusi_daerah) sesuai 5 perspektif IKU di dokumen sumber, jadi
-- BUMD/BPSDA bebas menambah indikator baru tanpa migration SQL baru.
-- ============================================================

create type kategori_iku as enum (
  'keuangan',
  'operasional',
  'pelayanan',
  'tata_kelola',
  'kontribusi_daerah'
);
create type jenis_periode_monev as enum ('triwulan_1', 'triwulan_2', 'triwulan_3', 'triwulan_4', 'semester_1', 'semester_2', 'tahunan');
create type tingkat_risiko as enum ('rendah', 'sedang', 'tinggi');
create type kategori_risiko as enum ('strategis', 'keuangan', 'operasional', 'sdm', 'hukum', 'reputasi');
create type status_tindak_lanjut as enum ('belum_ditangani', 'dalam_proses', 'selesai');
create type jenis_kepatuhan as enum ('rkap', 'laporan_triwulan', 'laporan_tahunan', 'opini_auditor', 'perizinan');
create type status_kepatuhan as enum ('tepat_waktu', 'terlambat', 'belum_disampaikan');

-- ----------------------------------------------------------
-- 1. PROFIL BUMD — perluasan master data (Bagian A & B matriks)
-- ----------------------------------------------------------
alter table public.bumd
  add column if not exists bentuk_hukum text,
  add column if not exists nomor_perda text,
  add column if not exists tahun_berdiri int,
  add column if not exists modal_dasar numeric,
  add column if not exists modal_disetor numeric,
  add column if not exists penyertaan_modal_pemda numeric,
  add column if not exists persentase_kepemilikan_daerah numeric,
  add column if not exists alamat_kantor text,
  add column if not exists website text,
  add column if not exists npwp text,
  add column if not exists nib text;

-- Data organ perusahaan (Direksi/Komisaris/Dewan Pengawas) — Bagian B.
-- Catatan: ini registri ringkas untuk kebutuhan Monev (masa jabatan,
-- KPI individu, kehadiran RUPS) — BUKAN pengganti modul seleksi yang
-- sudah ada (peserta_seleksi/nilai_ukk untuk proses REKRUTMENnya).
create table public.bumd_organ (
  id uuid primary key default gen_random_uuid(),
  bumd_id uuid not null references public.bumd(id) on delete cascade,
  nama text not null,
  jabatan text not null, -- 'Direktur Utama', 'Komisaris', 'Anggota Dewan Pengawas', dst — teks bebas, bukan enum (variasi antar BUMD)
  sk_pengangkatan text,
  mulai_menjabat date,
  akhir_menjabat date,
  pendidikan_terakhir text,
  sertifikat_kompetensi text,
  kehadiran_rups_persen numeric,
  is_aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bumd_organ enable row level security;

-- ----------------------------------------------------------
-- 2. PERENCANAAN KINERJA (Bagian C matriks)
-- ----------------------------------------------------------
create table public.bumd_rencana_bisnis (
  id uuid primary key default gen_random_uuid(),
  bumd_id uuid not null references public.bumd(id) on delete cascade,
  tahun_mulai int not null,
  tahun_selesai int not null,
  ringkasan text,
  file_path text,
  status status_dokumen not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bumd_rencana_bisnis enable row level security;

create table public.bumd_rkap (
  id uuid primary key default gen_random_uuid(),
  bumd_id uuid not null references public.bumd(id) on delete cascade,
  tahun int not null,
  target_pendapatan numeric,
  target_laba numeric,
  target_dividen numeric,
  target_investasi numeric,
  status status_dokumen not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bumd_id, tahun)
);
alter table public.bumd_rkap enable row level security;

-- KPI/IKU per BUMD per tahun — indikator fleksibel (lihat "keputusan desain" di atas).
create table public.bumd_kpi (
  id uuid primary key default gen_random_uuid(),
  bumd_id uuid not null references public.bumd(id) on delete cascade,
  tahun int not null,
  kategori kategori_iku not null,
  nama_indikator text not null,
  target_nilai numeric not null,
  satuan text, -- 'persen', 'rupiah', 'hari', 'indeks', dst.
  created_at timestamptz not null default now()
);
alter table public.bumd_kpi enable row level security;

-- ----------------------------------------------------------
-- 3. MONITORING REALISASI (input berkala terhadap target KPI)
-- ----------------------------------------------------------
create table public.bumd_realisasi (
  id uuid primary key default gen_random_uuid(),
  bumd_kpi_id uuid not null references public.bumd_kpi(id) on delete cascade,
  periode jenis_periode_monev not null,
  nilai_realisasi numeric not null,
  catatan text,
  status_verifikasi text not null default 'pending', -- 'pending' | 'terverifikasi' | 'ditolak'
  diinput_oleh uuid references public.profiles(id),
  diverifikasi_oleh uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (bumd_kpi_id, periode)
);
alter table public.bumd_realisasi enable row level security;

-- ----------------------------------------------------------
-- 6. MANAJEMEN RISIKO (Bagian L matriks)
-- ----------------------------------------------------------
create table public.bumd_risiko (
  id uuid primary key default gen_random_uuid(),
  bumd_id uuid not null references public.bumd(id) on delete cascade,
  tahun int not null,
  kategori kategori_risiko not null,
  deskripsi text not null,
  tingkat tingkat_risiko not null,
  mitigasi text,
  status status_tindak_lanjut not null default 'belum_ditangani',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bumd_risiko enable row level security;

-- ----------------------------------------------------------
-- 7. KEPATUHAN & PELAPORAN (Bagian K matriks)
-- ----------------------------------------------------------
create table public.bumd_kepatuhan (
  id uuid primary key default gen_random_uuid(),
  bumd_id uuid not null references public.bumd(id) on delete cascade,
  tahun int not null,
  jenis jenis_kepatuhan not null,
  status status_kepatuhan not null default 'belum_disampaikan',
  tanggal_pemenuhan date,
  keterangan text,
  created_at timestamptz not null default now(),
  unique (bumd_id, tahun, jenis)
);
alter table public.bumd_kepatuhan enable row level security;

-- ============================================================
-- RLS — pola konsisten dengan 0001/0007:
--   admin_bumd  : kelola PENUH data entitasnya sendiri
--   admin_bpsda : LIHAT SEMUA lintas entitas (selaras keputusan 0007
--                 admin_bpsda read-only), TAPI tetap boleh MENULIS
--                 bumd_kpi (target) & memverifikasi bumd_realisasi,
--                 karena menetapkan target dan memverifikasi realisasi
--                 adalah fungsi PENGAWASAN BPSDA, bukan fungsi
--                 "mengelola profil BUMD" yang sudah dibatasi di 0007.
--   eksekutif   : LIHAT SEMUA, tanpa kecuali, tanpa hak ubah apa pun.
--   super_admin : semua akses.
-- ============================================================

create policy "bumd_organ_read" on public.bumd_organ for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid()
      and (p.role in ('super_admin','admin_bpsda','eksekutif')
           or (p.role = 'admin_bumd' and p.entity_id = bumd_organ.bumd_id)))
  );
create policy "bumd_organ_write" on public.bumd_organ for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid()
      and (p.role = 'super_admin' or (p.role = 'admin_bumd' and p.entity_id = bumd_organ.bumd_id)))
  );

create policy "bumd_rencana_bisnis_read" on public.bumd_rencana_bisnis for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid()
      and (p.role in ('super_admin','admin_bpsda','eksekutif')
           or (p.role = 'admin_bumd' and p.entity_id = bumd_rencana_bisnis.bumd_id)))
  );
create policy "bumd_rencana_bisnis_write" on public.bumd_rencana_bisnis for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid()
      and (p.role in ('super_admin','admin_bpsda') or (p.role = 'admin_bumd' and p.entity_id = bumd_rencana_bisnis.bumd_id)))
  );

create policy "bumd_rkap_read" on public.bumd_rkap for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid()
      and (p.role in ('super_admin','admin_bpsda','eksekutif')
           or (p.role = 'admin_bumd' and p.entity_id = bumd_rkap.bumd_id)))
  );
create policy "bumd_rkap_write" on public.bumd_rkap for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid()
      and (p.role in ('super_admin','admin_bpsda') or (p.role = 'admin_bumd' and p.entity_id = bumd_rkap.bumd_id)))
  );

create policy "bumd_kpi_read" on public.bumd_kpi for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid()
      and (p.role in ('super_admin','admin_bpsda','eksekutif')
           or (p.role = 'admin_bumd' and p.entity_id = bumd_kpi.bumd_id)))
  );
-- Menetapkan TARGET adalah fungsi pengawasan BPSDA — admin_bumd TIDAK
-- boleh menulis target KPI sendiri (mencegah "mengatur target rendah
-- sendiri"), hanya admin_bpsda/super_admin.
create policy "bumd_kpi_write" on public.bumd_kpi for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin_bpsda'))
  );

create policy "bumd_realisasi_read" on public.bumd_realisasi for select
  using (
    exists (
      select 1 from public.bumd_kpi k
      join public.profiles p on p.id = auth.uid()
      where k.id = bumd_realisasi.bumd_kpi_id
        and (p.role in ('super_admin','admin_bpsda','eksekutif')
             or (p.role = 'admin_bumd' and p.entity_id = k.bumd_id))
    )
  );
-- Input realisasi adalah fungsi admin_bumd (lapor kinerja sendiri);
-- verifikasi (update status_verifikasi) fungsi admin_bpsda/super_admin.
create policy "bumd_realisasi_insert" on public.bumd_realisasi for insert
  with check (
    exists (
      select 1 from public.bumd_kpi k
      join public.profiles p on p.id = auth.uid()
      where k.id = bumd_realisasi.bumd_kpi_id
        and (p.role = 'super_admin' or (p.role = 'admin_bumd' and p.entity_id = k.bumd_id))
    )
  );
create policy "bumd_realisasi_update" on public.bumd_realisasi for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin_bpsda'))
    or exists (
      select 1 from public.bumd_kpi k join public.profiles p on p.id = auth.uid()
      where k.id = bumd_realisasi.bumd_kpi_id and p.role = 'admin_bumd' and p.entity_id = k.bumd_id
        and bumd_realisasi.status_verifikasi = 'pending' -- admin_bumd hanya boleh edit selama belum diverifikasi
    )
  );

create policy "bumd_risiko_read" on public.bumd_risiko for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid()
      and (p.role in ('super_admin','admin_bpsda','eksekutif')
           or (p.role = 'admin_bumd' and p.entity_id = bumd_risiko.bumd_id)))
  );
create policy "bumd_risiko_write" on public.bumd_risiko for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid()
      and (p.role in ('super_admin','admin_bpsda') or (p.role = 'admin_bumd' and p.entity_id = bumd_risiko.bumd_id)))
  );

create policy "bumd_kepatuhan_read" on public.bumd_kepatuhan for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid()
      and (p.role in ('super_admin','admin_bpsda','eksekutif')
           or (p.role = 'admin_bumd' and p.entity_id = bumd_kepatuhan.bumd_id)))
  );
create policy "bumd_kepatuhan_write" on public.bumd_kepatuhan for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid()
      and (p.role in ('super_admin','admin_bpsda') or (p.role = 'admin_bumd' and p.entity_id = bumd_kepatuhan.bumd_id)))
  );

-- Auto-touch updated_at, konsisten dengan pola di 0002.
create trigger trg_touch_bumd_organ before update on public.bumd_organ
  for each row execute function public.touch_updated_at();
create trigger trg_touch_bumd_rencana_bisnis before update on public.bumd_rencana_bisnis
  for each row execute function public.touch_updated_at();
create trigger trg_touch_bumd_rkap before update on public.bumd_rkap
  for each row execute function public.touch_updated_at();
create trigger trg_touch_bumd_risiko before update on public.bumd_risiko
  for each row execute function public.touch_updated_at();
