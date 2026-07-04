-- ============================================================
-- 0005 — PERBAIKAN: INFINITE RECURSION PADA RLS profiles
-- ============================================================
-- BUG: kebijakan "profiles_select_own_or_admin" dan
-- "profiles_super_admin_full" (di 0001) memeriksa apakah user adalah
-- admin dengan cara melakukan `exists (select 1 from public.profiles ...)`
-- — yaitu meng-query tabel profiles DI DALAM kebijakan RLS milik tabel
-- profiles itu sendiri. Postgres mendeteksi ini sebagai kemungkinan
-- rekursi tak berujung dan menolak query dengan error 500
-- ("infinite recursion detected in policy for relation profiles"),
-- bahkan untuk user yang hanya mencoba membaca baris miliknya sendiri.
--
-- PERBAIKAN: pindahkan pengecekan role ke fungsi `security definer`.
-- Fungsi security definer berjalan sebagai pemilik fungsi (biasanya
-- pemilik tabel), dan pemilik tabel secara default TIDAK terikat RLS
-- (relforcerowsecurity = false pada profiles), sehingga query di dalam
-- fungsi ini tidak lagi memicu evaluasi kebijakan RLS — rekursi hilang.
-- ============================================================

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.is_admin_bpsda_or_super()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('super_admin', 'admin_bpsda')
  );
$$;

revoke all on function public.is_super_admin() from public;
revoke all on function public.is_admin_bpsda_or_super() from public;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_admin_bpsda_or_super() to authenticated;

-- Ganti kebijakan lama (rekursif) dengan versi yang memakai fungsi di atas.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin_bpsda_or_super());

drop policy if exists "profiles_super_admin_full" on public.profiles;
create policy "profiles_super_admin_full"
  on public.profiles for all
  using (public.is_super_admin());

-- ----------------------------------------------------------
-- CATATAN: kebijakan di tabel LAIN (bumd, blud, evaluasi_*, dst.) yang
-- melakukan `exists (select 1 from public.profiles ...)` TIDAK bermasalah
-- — itu memeriksa tabel profiles dari kebijakan tabel BERBEDA, jadi tidak
-- rekursif. Yang berbahaya HANYA kebijakan pada profiles yang
-- mengecek profiles lagi. Migration ini sengaja tidak menyentuh
-- kebijakan tabel lain.
-- ----------------------------------------------------------
