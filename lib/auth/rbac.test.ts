import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase server client SEBELUM import rbac, agar tidak
// menyentuh next/headers (yang butuh request context asli).
const mockGetUser = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockSingle,
        }),
      }),
    }),
  })),
}));

import { requireRole, getSessionProfile } from "@/lib/auth/rbac";

describe("requireRole — segregation of duties (FR-17a)", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockSingle.mockReset();
  });

  it("melempar UNAUTHENTICATED jika tidak ada sesi", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    await expect(requireRole(["tim_ukk"])).rejects.toThrow("UNAUTHENTICATED");
  });

  it("mengizinkan tim_ukk memanggil action yang diperuntukkan tim_ukk", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockSingle.mockResolvedValue({
      data: { id: "user-1", role: "tim_ukk", entity_id: null },
    });

    const profile = await requireRole(["tim_ukk", "super_admin"]);
    expect(profile.role).toBe("tim_ukk");
  });

  it("MENOLAK panitia_seleksi mengakses action khusus nilai UKK — ini test kritis", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-2" } } });
    mockSingle.mockResolvedValue({
      data: { id: "user-2", role: "panitia_seleksi", entity_id: null },
    });

    await expect(requireRole(["tim_ukk"])).rejects.toThrow("FORBIDDEN");
  });

  it("getSessionProfile mengembalikan null jika profil tidak ditemukan", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-3" } } });
    mockSingle.mockResolvedValue({ data: null });

    const profile = await getSessionProfile();
    expect(profile).toBeNull();
  });
});
