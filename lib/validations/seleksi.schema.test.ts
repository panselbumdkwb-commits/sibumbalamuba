import { describe, it, expect } from "vitest";
import {
  registerPesertaDireksiSchema,
  verifyBerkasSchema,
  assistedRegisterSchema,
} from "@/lib/validations/seleksi.schema";

describe("registerPesertaDireksiSchema", () => {
  it("menerima bumdId uuid valid", () => {
    const result = registerPesertaDireksiSchema.safeParse({
      bumdId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });
});

describe("verifyBerkasSchema", () => {
  it("menolak status selain lolos/ditolak", () => {
    const result = verifyBerkasSchema.safeParse({
      berkasId: "123e4567-e89b-12d3-a456-426614174000",
      status: "pending",
    });
    expect(result.success).toBe(false);
  });

  it("menerima status lolos tanpa catatan (opsional)", () => {
    const result = verifyBerkasSchema.safeParse({
      berkasId: "123e4567-e89b-12d3-a456-426614174000",
      status: "lolos",
    });
    expect(result.success).toBe(true);
  });
});

describe("assistedRegisterSchema", () => {
  it("menolak jenisSeleksi 'direksi' — assisted-entry hanya untuk dewas/komisaris", () => {
    const result = assistedRegisterSchema.safeParse({
      targetUserId: "123e4567-e89b-12d3-a456-426614174000",
      jenisSeleksi: "direksi",
      bumdId: "123e4567-e89b-12d3-a456-426614174000",
      tokenUndangan: "TOKEN-ABCDEFGH",
    });
    expect(result.success).toBe(false);
  });

  it("menerima jenisSeleksi 'dewas' dengan token cukup panjang", () => {
    const result = assistedRegisterSchema.safeParse({
      targetUserId: "123e4567-e89b-12d3-a456-426614174000",
      jenisSeleksi: "dewas",
      bumdId: "123e4567-e89b-12d3-a456-426614174000",
      tokenUndangan: "TOKEN-ABCDEFGH",
    });
    expect(result.success).toBe(true);
  });

  it("menolak token undangan yang terlalu pendek", () => {
    const result = assistedRegisterSchema.safeParse({
      targetUserId: "123e4567-e89b-12d3-a456-426614174000",
      jenisSeleksi: "komisaris",
      bumdId: "123e4567-e89b-12d3-a456-426614174000",
      tokenUndangan: "abc",
    });
    expect(result.success).toBe(false);
  });
});
