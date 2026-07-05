import { z } from "zod";

export const rkapSchema = z.object({
  bumdId: z.string().uuid(),
  tahun: z.coerce.number().int().min(2020).max(2100),
  targetPendapatan: z.coerce.number().optional(),
  targetLaba: z.coerce.number().optional(),
  targetDividen: z.coerce.number().optional(),
  targetInvestasi: z.coerce.number().optional(),
});

export const kpiSchema = z.object({
  bumdId: z.string().uuid(),
  tahun: z.coerce.number().int().min(2020).max(2100),
  kategori: z.enum(["keuangan", "operasional", "pelayanan", "tata_kelola", "kontribusi_daerah"]),
  namaIndikator: z.string().min(3).max(200),
  targetNilai: z.coerce.number(),
  satuan: z.string().max(30).optional(),
});

export const realisasiSchema = z.object({
  bumdKpiId: z.string().uuid(),
  periode: z.enum([
    "triwulan_1",
    "triwulan_2",
    "triwulan_3",
    "triwulan_4",
    "semester_1",
    "semester_2",
    "tahunan",
  ]),
  nilaiRealisasi: z.coerce.number(),
  catatan: z.string().max(500).optional(),
  analisisPenyebab: z.string().max(1000).optional(),
  rencanaTindakLanjut: z.string().max(1000).optional(),
  buktiDukungUrl: z.string().url().optional().or(z.literal("")),
});

export const verifikasiRealisasiSchema = z.object({
  realisasiId: z.string().uuid(),
  status: z.enum(["perlu_perbaikan", "terverifikasi", "ditolak"]),
  catatanVerifikasi: z.string().max(1000).optional(),
});

export const risikoSchema = z.object({
  bumdId: z.string().uuid(),
  tahun: z.coerce.number().int().min(2020).max(2100),
  kategori: z.enum(["strategis", "keuangan", "operasional", "sdm", "hukum", "reputasi"]),
  deskripsi: z.string().min(5).max(500),
  tingkat: z.enum(["rendah", "sedang", "tinggi"]),
  mitigasi: z.string().max(500).optional(),
});

export const updateStatusRisikoSchema = z.object({
  risikoId: z.string().uuid(),
  status: z.enum(["belum_ditangani", "dalam_proses", "selesai"]),
});
