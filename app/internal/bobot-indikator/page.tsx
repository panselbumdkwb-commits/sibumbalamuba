import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

export default async function BobotIndikatorPage() {
  await requireRole(["admin_bpsda", "super_admin"]);

  const supabase = await createClient();
  const { data: bobotList } = await supabase
    .from("konfigurasi_bobot")
    .select("id, jenis_entitas, nama_indikator, bobot, berlaku_sejak")
    .order("jenis_entitas")
    .order("nama_indikator");

  const bumdBobot = bobotList?.filter((b) => b.jenis_entitas === "bumd") ?? [];
  const bludBobot = bobotList?.filter((b) => b.jenis_entitas === "blud") ?? [];

  return (
    <main className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Bobot Indikator Evaluasi</h1>
        <p className="text-sm text-slate-500 mt-1">
          Bobot dipakai mesin penilaian evaluasi kinerja BUMD/BLUD. Total
          bobot per jenis entitas sebaiknya berjumlah 1.0 (100%).
        </p>
      </div>

      <BobotTable title="BUMD" items={bumdBobot} />
      <BobotTable title="BLUD" items={bludBobot} />
    </main>
  );
}

function BobotTable({
  title,
  items,
}: {
  title: string;
  items: { id: string; nama_indikator: string; bobot: number; berlaku_sejak: string }[];
}) {
  const total = items.reduce((sum, i) => sum + Number(i.bobot), 0);

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <p className="font-medium text-slate-900">{title}</p>
        <span
          className={`badge ${
            Math.abs(total - 1) < 0.001 ? "bg-accent-50 text-accent-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          Total {(total * 100).toFixed(0)}%
        </span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className="border-t border-slate-100">
              <td className="px-5 py-3 text-slate-700">{i.nama_indikator}</td>
              <td className="px-5 py-3 text-right font-medium text-slate-900">
                {(Number(i.bobot) * 100).toFixed(0)}%
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td className="px-5 py-4 text-slate-400" colSpan={2}>
                Belum ada indikator.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
