-- ============================================================
-- 0018 — SCORING ENGINE: SAMBUNGKAN PENILAIAN KESEHATAN KE DATA
--          MONEV YANG SUNGGUHAN (menutup Gap #2 dari audit Prompt 01)
-- ============================================================
-- TEMUAN AUDIT: evaluasi_bumd/evaluasi_blud/evaluasi_indikator/
-- konfigurasi_bobot (0001) SELAMA INI TIDAK PERNAH DIISI kode apa pun —
-- hanya halaman Laporan Ringkas Pimpinan yang MEMBACA tabel ini, tidak
-- ada yang MENULIS. Skor kesehatan BUMD/BLUD yang tampil di dashboard
-- pimpinan selalu kosong.
--
-- PERBAIKAN: bukan membuat sistem ketiga (master_indikator generik ala
-- dokumen enterprise), tapi MENYAMBUNGKAN tiga hal yang sudah ada dan
-- sudah teruji: konfigurasi_bobot (sudah ada UI-nya di
-- /internal/bobot-indikator), bumd_kpi/blud_kpi (kategori 5 aspek IKU
-- dari 0011/0012), dan bumd_realisasi/blud_realisasi (data verified
-- yang sungguhan diinput admin_bumd/admin_blud). Konvensi baru:
-- `konfigurasi_bobot.nama_indikator` HARUS PERSIS SAMA dengan nilai
-- teks enum kategori (`keuangan`, `operasional`, `pelayanan`,
-- `tata_kelola`, `kontribusi_daerah` untuk BUMD; `pelayanan`,
-- `keuangan`, `tata_kelola`, `sdm`, `pengembangan` untuk BLUD), supaya
-- bisa dicocokkan otomatis oleh Scoring Engine.
--
-- Data lama di konfigurasi_bobot TIDAK DIHAPUS — baris baru ditambahkan
-- di samping baris lama yang mungkin sudah ada (memakai kategori bebas
-- sebelumnya), supaya tidak ada riwayat yang hilang. Baris lama yang
-- namanya tidak cocok kategori resmi hanya diabaikan mesin skor, tetap
-- terlihat di halaman Bobot Indikator sebagai arsip.
-- ============================================================

-- ----------------------------------------------------------
-- 1. Selaraskan bobot ke 5 kategori resmi (default rata: 20% masing2).
--    admin_bpsda tetap bisa mengubah bobot ini lewat halaman
--    /internal/bobot-indikator (perlu ditambah form edit — lihat README
--    "Langkah Selanjutnya").
-- ----------------------------------------------------------
insert into public.konfigurasi_bobot (jenis_entitas, nama_indikator, bobot) values
  ('bumd', 'keuangan', 0.25),
  ('bumd', 'operasional', 0.20),
  ('bumd', 'pelayanan', 0.20),
  ('bumd', 'tata_kelola', 0.20),
  ('bumd', 'kontribusi_daerah', 0.15),
  ('blud', 'pelayanan', 0.30),
  ('blud', 'keuangan', 0.25),
  ('blud', 'tata_kelola', 0.20),
  ('blud', 'sdm', 0.15),
  ('blud', 'pengembangan', 0.10)
on conflict do nothing;

-- ----------------------------------------------------------
-- 2. Pemetaan skor -> kategori kesehatan (AA/A/BBB/BB/B/C), sesuai
--    istilah yang diminta di dokumen enterprise. Ambang batas ini
--    ANGKA AWAL YANG WAJAR, bukan angka resmi dari regulasi tertentu —
--    admin_bpsda perlu mengonfirmasi/menyesuaikan ambang batas sesuai
--    kebijakan daerah (dicatat sebagai catatan di README).
-- ----------------------------------------------------------
create or replace function public.skor_ke_kategori_kesehatan(p_skor numeric)
returns text
language sql
immutable
as $$
  select case
    when p_skor >= 90 then 'AA'
    when p_skor >= 80 then 'A'
    when p_skor >= 70 then 'BBB'
    when p_skor >= 60 then 'BB'
    when p_skor >= 50 then 'B'
    else 'C'
  end;
$$;

-- ----------------------------------------------------------
-- 3. Fungsi hitung skor kesehatan BUMD — rata-rata tertimbang dari
--    persentase capaian (realisasi/target, dibatasi maks 100%) per
--    kategori KPI, dikali bobot dari konfigurasi_bobot. HANYA memakai
--    bumd_realisasi yang berstatus 'terverifikasi' (bukan draf).
-- ----------------------------------------------------------
create or replace function public.hitung_skor_bumd(p_bumd_id uuid, p_tahun int)
returns table (skor_total numeric, kategori text, jumlah_indikator_terhitung bigint)
language sql
stable
security invoker
as $$
  with capaian_per_kategori as (
    select
      k.kategori,
      avg(least(r.nilai_realisasi / nullif(k.target_nilai, 0) * 100, 100)) as rata_capaian
    from public.bumd_kpi k
    join public.bumd_realisasi r on r.bumd_kpi_id = k.id
    where k.bumd_id = p_bumd_id
      and k.tahun = p_tahun
      and r.status_verifikasi = 'terverifikasi'
    group by k.kategori
  ),
  tertimbang as (
    select
      c.kategori,
      c.rata_capaian,
      coalesce(b.bobot, 0) as bobot
    from capaian_per_kategori c
    left join public.konfigurasi_bobot b
      on b.jenis_entitas = 'bumd' and b.nama_indikator = c.kategori::text
  )
  select
    round(sum(rata_capaian * bobot) / nullif(sum(bobot), 0), 2) as skor_total,
    public.skor_ke_kategori_kesehatan(round(sum(rata_capaian * bobot) / nullif(sum(bobot), 0), 2)) as kategori,
    count(*) as jumlah_indikator_terhitung
  from tertimbang;
$$;

-- Fungsi setara untuk BLUD — pakai v_blud_capaian (0012) yang sudah
-- menghitung persentase capaian otomatis, hanya baris disetujui OPD
-- Pembina yang dipakai.
create or replace function public.hitung_skor_blud(p_blud_id uuid, p_tahun int)
returns table (skor_total numeric, kategori text, jumlah_indikator_terhitung bigint)
language sql
stable
security invoker
as $$
  with capaian_per_kategori as (
    select
      c.kategori,
      avg(least(c.persentase_capaian, 100)) as rata_capaian
    from public.v_blud_capaian c
    where c.blud_id = p_blud_id
      and c.tahun = p_tahun
      and c.status_verifikasi = 'disetujui'
    group by c.kategori
  ),
  tertimbang as (
    select
      c.kategori,
      c.rata_capaian,
      coalesce(b.bobot, 0) as bobot
    from capaian_per_kategori c
    left join public.konfigurasi_bobot b
      on b.jenis_entitas = 'blud' and b.nama_indikator = c.kategori::text
  )
  select
    round(sum(rata_capaian * bobot) / nullif(sum(bobot), 0), 2) as skor_total,
    public.skor_ke_kategori_kesehatan(round(sum(rata_capaian * bobot) / nullif(sum(bobot), 0), 2)) as kategori,
    count(*) as jumlah_indikator_terhitung
  from tertimbang;
$$;

-- Catatan: kedua fungsi di atas `security invoker` (BUKAN definer) —
-- sengaja, supaya tetap tunduk RLS bumd_kpi/bumd_realisasi/
-- v_blud_capaian milik pemanggil. Server action yang memanggil ini
-- (lihat actions/scoring-engine.actions.ts) berjalan sebagai
-- admin_bpsda/super_admin yang memang berwenang baca semua data Monev.
