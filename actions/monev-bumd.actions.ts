"use server";

import { requireRole, getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import {
  rkapSchema,
  kpiSchema,
  realisasiSchema,
  verifikasiRealisasiSchema,
  risikoSchema,
  updateStatusRisikoSchema,
} from "@/lib/validations/monev-bumd.schema";

// Menetapkan RKAP (target tahunan) — fungsi pengawasan BPSDA, bukan
// admin_bumd (mencegah BUMD menetapkan target sendiri yang terlalu mudah).
export async function simpanRkap(input: unknown) {
  await requireRole(["admin_bpsda", "super_admin"]);
  const parsed = rkapSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase.from("bumd_rkap").upsert(
    {
      bumd_id: parsed.data.bumdId,
      tahun: parsed.data.tahun,
      target_pendapatan: parsed.data.targetPendapatan ?? null,
      target_laba: parsed.data.targetLaba ?? null,
      target_dividen: parsed.data.targetDividen ?? null,
      target_investasi: parsed.data.targetInvestasi ?? null,
      status: "disetujui",
    },
    { onConflict: "bumd_id,tahun" }
  );

  if (error) return { success: false as const, error: "Gagal menyimpan RKAP" };
  return { success: true as const };
}

// Menambah target KPI/IKU — fungsi pengawasan BPSDA (lihat migration 0011).
export async function tambahKpi(input: unknown) {
  await requireRole(["admin_bpsda", "super_admin"]);
  const parsed = kpiSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase.from("bumd_kpi").insert({
    bumd_id: parsed.data.bumdId,
    tahun: parsed.data.tahun,
    kategori: parsed.data.kategori,
    nama_indikator: parsed.data.namaIndikator,
    target_nilai: parsed.data.targetNilai,
    satuan: parsed.data.satuan ?? null,
  });

  if (error) return { success: false as const, error: "Gagal menambah target KPI" };
  return { success: true as const };
}

// Input realisasi — fungsi admin_bumd (lapor kinerja sendiri).
export async function laporRealisasi(input: unknown) {
  const profile = await requireRole(["admin_bumd", "super_admin"]);
  const parsed = realisasiSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase.from("bumd_realisasi").upsert(
    {
      bumd_kpi_id: parsed.data.bumdKpiId,
      periode: parsed.data.periode,
      nilai_realisasi: parsed.data.nilaiRealisasi,
      catatan: parsed.data.catatan ?? null,
      analisis_penyebab: parsed.data.analisisPenyebab ?? null,
      rencana_tindak_lanjut: parsed.data.rencanaTindakLanjut ?? null,
      bukti_dukung_url: parsed.data.buktiDukungUrl || null,
      diinput_oleh: profile.id,
      status_verifikasi: "pending",
    },
    { onConflict: "bumd_kpi_id,periode" }
  );

  if (error) return { success: false as const, error: "Gagal melaporkan realisasi" };
  return { success: true as const };
}

// Verifikasi realisasi — fungsi pengawasan admin_bpsda/super_admin.
// Sekarang 3 pilihan (bukan cuma terima/tolak) + wajib bisa menuliskan
// analisa/tanggapan tertulis lewat catatan_verifikasi.
export async function verifikasiRealisasi(input: unknown) {
  const profile = await requireRole(["admin_bpsda", "super_admin"]);
  const parsed = verifikasiRealisasiSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("bumd_realisasi")
    .update({
      status_verifikasi: parsed.data.status,
      catatan_verifikasi: parsed.data.catatanVerifikasi ?? null,
      diverifikasi_oleh: profile.id,
    })
    .eq("id", parsed.data.realisasiId);

  if (error) return { success: false as const, error: "Gagal memverifikasi" };
  return { success: true as const };
}

// Risiko — dikelola admin_bumd (identifikasi) dan admin_bpsda/super_admin (pengawasan).
export async function tambahRisiko(input: unknown) {
  const profile = await getSessionProfile();
  if (!profile || !["admin_bumd", "admin_bpsda", "super_admin"].includes(profile.role)) {
    return { success: false as const, error: "Tidak berwenang" };
  }
  const parsed = risikoSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase.from("bumd_risiko").insert({
    bumd_id: parsed.data.bumdId,
    tahun: parsed.data.tahun,
    kategori: parsed.data.kategori,
    deskripsi: parsed.data.deskripsi,
    tingkat: parsed.data.tingkat,
    mitigasi: parsed.data.mitigasi ?? null,
  });

  if (error) return { success: false as const, error: "Gagal menambah risiko" };
  return { success: true as const };
}

export async function updateStatusRisiko(input: unknown) {
  const profile = await getSessionProfile();
  if (!profile || !["admin_bumd", "admin_bpsda", "super_admin"].includes(profile.role)) {
    return { success: false as const, error: "Tidak berwenang" };
  }
  const parsed = updateStatusRisikoSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("bumd_risiko")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.risikoId);

  if (error) return { success: false as const, error: "Gagal memperbarui status" };
  return { success: true as const };
}
