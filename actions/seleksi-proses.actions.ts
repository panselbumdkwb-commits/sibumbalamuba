"use server";

import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import {
  buatSeleksiProsesSchema,
  updateSeleksiProsesSchema,
  tambahLowonganSchema,
  updateLowonganSchema,
  hapusLowonganSchema,
  hapusSeleksiProsesSchema,
  updateStatusTahapanSchema,
  hubungkanDokumenSchema,
  updateKelompokBerjalanSchema,
  PAKET_KOMBINASI_VALID,
} from "@/lib/validations/seleksi-proses.schema";

// PENTING: requireRole() dan panggilan Supabase bisa MELEMPAR exception
// (bukan cuma mengembalikan { error }) — kalau tidak ditangkap, Next.js
// akan menampilkan error generik yang tidak informatif di client
// ("gagal" tanpa penjelasan). Semua fungsi di file ini SELALU
// menangkap exception dan mengembalikannya sebagai pesan yang jelas,
// supaya kegagalan apa pun (role tidak sesuai, sesi habis, RLS
// menolak, migration belum diterapkan, dsb.) selalu terlihat di layar.
function pesanError(e: unknown, konteks: string): string {
  // Dicatat ke server log (terlihat di Vercel → Deployments → Runtime
  // Logs) supaya penyebab asli tetap bisa dilacak, walau Next.js
  // menyembunyikan detail exception dari browser saat production.
  console.error(`[seleksi-proses.actions:${konteks}]`, e);

  if (e instanceof Error) {
    if (e.message === "UNAUTHENTICATED") return "Sesi login sudah habis — silakan login ulang.";
    if (e.message === "FORBIDDEN") return "Akun ini tidak punya wewenang untuk aksi ini.";
    return `${e.message} (cek Vercel Runtime Logs untuk detail, konteks: ${konteks})`;
  }
  return `Terjadi kesalahan tak terduga (cek Vercel Runtime Logs, konteks: ${konteks})`;
}

function cekKombinasiValid(jenisList: string[]): string | null {
  if (jenisList.length > 2) return "Satu proses maksimal 2 posisi sekaligus.";
  if (jenisList.length === 2) {
    if (jenisList[0] === jenisList[1]) return "Dua posisi tidak boleh jenis seleksi yang sama.";
    const pair = [...jenisList].sort() as [string, string];
    const cocok = PAKET_KOMBINASI_VALID.some((p) => [...p].sort().join(",") === pair.join(","));
    if (!cocok) return "Kombinasi 2 posisi hanya boleh Direksi & Komisaris, atau Direksi & Dewan Pengawas.";
  }
  return null;
}

// Membuat satu siklus proses seleksi baru — boleh memuat 1 atau 2 posisi
// sekaligus (mis. "Komisaris & Direktur PT. Batu Wisata Resource" dalam
// SATU proses, satu Pansel, satu checklist 24 tugas baku yang sama; 24
// tugas ter-generate otomatis lewat trigger database
// trg_buat_tahapan_seleksi_standar begitu baris seleksi_proses dibuat).
export async function buatSeleksiProses(input: unknown) {
  try {
    const profile = await requireRole(["panitia_seleksi", "ketua_pansel"]);
    const parsed = buatSeleksiProsesSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
    }

    const supabase = await createClient();

    const { data: proses, error: prosesError } = await supabase
      .from("seleksi_proses")
      .insert({
        bumd_id: parsed.data.bumdId ?? null,
        tahun: parsed.data.tahun,
        dibuat_oleh: profile.id,
      })
      .select("id")
      .single();

    if (prosesError || !proses) {
      return { success: false as const, error: `Gagal membuat proses seleksi: ${prosesError?.message ?? "tidak diketahui"}` };
    }

    const { error: lowonganError } = await supabase.from("seleksi_lowongan").insert(
      parsed.data.lowongan.map((l) => ({
        seleksi_proses_id: proses.id,
        jenis_seleksi: l.jenisSeleksi,
        jabatan_lowong: l.jabatanLowong,
      }))
    );

    if (lowonganError) {
      // Bersihkan proses yatim kalau lowongan gagal dibuat, supaya tidak
      // ada seleksi_proses tanpa satu pun posisi.
      await supabase.from("seleksi_proses").delete().eq("id", proses.id);
      return { success: false as const, error: `Gagal menyimpan posisi lowongan: ${lowonganError.message}` };
    }

    return { success: true as const, id: proses.id };
  } catch (e) {
    return { success: false as const, error: pesanError(e, "buatSeleksiProses") };
  }
}

