"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/rbac";
import {
  registerPesertaDireksiSchema,
  verifyBerkasSchema,
  assistedRegisterSchema,
  batalkanPendaftaranSchema,
} from "@/lib/validations/seleksi.schema";

/**
 * Domain: Seleksi (administrasi) — TIDAK menyentuh tabel nilai_ukk sama
 * sekali. Untuk penilaian UKK, lihat actions/nilai-ukk.actions.ts.
 */

// FR-09/FR-10: registrasi mandiri jalur terbuka (Direksi) — peserta publik
export async function registerPesertaDireksi(input: unknown) {
  const parsed = registerPesertaDireksiSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Input tidak valid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "Harus login terlebih dahulu" };
  }

  const { data, error } = await supabase
    .from("peserta_seleksi")
    .insert({
      user_id: user.id,
      jenis_seleksi: "direksi",
      jalur_pendaftaran: "mandiri",
      bumd_blud_id: parsed.data.bumdId,
      status: "terdaftar",
    })
    .select()
    .single();

  if (error) {
    return { success: false as const, error: "Gagal mendaftar" };
  }

  return { success: true as const, data };
}

// FR-16: verifikasi berkas administrasi — HANYA panitia_seleksi/super_admin
export async function verifyBerkas(input: unknown) {
  await requireRole(["panitia_seleksi", "super_admin"]);

  const parsed = verifyBerkasSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Input tidak valid" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("berkas")
    .update({
      status_verifikasi: parsed.data.status,
      catatan: parsed.data.catatan ?? null,
    })
    .eq("id", parsed.data.berkasId);

  if (error) {
    return { success: false as const, error: "Gagal memperbarui status verifikasi" };
  }

  return { success: true as const };
}

// FR-14b: assisted-entry — HANYA super_admin, tercatat via trigger DB (Tahap 12 §9)
export async function assistedRegisterPeserta(input: unknown) {
  const profile = await requireRole(["super_admin"]);

  const parsed = assistedRegisterSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Input tidak valid" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("peserta_seleksi")
    .insert({
      user_id: parsed.data.targetUserId,
      jenis_seleksi: parsed.data.jenisSeleksi,
      jalur_pendaftaran: "assisted",
      difasilitasi_oleh: profile.id,
      bumd_blud_id: parsed.data.bumdId,
      token_undangan: parsed.data.tokenUndangan,
      status: "terdaftar",
    })
    .select()
    .single();

  if (error) {
    return { success: false as const, error: "Gagal menyimpan pendaftaran assisted-entry" };
  }

  // Trigger DB (trg_log_assisted_entry) sudah otomatis mencatat ke audit_log —
  // tidak perlu insert manual di sini, menghindari duplikasi log.
  return { success: true as const, data };
}

// Pembatalan pendaftaran (mis. peserta mengundurkan diri) — HANYA
// panitia_seleksi/super_admin, sesuai RLS "peserta_update_panitia_administrasi".
// Dicatat manual ke audit_log karena tidak ada trigger DB untuk update
// status peserta_seleksi (beda dengan assisted-entry/nilai_ukk final yang
// sudah punya trigger otomatis).
export async function batalkanPendaftaran(input: unknown) {
  const profile = await requireRole(["panitia_seleksi", "super_admin"]);

  const parsed = batalkanPendaftaranSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Input tidak valid" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("peserta_seleksi")
    .update({ status: "mengundurkan_diri" })
    .eq("id", parsed.data.pesertaId);

  if (error) {
    return { success: false as const, error: "Gagal membatalkan pendaftaran" };
  }

  await supabase.from("audit_log").insert({
    user_id: profile.id,
    aksi: "batalkan_pendaftaran_seleksi",
    tabel_terkait: "peserta_seleksi",
    record_id: parsed.data.pesertaId,
    detail: parsed.data.alasan ? { alasan: parsed.data.alasan } : null,
  });

  return { success: true as const };
}
