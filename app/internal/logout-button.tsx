"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    const loginPath = pathname?.startsWith("/peserta") ? "/login/peserta" : "/login/internal";
    router.push(loginPath);
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
    >
      Keluar
    </button>
  );
}
