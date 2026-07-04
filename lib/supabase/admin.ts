import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Client dengan SERVICE ROLE KEY — bisa membuat/menghapus akun Supabase
 * Auth dan MELEWATI RLS sepenuhnya. HANYA boleh dipakai di:
 * - Server Actions yang sudah lolos requireRole(['super_admin'])
 * - TIDAK PERNAH diimpor dari Client Component ('use client')
 *
 * Import "server-only" di baris pertama akan membuat build GAGAL kalau
 * file ini sampai ter-bundle ke kode client — pengaman tambahan supaya
 * SUPABASE_SERVICE_ROLE_KEY tidak pernah bocor ke browser.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum diisi di environment variables. " +
        "Ambil dari Supabase Dashboard > Project Settings > API > service_role key. " +
        "JANGAN pernah beri prefix NEXT_PUBLIC_ pada variabel ini."
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
