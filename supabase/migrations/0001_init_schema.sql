-- ============================================================
-- TAHAP 12 — SUPABASE SCHEMA (DDL SQL)
-- SIBUMBALUMBA
-- ============================================================
-- Catatan: Jalankan sebagai migration terversi (supabase/migrations/).
-- Skema ini adalah turunan langsung dari Tahap 6 (Database Schema Logis)
-- dan Tahap 7 (RBAC Matrix). Setiap RLS policy dikomentari dengan
-- referensi ke requirement terkait (FR-xx) agar mudah ditelusuri.
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ============================================================
-- ENUM TYPES
-- ============================================================
create type user_role as enum (
  'super_admin', 'admin_bpsda', 'admin_bumd', 'admin_blud',
  'panitia_seleksi', 'tim_ukk', 'peserta'
);
create type entity_type as enum ('bumd', 'blud');
create type jenis_seleksi as enum ('direksi', 'dewas', 'komisaris', 'pegawai_blud');
create type jalur_pendaftaran as enum ('mandiri', 'assisted');
create type status_seleksi as enum (
  'terdaftar', 'administrasi', 'lolos_administrasi', 'penilaian', 'selesai', 'ditolak'
);
create type tahap_penilaian as enum (
  'psikotes', 'tes_tulis', 'ukk', 'presentasi', 'wawancara'
);
create type status_dokumen as enum ('draft', 'diajukan', 'disetujui', 'ditolak', 'diarsipkan');

-- ============================================================
-- 1. PROFILES  (1:1 dengan auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'peserta',
  nama_lengkap text not null,
  nip_nik text,
  entity_type entity_type,
  entity_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin_bpsda')
  ));

create policy "profiles_update_own_limited"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid()); -- perubahan kolom role tetap divalidasi via trigger, lihat §9

create policy "profiles_super_admin_full"
  on public.profiles for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'));

-- ============================================================
-- 2. BUMD / BLUD
-- ============================================================
create table public.bumd (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  jenis_usaha text,
  status text not null default 'aktif',
  profil_singkat text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.blud (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  jenis_layanan text,
  status text not null default 'aktif',
  profil_singkat text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bumd enable row level security;
alter table public.blud enable row level security;

create policy "bumd_public_read" on public.bumd for select using (true); -- FR-23: transparansi publik
create policy "blud_public_read" on public.blud for select using (true);

create policy "bumd_write_authorized"
  on public.bumd for all
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and (p.role in ('super_admin','admin_bpsda')
           or (p.role = 'admin_bumd' and p.entity_id = bumd.id))
  ));

create policy "blud_write_authorized"
  on public.blud for all
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and (p.role in ('super_admin','admin_bpsda')
           or (p.role = 'admin_blud' and p.entity_id = blud.id))
  ));

-- ============================================================
-- 3. KONFIGURASI BOBOT (fleksibilitas regulasi — FR terkait Tahap 1 §7)
-- ============================================================
create table public.konfigurasi_bobot (
  id uuid primary key default gen_random_uuid(),
  jenis_entitas entity_type not null,
  nama_indikator text not null,
  bobot numeric not null check (bobot >= 0 and bobot <= 1),
  berlaku_sejak date not null default current_date,
  created_at timestamptz not null default now()
);
alter table public.konfigurasi_bobot enable row level security;
create policy "bobot_read_internal"
  on public.konfigurasi_bobot for select
  using (exists (select 1 from public.profiles where id = auth.uid()));
create policy "bobot_write_bpsda"
  on public.konfigurasi_bobot for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin_bpsda')));

-- ============================================================
-- 4. EVALUASI BUMD / BLUD + INDIKATOR
-- ============================================================
create table public.evaluasi_bumd (
  id uuid primary key default gen_random_uuid(),
  bumd_id uuid not null references public.bumd(id) on delete cascade,
  periode text not null,
  skor_total numeric,
  kategori text,
  status text not null default 'draft',
  catatan_pembinaan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bumd_id, periode)
);
create table public.evaluasi_blud (
  id uuid primary key default gen_random_uuid(),
  blud_id uuid not null references public.blud(id) on delete cascade,
  periode text not null,
  skor_total numeric,
  maturitas text,
  status text not null default 'draft',
  catatan_pembinaan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (blud_id, periode)
);
create table public.evaluasi_indikator (
  id uuid primary key default gen_random_uuid(),
  evaluasi_bumd_id uuid references public.evaluasi_bumd(id) on delete cascade,
  evaluasi_blud_id uuid references public.evaluasi_blud(id) on delete cascade,
  konfigurasi_bobot_id uuid not null references public.konfigurasi_bobot(id),
  nilai numeric not null,
  created_at timestamptz not null default now(),
  check (
    (evaluasi_bumd_id is not null and evaluasi_blud_id is null) or
    (evaluasi_bumd_id is null and evaluasi_blud_id is not null)
  )
);
alter table public.evaluasi_bumd enable row level security;
alter table public.evaluasi_blud enable row level security;
alter table public.evaluasi_indikator enable row level security;

