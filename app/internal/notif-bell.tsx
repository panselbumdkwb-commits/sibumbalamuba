import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * Notifikasi untuk super_admin: jumlah pembaruan data dalam 24 jam
 * terakhir (dari audit_log, yang sejak migration 0014 terisi otomatis
 * lewat trigger database setiap ada insert/update data Monev — bukan
 * cuma dari log manual). Klik untuk lihat detail lengkap di Audit Log.
 *
 * Catatan: ini notifikasi "tarik saat buka halaman" (dihitung ulang
 * setiap request), bukan push real-time. Untuk push real-time,
 * langkah lanjutannya memakai Supabase Realtime — lihat README.
 */
export default async function NotifBell() {
  const supabase = await createClient();
  const dua24JamLalu = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("audit_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", dua24JamLalu);

  const jumlah = count ?? 0;

  return (
    <Link href="/internal/audit-log" className="relative text-slate-500 hover:text-slate-800" title="Pembaruan data 24 jam terakhir">
      <span className="text-lg">🔔</span>
      {jumlah > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
          {jumlah > 99 ? "99+" : jumlah}
        </span>
      )}
    </Link>
  );
}
