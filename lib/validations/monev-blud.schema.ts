import { z } from "zod";

export const renstraRbaSchema = z.object({
  bludId: z.string().uuid(),
  tahun: z.coerce.number().int().min(2020).max(2100),
  targetPendapatan: z.coerce.number().optional(),
  targetBelanja: z.coerce.number().optional(),
  ringkasanTargetLayanan: z.string().max(1000).optional(),
});

export const kpiBludSchema = z.object({
  bludId: z.string().uuid(),
  tahun: z.coerce.number().int().min(2020).max(2100),
  kategori: z.enum(["pelayanan", "keuangan", "tata_kelola", "sdm", "pengembangan"]),
  namaIndikator: z.string().min(3).max(200),
  targetNilai: z.coerce.number(),
  satuan: z.string().max(30).optional(),
});

export const realisasiBludSchema = z.object({
  bludKpiId: z.string().uuid(),
  jenisPeriode: z.enum(["bulanan", "triwulanan", "semester", "tahunan"]),
  nomorPeriode: z.coerce.number().int().min(1).max(12),
  tahun: z.coerce.number().int().min(2020).max(2100),
  nilaiRealisasi: z.coerce.number(),
  analisisPenyebab: z.string().max(1000).optional(),
  rencanaTindakLanjut: z.string().max(1000).optional(),
  buktiDukungUrl: z.string().url().optional().or(z.literal("")),
});

export const verifikasiRealisasiBludSchema = z.object({
  realisasiId: z.string().uuid(),
  status: z.enum(["perlu_perbaikan", "disetujui"]),
  catatanVerifikasi: z.string().max(1000).optional(),
});

export const risikoBludSchema = z.object({
  bludId: z.string().uuid(),
  tahun: z.coerce.number().int().min(2020).max(2100),
  kategori: z.enum(["strategis", "pelayanan", "sdm", "keuangan", "teknologi_informasi", "hukum"]),
  deskripsi: z.string().min(5).max(500),
  tingkat: z.enum(["rendah", "sedang", "tinggi"]),
  mitigasi: z.string().max(500).optional(),
});

export const updateStatusRisikoBludSchema = z.object({
  risikoId: z.string().uuid(),
  status: z.enum(["belum_ditangani", "dalam_proses", "selesai"]),
});
