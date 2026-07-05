-- ============================================================
-- 0015 — SISTEM TAHAPAN KERJA PANITIA SELEKSI (24 TUGAS BAKU)
-- ============================================================
-- Menerjemahkan "Matriks Tugas dan Fungsi Panitia Seleksi BUMD" jadi
-- checklist kerja yang terstruktur per siklus seleksi (satu
-- `seleksi_proses` = satu proses pengisian jabatan Direksi/Dewas/
-- Komisaris tertentu), dengan 24 tugas baku otomatis ter-generate
-- sesuai matriks begitu proses baru dibuat — supaya panitia tidak
-- perlu mengetik ulang daftar tugas tiap kali, dan tidak ada tugas
-- regulasi yang terlewat.
--
-- KETERKAITAN DENGAN MODUL LAIN (sengaja, bukan duplikasi):
-- - Output dokumen tiap tugas (Jadwal Seleksi, Berita Acara, Pengumuman,
--   Laporan Akhir, dst.) dibuat lewat modul Surat & Dokumen yang sudah
--   ada (`dokumen_internal`) — supaya wewenang tanda tangan
--   ketua_pansel vs panitia_seleksi biasa (migration 0010) OTOMATIS
--   berlaku juga di sini, tidak perlu logika baru.
-- - Tahap Pendaftaran & Seleksi Administrasi memakai data yang SUDAH
--   ada di peserta_seleksi & berkas (0001) — tugas di sini hanya
--   MELACAK bahwa langkah itu sudah dikerjakan, bukan mendata ulang.
-- - Tahap UKK & Penilaian terhubung ke nilai_ukk & get_rekap_nilai_ukk
--   yang sudah ada — panitia tetap TIDAK PERNAH bisa akses nilai
--   mentah (0001/0007), hanya menandai tugas "sudah dikerjakan".
-- ============================================================

create type kelompok_tahapan_seleksi as enum (
  'persiapan',
  'pengumuman',
  'pendaftaran',
  'seleksi_administrasi',
  'ukk',
  'penilaian',
  'wawancara_akhir',
  'penetapan',
  'dokumentasi',
  'evaluasi'
);

create type status_tahapan_seleksi as enum ('belum_mulai', 'proses', 'selesai');

