import { z } from "zod";

export const buatSeleksiProsesSchema = z.object({
  jenisSeleksi: z.enum(["direksi", "dewas", "komisaris", "pegawai_blud"]),
  bumdId: z.string().uuid().optional(),
  jabatanLowong: z.string().min(3).max(200),
  tahun: z.coerce.number().int().min(2020).max(2100),
});

export const updateStatusTahapanSchema = z.object({
  tahapanId: z.string().uuid(),
  status: z.enum(["belum_mulai", "proses", "selesai"]),
  catatan: z.string().max(1000).optional(),
});

export const hubungkanDokumenSchema = z.object({
  tahapanId: z.string().uuid(),
  dokumenId: z.string().uuid().nullable(),
});

export const updateKelompokBerjalanSchema = z.object({
  seleksiProsesId: z.string().uuid(),
  kelompok: z.enum([
    "persiapan",
    "pengumuman",
    "pendaftaran",
    "seleksi_administrasi",
    "ukk",
    "penilaian",
    "wawancara_akhir",
    "penetapan",
    "dokumentasi",
    "evaluasi",
  ]),
});
