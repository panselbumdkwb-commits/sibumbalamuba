"use server";

import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import {
  buatSuratSchema,
  ajukanSuratSchema,
  putuskanSuratSchema,
  updateSuratSchema,
  hapusSuratSchema,
} from "@/lib/validations/dokumen.schema";

/**
 * Alur surat-menyurat panitia seleksi:
 *   draft (anggota_pansel) -> diajukan (anggota_pansel)
 *   -> disetujui (ketua_pansel, final) ATAU ditolak+catatan_revisi
 *      (ketua_pansel) -> pembuat Edit -> balik ke draft -> diajukan lagi
 *
 * ketua_pansel HANYA mengoreksi (menerima & menandatangani, atau
 * menolak & meminta revisi) — TIDAK membuat draf sendiri; itu tugas
 * anggota_pansel (role: panitia_seleksi). Pemisahan wewenang ditegakkan
 * RLS (migration 0010/0023/0026), bukan cuma di kode ini — kalau
 * seseorang mem-bypass UI dan memanggil Supabase langsung, RLS tetap
 * menolak.
 */

export async function buatSurat(input: unknown) {
  const profile = await requireRole(["panitia_seleksi"]);

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
    entitas_seleksi: parsed.data.entitasSeleksi ?? null,
    status: "draft",
  });

  if (error) {
    return { success: false as const, error: "Gagal membuat draf surat" };
  }

  return { success: true as const };
}

// Nomor surat digenerate OTOMATIS di sini (bukan saat draf dibuat) —
// begitu diajukan, format {urut}/PANSEL-{JENIS}/{bulan romawi}/{tahun}
// sesuai pola umum penomoran naskah dinas pemda. approver_id SELALU
// dikosongkan di sini (bukan cuma saat draf baru) — penting untuk
// alur revisi: surat yang tadinya 'ditolak' (approver_id sudah
// terisi ketua sebelumnya) harus kembali "bersih" saat diajukan
// ulang, supaya RLS "dokumen_internal_update_pembuat" (0010, yang
// mewajibkan approver_id kosong) tidak menolak update ini.
export async function ajukanSurat(input: unknown) {
  await requireRole(["panitia_seleksi"]);

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
    .update({ status: "diajukan", nomor_surat: nomorSurat, approver_id: null })
    .eq("id", parsed.data.dokumenId);

  if (error) {
    return { success: false as const, error: "Gagal mengajukan surat" };
  }

  return { success: true as const };
}

