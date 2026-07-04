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

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin_bpsda_or_super());

drop policy if exists "profiles_super_admin_full" on public.profiles;
create policy "profiles_super_admin_full"
  on public.profiles for all
  using (public.is_super_admin());
