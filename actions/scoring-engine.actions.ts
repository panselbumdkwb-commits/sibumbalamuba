"use server";

import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const hitungSkorSchema = z.object({
  entityId: z.string().uuid(),
  tahun: z.coerce.number().int().min(2020).max(2100),
});

// Menghitung skor kesehatan BUMD dari data Monev yang SUNGGUHAN
// (bumd_kpi + bumd_realisasi terverifikasi, ditimbang konfigurasi_bobot),
// lalu menyimpan ke evaluasi_bumd — tabel ini sebelumnya SELALU KOSONG
// karena tidak ada kode yang pernah mengisinya (temuan audit Prompt 01).
export async function hitungUlangSkorBumd(input: unknown) {
  await requireRole(["admin_bpsda", "super_admin"]);
  const parsed = hitungSkorSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { data: hasil, error: rpcError } = await supabase
    .rpc("hitung_skor_bumd", { p_bumd_id: parsed.data.entityId, p_tahun: parsed.data.tahun })
    .single();

  if (rpcError) return { success: false as const, error: "Gagal menghitung skor" };
  if (hasil?.skor_total == null) {
    return {
      success: false as const,
      error: "Belum ada realisasi terverifikasi tahun ini — tidak ada yang bisa dihitung.",
    };
  }

  const { error } = await supabase.from("evaluasi_bumd").upsert(
    {
      bumd_id: parsed.data.entityId,
      periode: String(parsed.data.tahun),
      skor_total: hasil.skor_total,
      kategori: hasil.kategori,
      status: "published",
    },
    { onConflict: "bumd_id,periode" }
  );

  if (error) return { success: false as const, error: "Gagal menyimpan hasil skor" };
  return { success: true as const, skorTotal: hasil.skor_total, kategori: hasil.kategori };
}

export async function hitungUlangSkorBlud(input: unknown) {
  await requireRole(["admin_bpsda", "super_admin"]);
  const parsed = hitungSkorSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { data: hasil, error: rpcError } = await supabase
    .rpc("hitung_skor_blud", { p_blud_id: parsed.data.entityId, p_tahun: parsed.data.tahun })
    .single();

  if (rpcError) return { success: false as const, error: "Gagal menghitung skor" };
  if (hasil?.skor_total == null) {
    return {
      success: false as const,
      error: "Belum ada realisasi disetujui tahun ini — tidak ada yang bisa dihitung.",
    };
  }

  const { error } = await supabase.from("evaluasi_blud").upsert(
    {
      blud_id: parsed.data.entityId,
      periode: String(parsed.data.tahun),
      skor_total: hasil.skor_total,
      maturitas: hasil.kategori,
      status: "published",
    },
    { onConflict: "blud_id,periode" }
  );

  if (error) return { success: false as const, error: "Gagal menyimpan hasil skor" };
  return { success: true as const, skorTotal: hasil.skor_total, kategori: hasil.kategori };
}
