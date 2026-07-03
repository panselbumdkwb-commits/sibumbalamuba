import { z } from "zod";

export const inputNilaiSchema = z.object({
  pesertaId: z.string().uuid(),
  tahap: z.enum(["psikotes", "tes_tulis", "ukk", "presentasi", "wawancara"]),
  skor: z.number().min(0).max(100),
});

export const submitFinalSchema = z.object({
  nilaiId: z.string().uuid(),
});
