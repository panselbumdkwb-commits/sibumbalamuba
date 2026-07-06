-- ============================================================
-- 0016 — SURAT SESUAI TATA NASKAH DINAS (Permendagri No. 1/2023)
-- ============================================================
-- Melengkapi dokumen_internal (0001) dengan unsur baku surat dinas
-- sesuai Permendagri No. 1 Tahun 2023 tentang Tata Naskah Dinas di
-- Lingkungan Pemerintah Daerah (mengganti Permendagri 54/2009):
-- Kop Surat, Nomor, Sifat, Lampiran, Hal (Perihal), Kepada, isi,
-- Tembusan, dan blok tanda tangan.
--
-- Nomor surat OTOMATIS dibuat saat surat diajukan (bukan saat draft
-- masih bisa diedit bebas), format:
--   {urut}/PANSEL-{JENIS}/{bulan romawi}/{tahun}
-- meniru pola umum penomoran naskah dinas pemda (nomor urut/kode
-- unit/bulan romawi/tahun).
-- ============================================================

create type jenis_naskah_dinas as enum (
  'surat_biasa',
  'surat_undangan',
  'nota_dinas',
  'berita_acara',
  'surat_keterangan',
  'surat_edaran',
  'laporan',
  'surat_pengantar'
);
create type sifat_naskah_dinas as enum ('biasa', 'penting', 'segera', 'rahasia');

alter table public.dokumen_internal
  add column if not exists nomor_surat text unique,
  add column if not exists jenis_naskah jenis_naskah_dinas not null default 'surat_biasa',
  add column if not exists sifat sifat_naskah_dinas not null default 'biasa',
  add column if not exists lampiran text default '-',
  add column if not exists kepada text,
  add column if not exists isi_surat text,
  add column if not exists tembusan text;

-- ----------------------------------------------------------
-- Fungsi nomor urut otomatis: {urut}/PANSEL-{KODE JENIS}/{romawi}/{tahun}
-- ----------------------------------------------------------
create or replace function public.bulan_ke_romawi(bulan int)
returns text
language sql
immutable
as $$
  select (array['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'])[bulan];
$$;

create or replace function public.generate_nomor_surat(p_jenis jenis_naskah_dinas)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_urut int;
  v_kode text;
  v_tahun int := extract(year from now())::int;
begin
  select count(*) + 1 into v_urut
  from public.dokumen_internal
  where nomor_surat is not null
    and extract(year from created_at) = v_tahun;

  v_kode := case p_jenis
    when 'surat_undangan' then 'UND'
    when 'nota_dinas' then 'ND'
    when 'berita_acara' then 'BA'
    when 'surat_keterangan' then 'SKET'
    when 'surat_edaran' then 'SE'
    when 'laporan' then 'LAP'
    when 'surat_pengantar' then 'SP'
    else 'SRT'
  end;

  return lpad(v_urut::text, 3, '0') || '/PANSEL-' || v_kode || '/' ||
    public.bulan_ke_romawi(extract(month from now())::int) || '/' || v_tahun;
end;
$$;

revoke all on function public.generate_nomor_surat(jenis_naskah_dinas) from public, anon;
grant execute on function public.generate_nomor_surat(jenis_naskah_dinas) to authenticated;