// HANYA ketua_pansel — ditegakkan dua lapis: requireRole di sini, DAN
// RLS "dokumen_internal_update_approver" yang mewajibkan approver_id =
// auth.uid() milik role tersebut. "Ditolak" di sini SELALU berarti
// "tolak + minta revisi" — catatan disimpan di catatan_revisi supaya
// anggota_pansel tahu apa yang perlu diperbaiki. Status TETAP 'ditolak'
// (bukan langsung balik ke draft) supaya ada jejak keputusan resmi;
// baru kembali ke 'draft' saat pembuat membuka Edit (lihat updateSurat).
export async function putuskanSurat(input: unknown) {
  const profile = await requireRole(["ketua_pansel"]);

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
      catatan_revisi: parsed.data.keputusan === "ditolak" ? parsed.data.catatan ?? null : null,
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

// Edit ("Simpan" perubahan) — HANYA pembuat, HANYA selama status
// 'draft' ATAU 'ditolak'. Kalau surat sedang 'ditolak' (ketua sudah
// memberi catatan revisi), menyimpan perubahan di sini otomatis
// mengembalikan statusnya ke 'draft' + mengosongkan approver_id &
// catatan_revisi — supaya alur "revisi" selesai bersih dan surat bisa
// diajukan ulang seperti draf baru. Begitu sudah 'diajukan' (apalagi
// sudah dapat nomor_surat), tidak boleh diedit lagi lewat menu ini —
// ditegakkan di sini DAN oleh RLS "dokumen_internal_update_pembuat"
// (migration 0010), yang cuma mengizinkan HASIL AKHIR update berstatus
// 'draft'/'diajukan' dengan approver_id kosong (status AWAL 'ditolak'
// tidak dibatasi kebijakan itu).
export async function updateSurat(input: unknown) {
  const profile = await requireRole(["panitia_seleksi"]);

  const parsed = updateSuratSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Input tidak valid — periksa kembali judul (min. 5 karakter)" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("dokumen_internal")
    .select("pembuat_id, status")
    .eq("id", parsed.data.dokumenId)
    .single();

  if (!existing) {
    return { success: false as const, error: "Surat tidak ditemukan" };
  }
  if (existing.pembuat_id !== profile.id) {
    return { success: false as const, error: "Anda bukan pembuat surat ini" };
  }
  if (existing.status !== "draft" && existing.status !== "ditolak") {
    return { success: false as const, error: "Surat yang sudah diajukan tidak bisa diedit lagi" };
  }

  const { error } = await supabase
    .from("dokumen_internal")
    .update({
      judul: parsed.data.judul,
      jenis_naskah: parsed.data.jenisNaskah,
      sifat: parsed.data.sifat,
      lampiran: parsed.data.lampiran || "-",
      kepada: parsed.data.kepada ?? null,
      isi_surat: parsed.data.isiSurat ?? null,
      tembusan: parsed.data.tembusan ?? null,
      entitas_seleksi: parsed.data.entitasSeleksi ?? null,
      status: "draft",
      approver_id: null,
      catatan_revisi: null,
    })
    .eq("id", parsed.data.dokumenId);

  if (error) {
    return { success: false as const, error: "Gagal memperbarui draf surat" };
  }

  return { success: true as const };
}

// Hapus — dua jalur wewenang berbeda, keduanya ditegakkan dua lapis
// (cek di sini DAN RLS, migration 0023/0026/0027):
//   (a) Pembuat: HANYA surat MILIKNYA SENDIRI, HANYA status 'draft'
//       atau 'ditolak' (mis. memilih membatalkan alih-alih merevisi).
//   (b) ketua_pansel/super_admin: surat SIAPA PUN, status APA PUN —
//       termasuk yang sudah 'disetujui' & bernomor resmi (atas
//       permintaan eksplisit; ini penghapusan PERMANEN tanpa jejak isi
//       surat, cuma tercatat di audit_log siapa & kapan).
export async function hapusSurat(input: unknown) {
  const profile = await requireRole(["panitia_seleksi", "ketua_pansel"]);

  const parsed = hapusSuratSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Input tidak valid" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("dokumen_internal")
    .select("pembuat_id, status")
    .eq("id", parsed.data.dokumenId)
    .single();

  if (!existing) {
    return { success: false as const, error: "Surat tidak ditemukan" };
  }

  const isKetua = profile.role === "ketua_pansel" || profile.role === "super_admin";
  const isPembuatSendiri = existing.pembuat_id === profile.id;

  if (!isKetua) {
    if (!isPembuatSendiri) {
      return { success: false as const, error: "Anda bukan pembuat surat ini" };
    }
    if (existing.status !== "draft" && existing.status !== "ditolak") {
      return { success: false as const, error: "Hanya draf atau surat yang ditolak yang bisa dihapus" };
    }
  }

  const { error } = await supabase
    .from("dokumen_internal")
    .delete()
    .eq("id", parsed.data.dokumenId);

  if (error) {
    return { success: false as const, error: "Gagal menghapus surat" };
  }

  await supabase.from("audit_log").insert({
    user_id: profile.id,
    aksi: "hapus_draf_surat",
    tabel_terkait: "dokumen_internal",
    record_id: parsed.data.dokumenId,
    detail: null,
  });

  return { success: true as const };
}
