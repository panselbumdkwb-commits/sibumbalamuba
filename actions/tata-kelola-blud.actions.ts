"use server";

import { getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import {
  simpanKepatuhanSchema,
  tambahInovasiSchema,
  updateStatusInovasiSchema,
  tambahTindakLanjutSchema,
  updateProgresTindakLanjutSchema,
} from "@/lib/validations/tata-kelola-blud.schema";

function cekWewenang(role: string | undefined) {
  return Boolean(role && ["admin_blud", "admin_bpsda", "super_admin"].includes(role));
}

// --- Kepatuhan PPK-BLUD ---
export async function simpanKepatuhan(input: unknown) {
  const profile = await getSessionProfile();
  if (!cekWewenang(profile?.role)) return { success: false as const, error: "Tidak berwenang" };

  const parsed = simpanKepatuhanSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase.from("blud_kepatuhan").upsert(
    {
      blud_id: parsed.data.bludId,
      tahun: parsed.data.tahun,
      jenis: parsed.data.jenis,
      status: parsed.data.status,
      tanggal_pemenuhan: parsed.data.tanggalPemenuhan || null,
      keterangan: parsed.data.keterangan ?? null,
    },
    { onConflict: "blud_id,tahun,jenis" }
  );

  if (error) return { success: false as const, error: "Gagal menyimpan data kepatuhan" };
  return { success: true as const };
}

// --- Inovasi Pelayanan ---
export async function tambahInovasi(input: unknown) {
  const profile = await getSessionProfile();
  if (!cekWewenang(profile?.role)) return { success: false as const, error: "Tidak berwenang" };

  const parsed = tambahInovasiSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase.from("blud_inovasi").insert({
    blud_id: parsed.data.bludId,
    tahun: parsed.data.tahun,
    nama_inovasi: parsed.data.namaInovasi,
    kategori: parsed.data.kategori,
    deskripsi: parsed.data.deskripsi ?? null,
    manfaat: parsed.data.manfaat ?? null,
  });

  if (error) return { success: false as const, error: "Gagal menambah inovasi" };
  return { success: true as const };
}

export async function updateStatusInovasi(input: unknown) {
  const profile = await getSessionProfile();
  if (!cekWewenang(profile?.role)) return { success: false as const, error: "Tidak berwenang" };

  const parsed = updateStatusInovasiSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("blud_inovasi")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.inovasiId);

  if (error) return { success: false as const, error: "Gagal memperbarui status" };
  return { success: true as const };
}

// --- Tindak Lanjut Rekomendasi Audit/Evaluasi ---
export async function tambahTindakLanjut(input: unknown) {
  const profile = await getSessionProfile();
  if (!cekWewenang(profile?.role)) return { success: false as const, error: "Tidak berwenang" };

  const parsed = tambahTindakLanjutSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase.from("blud_tindak_lanjut").insert({
    blud_id: parsed.data.bludId,
    tahun: parsed.data.tahun,
    sumber: parsed.data.sumber,
    rekomendasi: parsed.data.rekomendasi,
    rencana_tindak_lanjut: parsed.data.rencanaTindakLanjut ?? null,
    target_penyelesaian: parsed.data.targetPenyelesaian || null,
    bukti_dukung_url: parsed.data.buktiDukungUrl || null,
  });

  if (error) return { success: false as const, error: "Gagal menambah tindak lanjut" };
  return { success: true as const };
}

export async function updateProgresTindakLanjut(input: unknown) {
  const profile = await getSessionProfile();
  if (!cekWewenang(profile?.role)) return { success: false as const, error: "Tidak berwenang" };

  const parsed = updateProgresTindakLanjutSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("blud_tindak_lanjut")
    .update({
      persentase_penyelesaian: parsed.data.persentasePenyelesaian,
      status: parsed.data.status,
      bukti_dukung_url: parsed.data.buktiDukungUrl || undefined,
    })
    .eq("id", parsed.data.tindakLanjutId);

  if (error) return { success: false as const, error: "Gagal memperbarui progres" };
  return { success: true as const };
}
