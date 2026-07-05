"use server";

import { requireRole, getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import {
  renstraRbaSchema,
  kpiBludSchema,
  realisasiBludSchema,
  verifikasiRealisasiBludSchema,
  risikoBludSchema,
  updateStatusRisikoBludSchema,
} from "@/lib/validations/monev-blud.schema";

// Renstra Bisnis & RBA — fungsi pengawasan admin_bpsda (OPD Pembina), sama seperti RKAP BUMD.
export async function simpanRenstraRba(input: unknown) {
  await requireRole(["admin_bpsda", "super_admin"]);
  const parsed = renstraRbaSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase.from("blud_renstra_rba").upsert(
    {
      blud_id: parsed.data.bludId,
      tahun: parsed.data.tahun,
      target_pendapatan: parsed.data.targetPendapatan ?? null,
      target_belanja: parsed.data.targetBelanja ?? null,
      ringkasan_target_layanan: parsed.data.ringkasanTargetLayanan ?? null,
      status: "disetujui",
    },
    { onConflict: "blud_id,tahun" }
  );

  if (error) return { success: false as const, error: "Gagal menyimpan Renstra/RBA" };
  return { success: true as const };
}

export async function tambahKpiBlud(input: unknown) {
  await requireRole(["admin_bpsda", "super_admin"]);
  const parsed = kpiBludSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase.from("blud_kpi").insert({
    blud_id: parsed.data.bludId,
    tahun: parsed.data.tahun,
    kategori: parsed.data.kategori,
    nama_indikator: parsed.data.namaIndikator,
    target_nilai: parsed.data.targetNilai,
    satuan: parsed.data.satuan ?? null,
  });

  if (error) return { success: false as const, error: "Gagal menambah target KPI" };
  return { success: true as const };
}

// Lapor realisasi — fungsi admin_blud, WAJIB sertakan analisis penyebab
// & rencana tindak lanjut kalau capaian jauh dari target (divalidasi di
// UI, lihat komponen form — bukan constraint keras di DB supaya tetap
// fleksibel untuk kasus capaian sesuai target).
export async function laporRealisasiBlud(input: unknown) {
  const profile = await requireRole(["admin_blud", "super_admin"]);
  const parsed = realisasiBludSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase.from("blud_realisasi").upsert(
    {
      blud_kpi_id: parsed.data.bludKpiId,
      jenis_periode: parsed.data.jenisPeriode,
      nomor_periode: parsed.data.nomorPeriode,
      tahun: parsed.data.tahun,
      nilai_realisasi: parsed.data.nilaiRealisasi,
      analisis_penyebab: parsed.data.analisisPenyebab ?? null,
      rencana_tindak_lanjut: parsed.data.rencanaTindakLanjut ?? null,
      bukti_dukung_url: parsed.data.buktiDukungUrl || null,
      diinput_oleh: profile.id,
      status_verifikasi: "belum_diverifikasi",
    },
    { onConflict: "blud_kpi_id,jenis_periode,nomor_periode,tahun" }
  );

  if (error) return { success: false as const, error: "Gagal melaporkan realisasi" };
  return { success: true as const };
}

// Verifikasi 3-tingkat oleh OPD Pembina (admin_bpsda/super_admin).
export async function verifikasiRealisasiBlud(input: unknown) {
  const profile = await requireRole(["admin_bpsda", "super_admin"]);
  const parsed = verifikasiRealisasiBludSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("blud_realisasi")
    .update({
      status_verifikasi: parsed.data.status,
      catatan_verifikasi: parsed.data.catatanVerifikasi ?? null,
      diverifikasi_oleh: profile.id,
    })
    .eq("id", parsed.data.realisasiId);

  if (error) return { success: false as const, error: "Gagal memverifikasi" };
  return { success: true as const };
}

export async function tambahRisikoBlud(input: unknown) {
  const profile = await getSessionProfile();
  if (!profile || !["admin_blud", "admin_bpsda", "super_admin"].includes(profile.role)) {
    return { success: false as const, error: "Tidak berwenang" };
  }
  const parsed = risikoBludSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase.from("blud_risiko").insert({
    blud_id: parsed.data.bludId,
    tahun: parsed.data.tahun,
    kategori: parsed.data.kategori,
    deskripsi: parsed.data.deskripsi,
    tingkat: parsed.data.tingkat,
    mitigasi: parsed.data.mitigasi ?? null,
  });

  if (error) return { success: false as const, error: "Gagal menambah risiko" };
  return { success: true as const };
}

export async function updateStatusRisikoBlud(input: unknown) {
  const profile = await getSessionProfile();
  if (!profile || !["admin_blud", "admin_bpsda", "super_admin"].includes(profile.role)) {
    return { success: false as const, error: "Tidak berwenang" };
  }
  const parsed = updateStatusRisikoBludSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("blud_risiko")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.risikoId);

  if (error) return { success: false as const, error: "Gagal memperbarui status" };
  return { success: true as const };
}
