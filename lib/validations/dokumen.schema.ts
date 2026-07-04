import { z } from "zod";

export const buatSuratSchema = z.object({
  judul: z.string().min(5).max(200),
});

export const ajukanSuratSchema = z.object({
  dokumenId: z.string().uuid(),
});

export const putuskanSuratSchema = z.object({
  dokumenId: z.string().uuid(),
  keputusan: z.enum(["disetujui", "ditolak"]),
});
