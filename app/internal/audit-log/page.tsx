import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

/**
 * FR terkait audit: hanya super_admin yang boleh melihat seluruh log
 * (RLS "audit_log_select_super_admin_full"). requireRole() di sini adalah
 * lapisan kedua (UX + defense in depth) — RLS tetap penjaga utama.
 */
export default async function AuditLogPage() {
  await requireRole(["super_admin"]);

  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_log")
    .select("id, aksi, tabel_terkait, record_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-4">
      <h1 className="text-xl font-medium">Audit Log</h1>
      <p className="text-sm text-gray-500">
        100 aksi sensitif terbaru (assisted-entry, finalisasi nilai UKK, dll).
        Log ini bersifat append-only — tidak ada baris yang bisa dihapus atau
        diubah.
      </p>

      <div
        className="border rounded-lg overflow-hidden"
        style={{ borderColor: "var(--color-border)" }}
      >
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Waktu</th>
              <th className="px-4 py-2">Aksi</th>
              <th className="px-4 py-2">Tabel</th>
              <th className="px-4 py-2">ID Record</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((log) => (
              <tr key={log.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                <td className="px-4 py-2 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-2">{log.aksi}</td>
                <td className="px-4 py-2">{log.tabel_terkait ?? "—"}</td>
                <td className="px-4 py-2 text-xs text-gray-400">{log.record_id ?? "—"}</td>
              </tr>
            ))}
            {!logs?.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Belum ada aksi tercatat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
