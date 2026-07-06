"use server";

import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import {
  buatSuratSchema,
  ajukanSuratSchema,
  putuskanSuratSchema,
} from "@/lib/validations/dokumen.schema";

/**
 * Alur surat-menyurat panitia seleksi:
 *   draft (pembuat) -> diajukan (pembuat) -> disetujui/ditolak (ketua_pansel/super_admin)
 *
 * Pemisahan wewenang ditegakkan RLS (migration 0010), bukan cuma di kode
 * ini — kalau seseorang mem-bypass UI dan memanggil Supabase langsung,
 * RLS tetap menolak anggota panitia biasa untuk menyetujui surat.
 */

export async function buatSurat(input: unknown) {
  const profile = await requireRole(["panitia_seleksi", "ketua_pansel", "super_admin"]);

  const parsed = buatSuratSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Input tidak valid — periksa kembali judul (min. 5 karakter)" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("dokumen_internal").insert({
    pembuat_id: profile.id,
    judul: parsed.data.judul,
    jenis_naskah: parsed.data.jenisNaskah,
    sifat: parsed.data.sifat,
    lampiran: parsed.data.lampiran || "-",
    kepada: parsed.data.kepada ?? null,
    isi_surat: parsed.data.isiSurat ?? null,
    tembusan: parsed.data.tembusan ?? null,
    status: "draft",
  });

  if (error) {
    return { success: false as const, error: "Gagal membuat draf surat" };
  }

  return { success: true as const };
}

// Nomor surat digenerate OTOMATIS di sini (bukan saat draf dibuat) —
// begitu diajukan, format {urut}/PANSEL-{JENIS}/{bulan romawi}/{tahun}
// sesuai pola umum penomoran naskah dinas pemda.
export async function ajukanSurat(input: unknown) {
  await requireRole(["panitia_seleksi", "ketua_pansel", "super_admin"]);

  const parsed = ajukanSuratSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Input tidak valid" };
  }

  const supabase = await createClient();

  const { data: dokumen } = await supabase
    .from("dokumen_internal")
    .select("jenis_naskah, nomor_surat")
    .eq("id", parsed.data.dokumenId)
    .single();

  let nomorSurat = dokumen?.nomor_surat ?? null;
  if (!nomorSurat && dokumen) {
    const { data: nomorBaru } = await supabase.rpc("generate_nomor_surat", {
      p_jenis: dokumen.jenis_naskah,
    });
    nomorSurat = nomorBaru ?? null;
  }

  const { error } = await supabase
    .from("dokumen_internal")
    .update({ status: "diajukan", nomor_surat: nomorSurat })
    .eq("id", parsed.data.dokumenId);

  if (error) {
    return { success: false as const, error: "Gagal mengajukan surat" };
  }

  return { success: true as const };
}

// HANYA ketua_pansel/super_admin — ditegakkan dua lapis: requireRole di
// sini, DAN RLS "dokumen_internal_update_approver" yang mewajibkan
// approver_id = auth.uid() milik role tersebut.
export async function putuskanSurat(input: unknown) {
  const profile = await requireRole(["ketua_pansel", "super_admin"]);

  const parsed = putuskanSuratSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Input tidak valid" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("dokumen_internal")
    .update({
      status: parsed.data.keputusan,
      approver_id: profile.id,
    })
    .eq("id", parsed.data.dokumenId);

  if (error) {
    return { success: false as const, error: "Gagal memproses keputusan" };
  }

  await supabase.from("audit_log").insert({
    user_id: profile.id,
    aksi: parsed.data.keputusan === "disetujui" ? "tandatangani_surat" : "tolak_surat",
    tabel_terkait: "dokumen_internal",
    record_id: parsed.data.dokumenId,
    detail: null,
  });

  return { success: true as const };
}
