"use server";

import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import {
  buatSeleksiProsesSchema,
  updateStatusTahapanSchema,
  hubungkanDokumenSchema,
  updateKelompokBerjalanSchema,
} from "@/lib/validations/seleksi-proses.schema";

// Membuat siklus proses seleksi baru — 24 tugas baku otomatis
// ter-generate lewat trigger database (trg_buat_tahapan_seleksi_standar),
// tidak perlu dibuat manual di sini.
export async function buatSeleksiProses(input: unknown) {
  const profile = await requireRole(["panitia_seleksi", "ketua_pansel", "super_admin"]);
  const parsed = buatSeleksiProsesSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seleksi_proses")
    .insert({
      jenis_seleksi: parsed.data.jenisSeleksi,
      bumd_id: parsed.data.bumdId ?? null,
      jabatan_lowong: parsed.data.jabatanLowong,
      tahun: parsed.data.tahun,
      dibuat_oleh: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) return { success: false as const, error: "Gagal membuat proses seleksi" };
  return { success: true as const, id: data.id };
}

export async function updateStatusTahapan(input: unknown) {
  await requireRole(["panitia_seleksi", "ketua_pansel", "super_admin"]);
  const parsed = updateStatusTahapanSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("seleksi_tahapan")
    .update({
      status: parsed.data.status,
      catatan: parsed.data.catatan ?? null,
      tanggal_selesai: parsed.data.status === "selesai" ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("id", parsed.data.tahapanId);

  if (error) return { success: false as const, error: "Gagal memperbarui status tugas" };
  return { success: true as const };
}

// Menautkan tugas ke dokumen resmi yang sudah dibuat lewat modul Surat &
// Dokumen (/internal/dokumen) — TIDAK membuat dokumen baru di sini,
// supaya alur pembuatan & tanda tangan surat tetap satu pintu.
export async function hubungkanDokumen(input: unknown) {
  await requireRole(["panitia_seleksi", "ketua_pansel", "super_admin"]);
  const parsed = hubungkanDokumenSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("seleksi_tahapan")
    .update({ dokumen_id: parsed.data.dokumenId })
    .eq("id", parsed.data.tahapanId);

  if (error) return { success: false as const, error: "Gagal menautkan dokumen" };
  return { success: true as const };
}

export async function updateKelompokBerjalan(input: unknown) {
  await requireRole(["panitia_seleksi", "ketua_pansel", "super_admin"]);
  const parsed = updateKelompokBerjalanSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("seleksi_proses")
    .update({ kelompok_berjalan: parsed.data.kelompok })
    .eq("id", parsed.data.seleksiProsesId);

  if (error) return { success: false as const, error: "Gagal memperbarui tahapan berjalan" };
  return { success: true as const };
}