-- ----------------------------------------------------------
-- Satu siklus proses pengisian jabatan (mis. "Seleksi Direksi Perumdam
-- Among Tirto 2026").
-- ----------------------------------------------------------
create table public.seleksi_proses (
  id uuid primary key default gen_random_uuid(),
  jenis_seleksi jenis_seleksi not null,
  bumd_id uuid references public.bumd(id),
  jabatan_lowong text not null,
  tahun int not null,
  kelompok_berjalan kelompok_tahapan_seleksi not null default 'persiapan',
  dibuat_oleh uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.seleksi_proses enable row level security;

-- ----------------------------------------------------------
-- 24 tugas baku per siklus (di-generate otomatis, lihat trigger di bawah)
-- ----------------------------------------------------------
create table public.seleksi_tahapan (
  id uuid primary key default gen_random_uuid(),
  seleksi_proses_id uuid not null references public.seleksi_proses(id) on delete cascade,
  urutan int not null,
  kelompok kelompok_tahapan_seleksi not null,
  nama_tugas text not null,
  output_label text not null,
  dasar_regulasi text not null,
  status status_tahapan_seleksi not null default 'belum_mulai',
  dokumen_id uuid references public.dokumen_internal(id), -- tautan ke surat/output resmi (opsional)
  tanggal_selesai date,
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seleksi_proses_id, urutan)
);
alter table public.seleksi_tahapan enable row level security;

-- ----------------------------------------------------------
-- Trigger: begitu seleksi_proses baru dibuat, otomatis isi 24 tugas
-- baku persis sesuai "Matriks Tugas dan Fungsi Panitia Seleksi BUMD".
-- ----------------------------------------------------------
create or replace function public.buat_tahapan_seleksi_standar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.seleksi_tahapan
    (seleksi_proses_id, urutan, kelompok, nama_tugas, output_label, dasar_regulasi)
  values
    (new.id, 1, 'persiapan', 'Menyusun rencana kerja dan jadwal seleksi', 'Jadwal Seleksi', 'PP 54/2017, Permendagri 37/2018'),
    (new.id, 2, 'persiapan', 'Mengidentifikasi jabatan yang akan diisi', 'Daftar Jabatan Lowong', 'PP 54/2017'),
    (new.id, 3, 'persiapan', 'Menyusun persyaratan administrasi dan kompetensi', 'Persyaratan Seleksi', 'Permendagri 37/2018'),
    (new.id, 4, 'persiapan', 'Menyusun metode dan tahapan seleksi', 'Pedoman Seleksi', 'Permendagri 37/2018'),
    (new.id, 5, 'persiapan', 'Menyusun indikator penilaian setiap tahapan', 'Matriks Penilaian', 'Permendagri 37/2018'),
    (new.id, 6, 'persiapan', 'Menyusun tata tertib seleksi', 'Tata Tertib', 'SOP Internal'),
    (new.id, 7, 'persiapan', 'Menyiapkan dokumen administrasi', 'Berita Acara, Form Penilaian', 'SOP'),
    (new.id, 8, 'pengumuman', 'Menyusun naskah pengumuman', 'Pengumuman Resmi', 'Permendagri 37/2018'),
    (new.id, 9, 'pengumuman', 'Menyebarluaskan informasi seleksi', 'Publikasi', 'PP 54/2017'),
    (new.id, 10, 'pendaftaran', 'Menerima pendaftaran peserta', 'Daftar Pelamar', 'Permendagri 37/2018'),
    (new.id, 11, 'pendaftaran', 'Memverifikasi kelengkapan berkas', 'Checklist Administrasi', 'SOP'),
    (new.id, 12, 'seleksi_administrasi', 'Memeriksa persyaratan administrasi', 'Hasil Verifikasi', 'Permendagri 37/2018'),
    (new.id, 13, 'seleksi_administrasi', 'Menetapkan peserta lulus administrasi', 'Berita Acara', 'Permendagri 37/2018'),
    (new.id, 14, 'pengumuman', 'Mengumumkan hasil administrasi', 'Pengumuman', 'Permendagri 37/2018'),
    (new.id, 15, 'ukk', 'Menyiapkan pelaksanaan Uji Kelayakan dan Kepatutan (UKK)', 'Jadwal UKK', 'Permendagri 37/2018'),
    (new.id, 16, 'ukk', 'Menunjuk/berkoordinasi dengan Tim Penguji/Lembaga Profesional', 'SK Tim Penguji', 'PP 54/2017'),
    (new.id, 17, 'ukk', 'Memastikan seluruh tahapan UKK berjalan sesuai pedoman', 'Berita Acara', 'SOP'),
    (new.id, 18, 'penilaian', 'Menghimpun seluruh nilai hasil seleksi', 'Rekapitulasi Nilai', 'Permendagri 37/2018'),
    (new.id, 19, 'penilaian', 'Melakukan pemeringkatan peserta', 'Ranking Peserta', 'Permendagri 37/2018'),
    (new.id, 20, 'wawancara_akhir', 'Menyiapkan pelaksanaan wawancara Kepala Daerah/KPM', 'Jadwal Wawancara', 'PP 54/2017'),
    (new.id, 21, 'penetapan', 'Menyusun laporan hasil seleksi', 'Laporan Akhir', 'Permendagri 37/2018'),
    (new.id, 22, 'penetapan', 'Menyampaikan calon terbaik kepada Kepala Daerah/KPM', 'Rekomendasi Pansel', 'PP 54/2017'),
    (new.id, 23, 'dokumentasi', 'Menyusun seluruh arsip pelaksanaan seleksi', 'Arsip Seleksi', 'Peraturan Kearsipan'),
    (new.id, 24, 'evaluasi', 'Melakukan evaluasi proses seleksi', 'Laporan Evaluasi', 'Good Governance');
  return new;
end;
$$;

create trigger trg_buat_tahapan_seleksi_standar
  after insert on public.seleksi_proses
  for each row execute function public.buat_tahapan_seleksi_standar();

create trigger trg_touch_seleksi_proses before update on public.seleksi_proses
  for each row execute function public.touch_updated_at();
create trigger trg_touch_seleksi_tahapan before update on public.seleksi_tahapan
  for each row execute function public.touch_updated_at();

-- Catat otomatis ke audit_log setiap ada perubahan status tugas —
-- konsisten dengan pola notifikasi super_admin di migration 0014.
create trigger trg_audit_seleksi_proses
  after insert or update on public.seleksi_proses
  for each row execute function public.log_audit_generic();
create trigger trg_audit_seleksi_tahapan
  after update on public.seleksi_tahapan
  for each row execute function public.log_audit_generic();

-- ============================================================
-- RLS
-- ============================================================
-- Baca: panitia_seleksi, ketua_pansel, eksekutif (oversight), super_admin.
create policy "seleksi_proses_read" on public.seleksi_proses for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and p.role in ('panitia_seleksi','ketua_pansel','eksekutif','super_admin')));

-- Kelola (buat/ubah kelompok berjalan): panitia_seleksi & ketua_pansel
-- setara (bukan wewenang eksklusif ketua — cuma tanda tangan surat yang
-- eksklusif, sesuai migration 0010).
create policy "seleksi_proses_write" on public.seleksi_proses for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and p.role in ('panitia_seleksi','ketua_pansel','super_admin')));

create policy "seleksi_tahapan_read" on public.seleksi_tahapan for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and p.role in ('panitia_seleksi','ketua_pansel','eksekutif','super_admin')));

create policy "seleksi_tahapan_write" on public.seleksi_tahapan for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and p.role in ('panitia_seleksi','ketua_pansel','super_admin')));

-- Tidak ada policy INSERT/DELETE manual untuk seleksi_tahapan — baris
-- HANYA boleh muncul lewat trigger otomatis (24 tugas baku), supaya
-- daftar tugas selalu sesuai matriks resmi dan tidak bisa
-- ditambah/dihapus sembarangan oleh siapa pun lewat aplikasi.
