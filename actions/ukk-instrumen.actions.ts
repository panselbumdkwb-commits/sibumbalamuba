"use server";

import { requireRole, getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import {
  buatInstrumenSchema,
  simpanPenilaianSchema,
  finalisasiPenilaianSchema,
  buatBeritaAcaraUkkSchema,
} from "@/lib/validations/ukk-instrumen.schema";

const ASPEK_LABEL: Record<string, string> = {
  integritas: "Integritas",
  kepemimpinan: "Kepemimpinan",
  kompetensi_manajerial: "Kompetensi Manajerial",
  kompetensi_bisnis: "Kompetensi Bisnis",
  kompetensi_keuangan: "Kompetensi Keuangan",
  tata_kelola: "Tata Kelola",
  regulasi: "Regulasi",
  komunikasi: "Komunikasi",
  problem_solving: "Problem Solving",
  business_plan: "Business Plan",
};

// Menyusun instrumen & bobot — wewenang profesional Tim UKK sendiri
// (independensi), bukan Panitia Seleksi (lihat matriks: panitia tidak
// berwenang "mengubah persyaratan" / instrumen penilaian).
export async function buatInstrumen(input: unknown) {
  const profile = await requireRole(["tim_ukk", "super_admin"]);
  const parsed = buatInstrumenSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();

  // Validasi ringan di aplikasi: total bobot semua aspek sebaiknya <= 1
  // (100%). Tidak dipaksa DB (constraint per-baris saja) supaya Tim UKK
  // bisa menyusun instrumen bertahap tanpa terblokir di tengah proses.
  const { data: existing } = await supabase
    .from("ukk_instrumen")
    .select("bobot")
    .eq("seleksi_proses_id", parsed.data.seleksiProsesId);
  const totalBobot = (existing?.reduce((s, i) => s + Number(i.bobot), 0) ?? 0) + parsed.data.bobot;
  if (totalBobot > 1.001) {
    return {
      success: false as const,
      error: `Total bobot akan menjadi ${(totalBobot * 100).toFixed(0)}% (melebihi 100%). Kurangi bobot aspek lain dulu.`,
    };
  }

  const { error } = await supabase.from("ukk_instrumen").insert({
    seleksi_proses_id: parsed.data.seleksiProsesId,
    aspek: parsed.data.aspek,
    bobot: parsed.data.bobot,
    deskripsi_indikator: parsed.data.deskripsiIndikator ?? null,
    dibuat_oleh: profile.id,
  });

  if (error) {
    return {
      success: false as const,
      error: error.message.includes("duplicate") ? "Aspek ini sudah punya bobot untuk siklus seleksi ini" : "Gagal menambah instrumen",
    };
  }
  return { success: true as const };
}

// Input skor per aspek — HANYA tim_ukk untuk baris miliknya sendiri
// (ditegakkan RLS "ukk_penilaian_insert_own"/"_update_own_draft").
export async function simpanPenilaian(input: unknown) {
  const profile = await requireRole(["tim_ukk", "super_admin"]);
  const parsed = simpanPenilaianSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();
  const { error } = await supabase.from("ukk_penilaian").upsert(
    {
      peserta_id: parsed.data.pesertaId,
      instrumen_id: parsed.data.instrumenId,
      tim_ukk_id: profile.id,
      skor: parsed.data.skor,
      catatan: parsed.data.catatan ?? null,
    },
    { onConflict: "peserta_id,instrumen_id,tim_ukk_id" }
  );

  if (error) return { success: false as const, error: "Gagal menyimpan nilai" };
  return { success: true as const };
}

// Finalisasi — mengunci seluruh nilai asesor ybs untuk satu peserta
// (tidak bisa diubah lagi setelah ini, sesuai prinsip akuntabel).
export async function finalisasiPenilaian(input: unknown) {
  const profile = await requireRole(["tim_ukk", "super_admin"]);
  const parsed = finalisasiPenilaianSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();

  const { data: instrumenList } = await supabase
    .from("ukk_instrumen")
    .select("id, bobot")
    .eq("seleksi_proses_id", parsed.data.seleksiProsesId);

  const { data: penilaianList } = await supabase
    .from("ukk_penilaian")
    .select("id, instrumen_id, skor")
    .eq("peserta_id", parsed.data.pesertaId)
    .eq("tim_ukk_id", profile.id);

  const instrumenTernilai = new Set(penilaianList?.map((p) => p.instrumen_id));
  const belumLengkap = instrumenList?.some((i) => !instrumenTernilai.has(i.id));

  if (belumLengkap) {
    return { success: false as const, error: "Lengkapi nilai untuk semua aspek sebelum finalisasi" };
  }

  const { error } = await supabase
    .from("ukk_penilaian")
    .update({ is_final: true })
    .eq("peserta_id", parsed.data.pesertaId)
    .eq("tim_ukk_id", profile.id);

  if (error) return { success: false as const, error: "Gagal finalisasi" };

  // ---------------------------------------------------------------
  // SINKRONISASI (menutup Gap #1 dari audit Prompt 01): nilai_ukk
  // (dipakai peserta dashboard untuk rekap 5-tahap: psikotes/tes
  // tulis/wawancara/presentasi/ukk) sebelumnya TIDAK PERNAH terisi
  // dari instrumen berbobot ini — dua sistem berjalan sendiri-sendiri.
  // Sekarang, begitu asesor finalisasi, skor tertimbang MILIK ASESOR
  // INI SENDIRI (bukan rata-rata semua asesor — itu tetap dihitung
  // terpisah oleh get_rekap_ukk_tertimbang untuk panitia/ketua) ikut
  // disimpan sebagai baris nilai_ukk (tahap='ukk') miliknya, supaya
  // rekap 5-tahap peserta konsisten dengan hasil detail Tim UKK.
  // ---------------------------------------------------------------
  const totalBobot = instrumenList?.reduce((s, i) => s + Number(i.bobot), 0) ?? 0;
  const skorTertimbang = penilaianList?.reduce((sum, p) => {
    const bobot = instrumenList?.find((i) => i.id === p.instrumen_id)?.bobot ?? 0;
    return sum + Number(p.skor) * Number(bobot);
  }, 0);

  if (totalBobot > 0 && skorTertimbang != null) {
    await supabase.from("nilai_ukk").upsert(
      {
        peserta_id: parsed.data.pesertaId,
        tim_ukk_id: profile.id,
        tahap: "ukk",
        skor: Math.round((skorTertimbang / totalBobot) * 100) / 100,
        is_final: true,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "peserta_id,tahap,tim_ukk_id" }
    );
    // Sengaja tidak menggagalkan seluruh finalisasi kalau sinkronisasi
    // ini gagal (mis. RLS/constraint) — nilai instrumen tetap final,
    // sinkronisasi bisa disusulkan manual oleh super_admin kalau perlu.
  }

  return { success: true as const };
}

// Buat draf Berita Acara UKK — dituliskan ke modul Surat & Dokumen yang
// sudah ada (bukan sistem terpisah), supaya alur tanda tangan
// ketua_pansel (0010) otomatis berlaku juga untuk berita acara ini.
export async function buatBeritaAcaraUkk(input: unknown) {
  const profile = await getSessionProfile();
  if (!profile || !["tim_ukk", "panitia_seleksi", "ketua_pansel", "super_admin"].includes(profile.role)) {
    return { success: false as const, error: "Tidak berwenang" };
  }

  const parsed = buatBeritaAcaraUkkSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid" };

  const supabase = await createClient();

  const { data: rekap } = await supabase.rpc("get_rekap_ukk_tertimbang", {
    p_seleksi_proses_id: parsed.data.seleksiProsesId,
  });

  const { data: instrumenList } = await supabase
    .from("ukk_instrumen")
    .select("aspek, bobot")
    .eq("seleksi_proses_id", parsed.data.seleksiProsesId);

  const daftarInstrumen = instrumenList
    ?.map((i) => `- ${ASPEK_LABEL[i.aspek] ?? i.aspek}: bobot ${(Number(i.bobot) * 100).toFixed(0)}%`)
    .join("\n") ?? "-";

  const daftarPeringkat = rekap
    ?.filter((r) => r.sudah_lengkap)
    .sort((a, b) => a.peringkat - b.peringkat)
    .map((r) => `${r.peringkat}. Peserta ${r.peserta_id.slice(0, 8)}… — Skor akhir: ${r.skor_akhir}`)
    .join("\n") ?? "Belum ada hasil final.";

  const isiSurat = `Berdasarkan pelaksanaan Uji Kelayakan dan Kepatutan (UKK), dengan instrumen penilaian sebagai berikut:\n\n${daftarInstrumen}\n\nTim Uji Kelayakan dan Kepatutan menyampaikan hasil penilaian dan rekomendasi profesional sebagai berikut:\n\n${daftarPeringkat}\n\nHasil penilaian ini bersifat rekomendasi profesional. Penetapan kelulusan dan pengangkatan tetap menjadi kewenangan Kepala Daerah/KPM sesuai ketentuan PP 54/2017 dan Permendagri 37/2018.`;

  const { error } = await supabase.from("dokumen_internal").insert({
    pembuat_id: profile.id,
    judul: "Berita Acara Hasil Uji Kelayakan dan Kepatutan (UKK)",
    jenis_naskah: "berita_acara",
    sifat: "penting",
    lampiran: "Rekapitulasi Hasil Penilaian UKK",
    isi_surat: isiSurat,
    status: "draft",
  });

  if (error) return { success: false as const, error: "Gagal membuat draf berita acara" };
  return { success: true as const };
}
