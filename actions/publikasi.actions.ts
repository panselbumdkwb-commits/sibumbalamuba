"use server";

import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { togglePublikasiSchema } from "@/lib/validations/publikasi.schema";
import { revalidatePath } from "next/cache";

// HANYA admin_bpsda — ditegakkan dua lapis: requireRole di sini, DAN
// RLS "publikasi_monev_write_bpsda" (migration 0028). Ini satu-satunya
// jalan skor kesehatan BUMD/BLUD tampil di dashboard publik ("/") —
// tidak otomatis begitu ada data terverifikasi, supaya BPSDA tetap
// jadi pengontrol kualitas terakhir sebelum publik melihatnya.
export async function togglePublikasiMonev(input: unknown) {
  await requireRole(["admin_bpsda"]);

  const parsed = togglePublikasiSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Input tidak valid — tahun harus angka 2000-2100" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("publikasi_monev").upsert(
    {
      jenis_entitas: parsed.data.jenisEntitas,
      tahun: parsed.data.tahun,
      dipublikasikan: parsed.data.dipublikasikan,
      dipublikasikan_oleh: parsed.data.dipublikasikan ? user?.id ?? null : null,
      dipublikasikan_at: parsed.data.dipublikasikan ? new Date().toISOString() : null,
    },
    { onConflict: "jenis_entitas,tahun" }
  );

  if (error) {
    return { success: false as const, error: "Gagal menyimpan status publikasi" };
  }

  // Halaman publik di-render server-side & di-cache — revalidate
  // supaya perubahan publikasi langsung terlihat tanpa perlu deploy.
  revalidatePath("/");

  return { success: true as const };
}
