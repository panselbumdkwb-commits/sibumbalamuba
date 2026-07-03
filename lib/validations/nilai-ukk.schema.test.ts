import { describe, it, expect } from "vitest";
import { inputNilaiSchema, submitFinalSchema } from "@/lib/validations/nilai-ukk.schema";

describe("inputNilaiSchema", () => {
  it("menerima input valid", () => {
    const result = inputNilaiSchema.safeParse({
      pesertaId: "123e4567-e89b-12d3-a456-426614174000",
      tahap: "ukk",
      skor: 85,
    });
    expect(result.success).toBe(true);
  });

  it("menolak skor di luar rentang 0-100", () => {
    const result = inputNilaiSchema.safeParse({
      pesertaId: "123e4567-e89b-12d3-a456-426614174000",
      tahap: "ukk",
      skor: 150,
    });
    expect(result.success).toBe(false);
  });

  it("menolak tahap yang tidak dikenal", () => {
    const result = inputNilaiSchema.safeParse({
      pesertaId: "123e4567-e89b-12d3-a456-426614174000",
      tahap: "tahap_tidak_ada",
      skor: 80,
    });
    expect(result.success).toBe(false);
  });

  it("menolak pesertaId yang bukan uuid", () => {
    const result = inputNilaiSchema.safeParse({
      pesertaId: "bukan-uuid",
      tahap: "ukk",
      skor: 80,
    });
    expect(result.success).toBe(false);
  });
});

describe("submitFinalSchema", () => {
  it("menerima nilaiId uuid valid", () => {
    const result = submitFinalSchema.safeParse({
      nilaiId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });

  it("menolak nilaiId kosong", () => {
    const result = submitFinalSchema.safeParse({ nilaiId: "" });
    expect(result.success).toBe(false);
  });
});
