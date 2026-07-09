import { z } from "zod";

export const simpanKepatuhanSchema = z.object({
  bludId: z.string().uuid(),
  tahun: z.coerce.number().int().min(2020).max(2100),
  jenis: z.enum([
    "rba",
    "laporan_keuangan",
    "laporan_kinerja",
    "opini_auditor",
    "ppk_blud",
    "pengadaan",
    "perpajakan",
  ]),
  status: z.enum(["tepat_waktu", "terlambat", "belum_disampaikan"]),
  tanggalPemenuhan: z.string().optional(),
  keterangan: z.string().max(500).optional(),
});

export const tambahInovasiSchema = z.object({
  bludId: z.string().uuid(),
  tahun: z.coerce.number().int().min(2020).max(2100),
  namaInovasi: z.string().min(3).max(200),
  kategori: z.enum([
    "digitalisasi",
    "sistem_informasi",
    "integrasi_layanan",
    "simplifikasi_prosedur",
    "lainnya",
  ]),
  deskripsi: z.string().max(1000).optional(),
  manfaat: z.string().max(1000).optional(),
});

export const updateStatusInovasiSchema = z.object({
  inovasiId: z.string().uuid(),
  status: z.enum(["direncanakan", "berjalan", "selesai"]),
});

export const tambahTindakLanjutSchema = z.object({
  bludId: z.string().uuid(),
  tahun: z.coerce.number().int().min(2020).max(2100),
  sumber: z.enum(["audit_internal", "audit_eksternal", "evaluasi_bpsda", "lainnya"]),
  rekomendasi: z.string().min(5).max(500),
  rencanaTindakLanjut: z.string().max(1000).optional(),
  targetPenyelesaian: z.string().optional(),
  buktiDukungUrl: z.string().url().optional().or(z.literal("")),
});

export const updateProgresTindakLanjutSchema = z.object({
  tindakLanjutId: z.string().uuid(),
  persentasePenyelesaian: z.coerce.number().int().min(0).max(100),
  status: z.enum(["belum_ditangani", "dalam_proses", "selesai"]),
  buktiDukungUrl: z.string().url().optional().or(z.literal("")),
});