// Edit metadata proses (tahun & entitas BUMD) setelah proses dibuat.
// Posisi/jabatan diedit lewat tambahLowongan/updateLowongan/hapusLowongan
// di bawah, bukan lewat fungsi ini.
export async function editSeleksiProses(input: unknown) {
  try {
    await requireRole(["panitia_seleksi", "ketua_pansel"]);
    const parsed = updateSeleksiProsesSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

    const supabase = await createClient();
    const { error } = await supabase
      .from("seleksi_proses")
      .update({ bumd_id: parsed.data.bumdId, tahun: parsed.data.tahun })
      .eq("id", parsed.data.id);

    if (error) return { success: false as const, error: `Gagal memperbarui proses seleksi: ${error.message}` };
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: pesanError(e, "editSeleksiProses") };
  }
}

export async function tambahLowongan(input: unknown) {
  try {
    await requireRole(["panitia_seleksi", "ketua_pansel"]);
    const parsed = tambahLowonganSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("seleksi_lowongan")
      .select("jenis_seleksi")
      .eq("seleksi_proses_id", parsed.data.seleksiProsesId);

    const kombinasiError = cekKombinasiValid([...(existing ?? []).map((l) => l.jenis_seleksi), parsed.data.jenisSeleksi]);
    if (kombinasiError) return { success: false as const, error: kombinasiError };

    const { error } = await supabase.from("seleksi_lowongan").insert({
      seleksi_proses_id: parsed.data.seleksiProsesId,
      jenis_seleksi: parsed.data.jenisSeleksi,
      jabatan_lowong: parsed.data.jabatanLowong,
    });

    if (error) return { success: false as const, error: `Gagal menambah posisi: ${error.message}` };
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: pesanError(e, "tambahLowongan") };
  }
}

export async function updateLowongan(input: unknown) {
  try {
    await requireRole(["panitia_seleksi", "ketua_pansel"]);
    const parsed = updateLowonganSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

    const supabase = await createClient();
    const { data: current } = await supabase
      .from("seleksi_lowongan")
      .select("seleksi_proses_id")
      .eq("id", parsed.data.id)
      .single();
    if (!current) return { success: false as const, error: "Posisi tidak ditemukan" };

    const { data: siblings } = await supabase
      .from("seleksi_lowongan")
      .select("id, jenis_seleksi")
      .eq("seleksi_proses_id", current.seleksi_proses_id);

    const jenisGabungan = (siblings ?? []).map((l) => (l.id === parsed.data.id ? parsed.data.jenisSeleksi : l.jenis_seleksi));
    const kombinasiError = cekKombinasiValid(jenisGabungan);
    if (kombinasiError) return { success: false as const, error: kombinasiError };

    const { error } = await supabase
      .from("seleksi_lowongan")
      .update({ jenis_seleksi: parsed.data.jenisSeleksi, jabatan_lowong: parsed.data.jabatanLowong })
      .eq("id", parsed.data.id);

    if (error) return { success: false as const, error: `Gagal memperbarui posisi: ${error.message}` };
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: pesanError(e, "updateLowongan") };
  }
}

