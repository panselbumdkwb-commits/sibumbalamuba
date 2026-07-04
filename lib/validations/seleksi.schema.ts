import { z } from "zod";

export const registerPesertaDireksiSchema = z.object({
  bumdId: z.string().uuid(),
});

export const verifyBerkasSchema = z.object({
  berkasId: z.string().uuid(),
  status: z.enum(["lolos", "ditolak"]),
  catatan: z.string().max(500).optional(),
});

export const assistedRegisterSchema = z.object({
  targetUserId: z.string().uuid(),
  jenisSeleksi: z.enum(["dewas", "komisaris"]),
  bumdId: z.string().uuid(),
  tokenUndangan: z.string().min(10),
});

export const batalkanPendaftaranSchema = z.object({
  pesertaId: z.string().uuid(),
  alasan: z.string().max(500).optional(),
});
