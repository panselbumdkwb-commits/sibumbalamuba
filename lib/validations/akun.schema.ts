import { z } from "zod";

const USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_.]{2,30}[a-zA-Z0-9]$/;

export const roleYangBisaDibuatSuperAdmin = z.enum([
  "admin_bpsda",
  "admin_bumd",
  "admin_blud",
  "panitia_seleksi",
  "ketua_pansel",
  "tim_ukk",
  "eksekutif",
  "super_admin",
]);

export const buatAkunSchema = z
  .object({
    namaLengkap: z.string().min(3).max(100),
    username: z.string().regex(USERNAME_REGEX, "Format username tidak valid"),
    email: z.string().email(),
    password: z.string().min(8),
    role: roleYangBisaDibuatSuperAdmin,
    entityType: z.enum(["bumd", "blud"]).optional(),
    entityId: z.string().uuid().optional(),
  })
  .refine(
    (data) => (data.role === "admin_bumd" || data.role === "admin_blud" ? Boolean(data.entityId) : true),
    { message: "Entitas wajib dipilih untuk role admin_bumd/admin_blud", path: ["entityId"] }
  );

export const resetPasswordSchema = z.object({
  userId: z.string().uuid(),
  passwordBaru: z.string().min(8),
});

export const toggleAktifSchema = z.object({
  userId: z.string().uuid(),
  aktif: z.boolean(),
});