export async function hapusLowongan(input: unknown) {
  try {
    await requireRole(["panitia_seleksi", "ketua_pansel"]);
    const parsed = hapusLowonganSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

    const supabase = await createClient();
    const { data: current } = await supabase
      .from("seleksi_lowongan")
      .select("seleksi_proses_id")
      .eq("id", parsed.data.id)
      .single();
    if (!current) return { success: false as const, error: "Posisi tidak ditemukan" };

    const { count } = await supabase
      .from("seleksi_lowongan")
      .select("id", { count: "exact", head: true })
      .eq("seleksi_proses_id", current.seleksi_proses_id);

    if ((count ?? 0) <= 1) {
      return { success: false as const, error: "Tidak bisa menghapus satu-satunya posisi dalam proses ini. Hapus seluruh proses kalau memang tidak jadi dipakai." };
    }

    // peserta yang sudah tertaut ke posisi ini akan otomatis terlepas
    // (seleksi_lowongan_id jadi NULL) lewat "on delete set null" — panitia
    // perlu menautkan ulang peserta tersebut ke posisi lain bila perlu.
    const { error } = await supabase.from("seleksi_lowongan").delete().eq("id", parsed.data.id);
    if (error) return { success: false as const, error: `Gagal menghapus posisi: ${error.message}` };
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: pesanError(e, "hapusLowongan") };
  }
}

// Menghapus SELURUH proses seleksi — ikut menghapus semua posisi
// (seleksi_lowongan), 24 tugas checklist (seleksi_tahapan), dan
// instrumen UKK terkait lewat "on delete cascade" di database.
// Peserta yang sudah tertaut ke salah satu posisinya akan otomatis
// terlepas (seleksi_lowongan_id jadi NULL), tidak ikut terhapus.
// Berguna untuk membereskan proses yang salah/duplikat saat testing.
export async function hapusSeleksiProses(input: unknown) {
  try {
    await requireRole(["panitia_seleksi", "ketua_pansel"]);
    const parsed = hapusSeleksiProsesSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

    const supabase = await createClient();
    const { error } = await supabase.from("seleksi_proses").delete().eq("id", parsed.data.id);

    if (error) return { success: false as const, error: `Gagal menghapus proses seleksi: ${error.message}` };
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: pesanError(e, "hapusSeleksiProses") };
  }
}

export async function updateStatusTahapan(input: unknown) {
  try {
    await requireRole(["panitia_seleksi", "ketua_pansel"]);
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

    if (error) return { success: false as const, error: `Gagal memperbarui status tugas: ${error.message}` };
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: pesanError(e, "updateStatusTahapan") };
  }
}

// Menautkan tugas ke dokumen resmi yang sudah dibuat lewat modul Surat &
// Dokumen (/internal/dokumen) — TIDAK membuat dokumen baru di sini,
// supaya alur pembuatan & tanda tangan surat tetap satu pintu.
export async function hubungkanDokumen(input: unknown) {
  try {
    await requireRole(["panitia_seleksi", "ketua_pansel"]);
    const parsed = hubungkanDokumenSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

    const supabase = await createClient();
    const { error } = await supabase
      .from("seleksi_tahapan")
      .update({ dokumen_id: parsed.data.dokumenId })
      .eq("id", parsed.data.tahapanId);

    if (error) return { success: false as const, error: `Gagal menautkan dokumen: ${error.message}` };
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: pesanError(e, "hubungkanDokumen") };
  }
}

export async function updateKelompokBerjalan(input: unknown) {
  try {
    await requireRole(["panitia_seleksi", "ketua_pansel"]);
    const parsed = updateKelompokBerjalanSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

    const supabase = await createClient();
    const { error } = await supabase
      .from("seleksi_proses")
      .update({ kelompok_berjalan: parsed.data.kelompok })
      .eq("id", parsed.data.seleksiProsesId);

    if (error) return { success: false as const, error: `Gagal memperbarui tahapan berjalan: ${error.message}` };
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: pesanError(e, "updateKelompokBerjalan") };
  }
}