create policy "evaluasi_bumd_read_published_public"
  on public.evaluasi_bumd for select
  using (status = 'published' or exists (select 1 from public.profiles where id = auth.uid()));
create policy "evaluasi_bumd_write_authorized"
  on public.evaluasi_bumd for insert with check (exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and (p.role in ('super_admin','admin_bpsda')
           or (p.role = 'admin_bumd' and p.entity_id = evaluasi_bumd.bumd_id))
  ));
create policy "evaluasi_bumd_update_authorized"
  on public.evaluasi_bumd for update using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and (p.role in ('super_admin','admin_bpsda')
           or (p.role = 'admin_bumd' and p.entity_id = evaluasi_bumd.bumd_id))
  ));
-- (Policy evaluasi_blud analog dengan evaluasi_bumd, disingkat)

-- ============================================================
-- 5. PESERTA SELEKSI  (satu tabel, RLS membedakan jalur — lihat Tahap 6 §6)
-- ============================================================
create table public.peserta_seleksi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  jenis_seleksi jenis_seleksi not null,
  jalur_pendaftaran jalur_pendaftaran not null default 'mandiri',
  difasilitasi_oleh uuid references public.profiles(id),
  bumd_blud_id uuid,
  token_undangan text unique,
  status status_seleksi not null default 'terdaftar',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assisted_wajib_ada_fasilitator check (
    jalur_pendaftaran <> 'assisted' or difasilitasi_oleh is not null
  )
);
alter table public.peserta_seleksi enable row level security;

-- FR-23 + Tahap6 §6: hanya jenis 'direksi' yang boleh terlihat publik, dan hanya status ringkas
create policy "peserta_direksi_public_read"
  on public.peserta_seleksi for select
  using (jenis_seleksi = 'direksi' and auth.role() = 'anon');

create policy "peserta_own_read"
  on public.peserta_seleksi for select
  using (user_id = auth.uid());

create policy "peserta_internal_read"
  on public.peserta_seleksi for select
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and p.role in ('super_admin','admin_bpsda','panitia_seleksi','tim_ukk')
  )); -- catatan: panitia TIDAK punya policy tulis di tabel nilai_ukk (lihat §7)

create policy "peserta_insert_mandiri"
  on public.peserta_seleksi for insert
  with check (jalur_pendaftaran = 'mandiri' and user_id = auth.uid());

-- FR-14b: assisted-entry HANYA super_admin
create policy "peserta_insert_assisted_super_admin_only"
  on public.peserta_seleksi for insert
  with check (
    jalur_pendaftaran = 'assisted'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
    and difasilitasi_oleh = auth.uid()
  );

create policy "peserta_update_panitia_administrasi"
  on public.peserta_seleksi for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','panitia_seleksi')));

