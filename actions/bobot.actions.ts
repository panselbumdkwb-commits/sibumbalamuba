"use server";

import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { updateBobotSetSchema } from "@/lib/validations/bobot.schema";

// Hanya admin_bpsda yang boleh menulis konfigurasi_bobot (RLS
// "bobot_write_bpsda", migration 0019) — requireRole di sini adalah
// lapis pertama (UX cepat), RLS tetap lapis pertahanan sesungguhnya
// kalau seseorang mem-bypass UI.
//
// Supaya kesalahan "total 200%" (migration 0025) tidak terulang lewat
// jalur edit manual, total bobot yang dikirim untuk satu jenis
// entitas WAJIB berjumlah 1.0 (100%) — divalidasi di sini SEBELUM
// baris mana pun ditulis (semua-atau-tidak-sama-sekali).
export async function updateBobotSet(input: unknown) {
  await requireRole(["admin_bpsda"]);

  const parsed = updateBobotSetSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Input tidak valid" };
  }

  const total = parsed.data.items.reduce((sum, i) => sum + i.bobot, 0);
  if (Math.abs(total - 1) > 0.001) {
    return {
      success: false as const,
      error: `Total bobot harus 100% — saat ini ${Math.round(total * 100)}%. Sesuaikan dulu sebelum disimpan.`,
    };
  }

  const supabase = await createClient();

  for (const item of parsed.data.items) {
    const { error } = await supabase
      .from("konfigurasi_bobot")
      .update({ bobot: item.bobot, berlaku_sejak: new Date().toISOString().slice(0, 10) })
      .eq("id", item.id)
      .eq("jenis_entitas", parsed.data.jenisEntitas)
      .eq("aktif", true);

    if (error) {
      return { success: false as const, error: "Gagal menyimpan sebagian bobot — coba lagi" };
    }
  }

  return { success: true as const };
}
