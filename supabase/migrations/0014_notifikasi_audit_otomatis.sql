-- ============================================================
-- 0014 — NOTIFIKASI SUPER_ADMIN: LOG OTOMATIS SETIAP PEMBARUAN DATA
-- ============================================================
-- Sebelumnya audit_log hanya terisi kalau ada insert MANUAL di kode
-- aplikasi (assisted-entry, reset password, tanda tangan surat, dst) —
-- artinya pembaruan data Monev (lapor realisasi, catat risiko, dsb)
-- TIDAK PERNAH tercatat. Migration ini menambahkan TRIGGER OTOMATIS di
-- level database, supaya SETIAP insert/update di tabel-tabel Monev
-- tercatat tanpa bergantung pada kode aplikasi mengingat untuk log
-- manual (yang gampang lupa/human error).
-- ============================================================

create or replace function public.log_audit_generic()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record_id uuid;
begin
  v_record_id := coalesce((to_jsonb(new)->>'id')::uuid, (to_jsonb(old)->>'id')::uuid);

  insert into public.audit_log (user_id, aksi, tabel_terkait, record_id, detail)
  values (
    auth.uid(),
    lower(TG_OP) || '_' || TG_TABLE_NAME,
    TG_TABLE_NAME,
    v_record_id,
    to_jsonb(new)
  );

  return new;
end;
$$;

-- Pasang trigger di tabel-tabel data Monev yang paling sering diubah
-- oleh admin_bumd/admin_blud/admin_bpsda — sesuai kebutuhan "notifikasi
-- ke super_admin setiap ada update data oleh pengguna".
create trigger trg_audit_bumd_realisasi
  after insert or update on public.bumd_realisasi
  for each row execute function public.log_audit_generic();

create trigger trg_audit_blud_realisasi
  after insert or update on public.blud_realisasi
  for each row execute function public.log_audit_generic();

create trigger trg_audit_bumd_risiko
  after insert or update on public.bumd_risiko
  for each row execute function public.log_audit_generic();

create trigger trg_audit_blud_risiko
  after insert or update on public.blud_risiko
  for each row execute function public.log_audit_generic();

create trigger trg_audit_bumd_kpi
  after insert on public.bumd_kpi
  for each row execute function public.log_audit_generic();

create trigger trg_audit_blud_kpi
  after insert on public.blud_kpi
  for each row execute function public.log_audit_generic();

create trigger trg_audit_bumd_rkap
  after insert or update on public.bumd_rkap
  for each row execute function public.log_audit_generic();

create trigger trg_audit_blud_renstra_rba
  after insert or update on public.blud_renstra_rba
  for each row execute function public.log_audit_generic();

create trigger trg_audit_bumd_profil
  after update on public.bumd
  for each row execute function public.log_audit_generic();

create trigger trg_audit_blud_profil
  after update on public.blud
  for each row execute function public.log_audit_generic();
