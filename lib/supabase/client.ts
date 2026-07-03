import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Supabase client untuk digunakan di Client Components.
 * Tidak pernah memuat service_role key — hanya anon key publik.
 *
 * Setelah project riil terhubung ke Supabase, regenerasi types/database.types.ts
 * dengan `supabase gen types typescript` dan bandingkan dengan versi manual ini.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
