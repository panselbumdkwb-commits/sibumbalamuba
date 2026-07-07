import { z } from "zod";

const ASPEK_VALUES = [
  "integritas",
  "kepemimpinan",
  "kompetensi_manajerial",
  "kompetensi_bisnis",
  "kompetensi_keuangan",
  "tata_kelola",
  "regulasi",
  "komunikasi",
  "problem_solving",
  "business_plan",
] as const;

export const buatInstrumenSchema = z.object({
  seleksiProsesId: z.string().uuid(),
  aspek: z.enum(ASPEK_VALUES),
  bobot: z.coerce.number().gt(0).max(1),
  deskripsiIndikator: z.string().max(1000).optional(),
});

export const simpanPenilaianSchema = z.object({
  pesertaId: z.string().uuid(),
  instrumenId: z.string().uuid(),
  skor: z.coerce.number().min(0).max(100),
  catatan: z.string().max(1000).optional(),
});

export const finalisasiPenilaianSchema = z.object({
  pesertaId: z.string().uuid(),
  seleksiProsesId: z.string().uuid(),
});

export const buatBeritaAcaraUkkSchema = z.object({
  seleksiProsesId: z.string().uuid(),
});
