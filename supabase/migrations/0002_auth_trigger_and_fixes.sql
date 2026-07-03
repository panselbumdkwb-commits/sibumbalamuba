-- ============================================================
-- 0002 — PERBAIKAN & PELENGKAP TAHAP 12
-- SIBUMBALUMBA
-- ============================================================
-- Tujuan migration ini:
-- 1. Mencegah kegagalan login akibat auth.users terisi tapi
--    public.profiles kosong (baris ini WAJIB ada agar RLS di
--    seluruh tabel bisa mengevaluasi role user yang baru login).
-- 2. Mengunci security_invoker pada view agregat nilai UKK,
--    sesuai catatan di 0001 §7 yang sebelumnya belum diterapkan.
-- 3. Menambahkan kolom updated_at auto-touch agar konsisten.
-- ============================================================

-- ----------------------------------------------------------
-- 1. AUTO-PROVISION PROFILE SAAT USER BARU DIBUAT DI auth.users
-- ----------------------------------------------------------
-- Tanpa trigger ini, setiap user baru (dibuat lewat Supabase Auth,
-- baik signup mandiri maupun dibuat admin lewat dashboard) TIDAK
-- akan punya baris di public.profiles, sehingga semua RLS policy
-- yang bergantung pada `exists (select 1 from public.profiles ...)`
-- akan selalu gagal untuk user tersebut (efeknya: login berhasil
-- di auth, tapi semua query data terlihat kosong / ditolak).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, nama_lengkap)
  values (
    new.id,
    'peserta',
    coalesce(new.raw_user_meta_data->>'nama_lengkap', new.email, 'Pengguna Baru')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------
-- 2. security_invoker PADA VIEW AGREGAT NILAI UKK
-- ----------------------------------------------------------
alter view public.v_status_penilaian_ukk set (security_invoker = true);

-- ----------------------------------------------------------
-- 3. AUTO-TOUCH updated_at
-- ----------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_profiles on public.profiles;
create trigger trg_touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_bumd on public.bumd;
create trigger trg_touch_bumd before update on public.bumd
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_blud on public.blud;
create trigger trg_touch_blud before update on public.blud
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_evaluasi_bumd on public.evaluasi_bumd;
create trigger trg_touch_evaluasi_bumd before update on public.evaluasi_bumd
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_evaluasi_blud on public.evaluasi_blud;
create trigger trg_touch_evaluasi_blud before update on public.evaluasi_blud
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_peserta_seleksi on public.peserta_seleksi;
create trigger trg_touch_peserta_seleksi before update on public.peserta_seleksi
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_dokumen_internal on public.dokumen_internal;
create trigger trg_touch_dokumen_internal before update on public.dokumen_internal
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------
-- 4. POLICY evaluasi_blud (disingkat di 0001, dilengkapi di sini)
-- ----------------------------------------------------------
create policy "evaluasi_blud_write_authorized"
  on public.evaluasi_blud for insert with check (exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and (p.role in ('super_admin','admin_bpsda')
           or (p.role = 'admin_blud' and p.entity_id = evaluasi_blud.blud_id))
  ));
create policy "evaluasi_blud_update_authorized"
  on public.evaluasi_blud for update using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and (p.role in ('super_admin','admin_bpsda')
           or (p.role = 'admin_blud' and p.entity_id = evaluasi_blud.blud_id))
  ));
create policy "evaluasi_blud_read_published_public"
  on public.evaluasi_blud for select
  using (status = 'published' or exists (select 1 from public.profiles where id = auth.uid()));

create policy "evaluasi_indikator_read"
  on public.evaluasi_indikator for select
  using (exists (select 1 from public.profiles where id = auth.uid()));
create policy "evaluasi_indikator_write"
  on public.evaluasi_indikator for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid()
      and p.role in ('super_admin','admin_bpsda','admin_bumd','admin_blud'))
  );
