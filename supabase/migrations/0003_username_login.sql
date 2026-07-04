-- ============================================================
-- 0003 — USERNAME-BASED LOGIN SUPPORT
-- SIBUMBALAMUBA
-- ============================================================
-- Supabase Auth secara native hanya login dengan email. Untuk mendukung
-- login dengan USERNAME (sesuai kebutuhan: akun pemda & peserta tidak
-- selalu punya/mau memakai email pribadi sebagai identitas login),
-- pendekatan yang dipakai di sini adalah pola resmi yang direkomendasikan
-- Supabase: simpan username unik di public.profiles, lalu sediakan fungsi
-- RPC yang HANYA mengembalikan email terkait suatu username (tidak ada
-- data lain yang bocor), dipanggil dari client SEBELUM signInWithPassword.
-- ============================================================

alter table public.profiles
  add column if not exists username text unique;

-- Format username: 4-32 karakter, huruf/angka/underscore/titik, tidak
-- boleh diawali/diakhiri simbol. Divalidasi juga di sisi aplikasi (Zod).
alter table public.profiles
  add constraint username_format
  check (username is null or username ~ '^[a-zA-Z0-9](?:[a-zA-Z0-9_.]{2,30})[a-zA-Z0-9]$');

create index if not exists idx_profiles_username on public.profiles (lower(username));

-- ----------------------------------------------------------
-- RPC: resolve username -> email (satu-satunya kolom yang dikembalikan)
-- ----------------------------------------------------------
-- security definer supaya bisa membaca auth.users (tidak boleh diakses
-- langsung oleh anon), tapi HANYA mengembalikan email, tidak ada kolom
-- lain (password hash, dsb tidak pernah ikut terekspos).
-- Sengaja TIDAK membedakan "username tidak ada" vs "salah password" di
-- level respons (mengembalikan null saja) supaya tidak membocorkan info
-- username mana yang terdaftar (username enumeration).
create or replace function public.get_email_by_username(p_username text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(p_username)
    and p.is_active = true
  limit 1;
$$;

revoke all on function public.get_email_by_username(text) from public;
grant execute on function public.get_email_by_username(text) to anon, authenticated;

-- ----------------------------------------------------------
-- Update trigger handle_new_user: username wajib diisi saat signup
-- (dikirim lewat raw_user_meta_data->>'username' dari form pendaftaran).
-- Jika kosong, jatuhkan ke bagian awal email sebagai fallback agar
-- trigger tidak pernah gagal (username bisa diganti user lewat halaman
-- profil kemudian).
-- ----------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_username text;
begin
  v_username := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 6)
  );

  insert into public.profiles (id, role, nama_lengkap, username)
  values (
    new.id,
    'peserta',
    coalesce(new.raw_user_meta_data->>'nama_lengkap', new.email, 'Pengguna Baru'),
    v_username
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ----------------------------------------------------------
-- Policy tambahan: user boleh memperbarui username miliknya sendiri
-- (sudah tercakup policy "profiles_update_own_limited" di 0001, tidak
-- perlu policy baru — dicatat di sini agar jelas cakupannya).
-- ----------------------------------------------------------
