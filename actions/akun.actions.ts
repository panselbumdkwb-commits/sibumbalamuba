"use server";

import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buatAkunSchema,
  resetPasswordSchema,
  toggleAktifSchema,
} from "@/lib/validations/akun.schema";

/**
 * SEMUA action di file ini HANYA boleh dipanggil super_admin — dijaga
 * dua lapis: requireRole() di sini, DAN admin.ts akan throw kalau
 * SUPABASE_SERVICE_ROLE_KEY tidak diisi. Setiap aksi tercatat ke
 * audit_log secara eksplisit karena aksi ini terjadi lewat Auth Admin
 * API (bukan lewat tabel yang sudah punya trigger DB).
 */

export async function buatAkunInternal(input: unknown) {
  const profile = await requireRole(["super_admin"]);

  const parsed = buatAkunSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true, // auto-confirm — akun internal tidak perlu klik link
    user_metadata: {
      nama_lengkap: parsed.data.namaLengkap,
      username: parsed.data.username,
    },
  });

  if (createError || !created.user) {
    const msg = createError?.message ?? "Gagal membuat akun";
    return {
      success: false as const,
      error: msg.toLowerCase().includes("already registered")
        ? "Email ini sudah terdaftar."
        : msg,
    };
  }

  // Trigger trg_handle_new_user sudah membuat baris profiles default
  // (role='peserta'). Update ke role & entity yang sebenarnya di sini.
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      role: parsed.data.role,
      username: parsed.data.username,
      entity_type: parsed.data.entityType ?? null,
      entity_id: parsed.data.entityId ?? null,
    })
    .eq("id", created.user.id);

  if (updateError) {
    return { success: false as const, error: "Akun dibuat tapi gagal mengatur role. Perbarui manual di Table Editor." };
  }

  await admin.from("audit_log").insert({
    user_id: profile.id,
    aksi: "buat_akun_internal",
    tabel_terkait: "profiles",
    record_id: created.user.id,
    detail: { role: parsed.data.role, username: parsed.data.username },
  });

  return { success: true as const };
}

export async function resetPasswordAkun(input: unknown) {
  const profile = await requireRole(["super_admin"]);

  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Input tidak valid" };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(parsed.data.userId, {
    password: parsed.data.passwordBaru,
  });

  if (error) {
    return { success: false as const, error: "Gagal reset password" };
  }

  await admin.from("audit_log").insert({
    user_id: profile.id,
    aksi: "reset_password_akun",
    tabel_terkait: "profiles",
    record_id: parsed.data.userId,
    detail: null,
  });

  return { success: true as const };
}

export async function toggleAktifAkun(input: unknown) {
  const profile = await requireRole(["super_admin"]);

  const parsed = toggleAktifSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Input tidak valid" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: parsed.data.aktif })
    .eq("id", parsed.data.userId);

  if (error) {
    return { success: false as const, error: "Gagal memperbarui status akun" };
  }

  await supabase.from("audit_log").insert({
    user_id: profile.id,
    aksi: parsed.data.aktif ? "aktifkan_akun" : "nonaktifkan_akun",
    tabel_terkait: "profiles",
    record_id: parsed.data.userId,
    detail: null,
  });

  return { success: true as const };
}
