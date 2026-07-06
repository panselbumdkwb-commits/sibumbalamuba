import { z } from "zod";

export const buatSuratSchema = z.object({
  judul: z.string().min(5).max(200),
  jenisNaskah: z.enum([
    "surat_biasa",
    "surat_undangan",
    "nota_dinas",
    "berita_acara",
    "surat_keterangan",
    "surat_edaran",
    "laporan",
    "surat_pengantar",
  ]),
  sifat: z.enum(["biasa", "penting", "segera", "rahasia"]),
  lampiran: z.string().max(100).optional(),
  kepada: z.string().max(200).optional(),
  isiSurat: z.string().max(5000).optional(),
  tembusan: z.string().max(1000).optional(),
});

export const ajukanSuratSchema = z.object({
  dokumenId: z.string().uuid(),
});

export const putuskanSuratSchema = z.object({
  dokumenId: z.string().uuid(),
  keputusan: z.enum(["disetujui", "ditolak"]),
});
