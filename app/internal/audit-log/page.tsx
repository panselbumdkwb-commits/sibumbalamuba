import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "../_components/page-header";

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
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="🛡️"
        color="bg-slate-100 text-slate-700"
        title="Audit Log"
        description="100 aksi sensitif terbaru (assisted-entry, finalisasi nilai UKK, tanda tangan surat, dll). Log ini bersifat append-only — tidak ada baris yang bisa dihapus atau diubah."
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Waktu</th>
              <th className="px-4 py-2.5">Aksi</th>
              <th className="px-4 py-2.5">Tabel</th>
              <th className="px-4 py-2.5">ID Record</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((log) => (
              <tr key={log.id} className="border-t border-slate-100">
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-3">{log.aksi}</td>
                <td className="px-4 py-3">{log.tabel_terkait ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{log.record_id ?? "—"}</td>
              </tr>
            ))}
            {!logs?.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
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