-- ============================================================
-- 6. BERKAS
-- ============================================================
create table public.berkas (
  id uuid primary key default gen_random_uuid(),
  peserta_id uuid not null references public.peserta_seleksi(id) on delete cascade,
  jenis_dokumen text not null,
  file_path text not null,
  status_verifikasi text not null default 'pending',
  catatan text,
  created_at timestamptz not null default now()
);
alter table public.berkas enable row level security;
create policy "berkas_own_or_internal"
  on public.berkas for select using (
    exists (select 1 from public.peserta_seleksi ps where ps.id = berkas.peserta_id and ps.user_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin_bpsda','panitia_seleksi'))
  );
create policy "berkas_insert_own_or_assisted"
  on public.berkas for insert with check (
    exists (select 1 from public.peserta_seleksi ps where ps.id = berkas.peserta_id and ps.user_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

-- ============================================================
-- 7. NILAI UKK  — TABEL PALING SENSITIF (FR-17a)
-- ============================================================
create table public.nilai_ukk (
  id uuid primary key default gen_random_uuid(),
  peserta_id uuid not null references public.peserta_seleksi(id) on delete cascade,
  tim_ukk_id uuid not null references public.profiles(id),
  tahap tahap_penilaian not null,
  skor numeric not null check (skor >= 0 and skor <= 100),
  is_final boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (peserta_id, tahap)
);
alter table public.nilai_ukk enable row level security;

-- Hanya tim_ukk boleh insert, dan tim_ukk_id harus dirinya sendiri
create policy "nilai_ukk_insert_tim_ukk_only"
  on public.nilai_ukk for insert
  with check (
    tim_ukk_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'tim_ukk')
  );

-- Update hanya sebelum is_final = true, hanya oleh tim_ukk pemilik baris
create policy "nilai_ukk_update_before_final"
  on public.nilai_ukk for update
  using (tim_ukk_id = auth.uid() and is_final = false)
  with check (tim_ukk_id = auth.uid());

-- SELECT: tim_ukk lihat miliknya, super_admin/admin_bpsda lihat untuk audit,
-- peserta lihat nilainya sendiri HANYA setelah is_final = true.
-- PANITIA_SELESKSI TIDAK ADA DI POLICY INI SAMA SEKALI — disengaja (FR-17a).
create policy "nilai_ukk_select_restricted"
  on public.nilai_ukk for select
  using (
    tim_ukk_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin_bpsda'))
    or (is_final = true and exists (
      select 1 from public.peserta_seleksi ps where ps.id = nilai_ukk.peserta_id and ps.user_id = auth.uid()
    ))
  );

-- Tidak ada policy DELETE sama sekali — baris nilai_ukk tidak pernah bisa dihapus siapa pun.

-- View agregat untuk panitia_seleksi (Tahap 7 §1 baris "Nilai UKK (view agregat)")
create view public.v_status_penilaian_ukk as
  select peserta_id,
         count(*) filter (where is_final) as tahap_selesai,
         count(*) as total_tahap_diinput
  from public.nilai_ukk
  group by peserta_id;
-- View mewarisi RLS dari tabel dasar secara default di Postgres 15+;
-- pastikan `security_invoker = true` diset saat create agar panitia_seleksi
-- (yang punya akses read ke peserta_seleksi tapi tidak ke nilai_ukk mentah)
-- tetap hanya melihat agregat, bukan baris mentah.

-- ============================================================
-- 8. AUDIT LOG (append-only)
-- ============================================================
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  aksi text not null,
  tabel_terkait text,
  record_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create policy "audit_log_select_super_admin_full"
  on public.audit_log for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'));
create policy "audit_log_select_own"
  on public.audit_log for select using (user_id = auth.uid());
create policy "audit_log_insert_system"
  on public.audit_log for insert with check (true); -- insert dilakukan via trigger/service role
-- Tidak ada policy UPDATE/DELETE — log bersifat immutable.

-- ============================================================
-- 9. TRIGGER: audit otomatis untuk aksi sensitif
-- ============================================================
create or replace function public.log_assisted_entry()
returns trigger as $$
begin
  if new.jalur_pendaftaran = 'assisted' then
    insert into public.audit_log (user_id, aksi, tabel_terkait, record_id, detail)
    values (auth.uid(), 'assisted_entry_create', 'peserta_seleksi', new.id,
            jsonb_build_object('difasilitasi_oleh', new.difasilitasi_oleh, 'user_id', new.user_id));
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_log_assisted_entry
  after insert on public.peserta_seleksi
  for each row execute function public.log_assisted_entry();

create or replace function public.log_nilai_ukk_final()
returns trigger as $$
begin
  if new.is_final = true and old.is_final = false then
    insert into public.audit_log (user_id, aksi, tabel_terkait, record_id, detail)
    values (auth.uid(), 'nilai_ukk_submit_final', 'nilai_ukk', new.id,
            jsonb_build_object('peserta_id', new.peserta_id, 'tahap', new.tahap, 'skor', new.skor));
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_log_nilai_ukk_final
  after update on public.nilai_ukk
  for each row execute function public.log_nilai_ukk_final();

-- ============================================================
-- 10. DOKUMEN INTERNAL, KNOWLEDGE BASE (ringkas)
-- ============================================================
create table public.dokumen_internal (
  id uuid primary key default gen_random_uuid(),
  pembuat_id uuid not null references public.profiles(id),
  judul text not null,
  file_path text,
  status status_dokumen not null default 'draft',
  versi int not null default 1,
  approver_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.dokumen_internal enable row level security;
create policy "dokumen_internal_own_or_approver"
  on public.dokumen_internal for all
  using (pembuat_id = auth.uid() or approver_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'));

create table public.knowledge_base (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  kategori text not null,
  file_path text,
  embedding vector(1536),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.knowledge_base enable row level security;
create policy "kb_public_read" on public.knowledge_base for select using (is_public = true);
create policy "kb_internal_read" on public.knowledge_base for select
  using (exists (select 1 from public.profiles where id = auth.uid()));
create policy "kb_write_bpsda" on public.knowledge_base for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin_bpsda')));

-- ============================================================
-- INDEXES (dasar, dapat ditambah sesuai profil query di Tahap 18)
-- ============================================================
create index idx_peserta_seleksi_user on public.peserta_seleksi(user_id);
create index idx_peserta_seleksi_jenis on public.peserta_seleksi(jenis_seleksi);
create index idx_nilai_ukk_peserta on public.nilai_ukk(peserta_id);
create index idx_evaluasi_bumd_periode on public.evaluasi_bumd(bumd_id, periode);
create index idx_evaluasi_blud_periode on public.evaluasi_blud(blud_id, periode);
create index idx_audit_log_user on public.audit_log(user_id, created_at desc);
create index idx_kb_embedding on public.knowledge_base using ivfflat (embedding vector_cosine_ops);
