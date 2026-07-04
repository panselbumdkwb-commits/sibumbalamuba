import { getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "../../_components/page-header";

const TAHUN_INI = new Date().getFullYear();

const KATEGORI_LABEL: Record<string, string> = {
  keuangan: "Keuangan",
  operasional: "Operasional",
  pelayanan: "Pelayanan",
  tata_kelola: "Tata Kelola",
  kontribusi_daerah: "Kontribusi Daerah",
};

export default async function DashboardKinerjaBumdPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login/internal");
  if (!["admin_bumd", "admin_bpsda", "eksekutif", "super_admin"].includes(profile.role)) {
    redirect("/internal/dashboard");
  }

  const supabase = await createClient();
  const bumdQuery = supabase.from("bumd").select("id, nama");
  const { data: bumdList } =
    profile.role === "admin_bumd" && profile.entityId
      ? await bumdQuery.eq("id", profile.entityId)
      : await bumdQuery.order("nama");

  const bumdIds = bumdList?.map((b) => b.id) ?? [];
  const { data: kpiList } = bumdIds.length
    ? await supabase.from("bumd_kpi").select("*").in("bumd_id", bumdIds).eq("tahun", TAHUN_INI)
    : { data: [] };

  const kpiIds = kpiList?.map((k) => k.id) ?? [];
  const { data: realisasiList } = kpiIds.length
    ? await supabase
        .from("bumd_realisasi")
        .select("*")
        .in("bumd_kpi_id", kpiIds)
        .eq("status_verifikasi", "terverifikasi")
    : { data: [] };

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="📊"
        color="bg-teal-50 text-teal-700"
        title="Dashboard Kinerja BUMD"
        description={`Capaian realisasi terverifikasi terhadap target KPI tahun ${TAHUN_INI}.`}
      />

      {bumdList?.map((bumd) => {
        const kpis = kpiList?.filter((k) => k.bumd_id === bumd.id) ?? [];
        if (!kpis.length) return null;

        return (
          <div key={bumd.id} className="card p-5 flex flex-col gap-4">
            <p className="font-medium text-slate-900">{bumd.nama}</p>
            <div className="flex flex-col gap-3">
              {kpis.map((k) => {
                const realisasiTerbaru = realisasiList
                  ?.filter((r) => r.bumd_kpi_id === k.id)
                  .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
                const capaian = realisasiTerbaru
                  ? Math.min(100, Math.round((realisasiTerbaru.nilai_realisasi / k.target_nilai) * 100))
                  : 0;

                return (
                  <div key={k.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-700">
                        <span className="badge bg-slate-100 text-slate-500 mr-2 text-[10px]">
                          {KATEGORI_LABEL[k.kategori] ?? k.kategori}
                        </span>
                        {k.nama_indikator}
                      </span>
                      <span className="text-xs text-slate-400">
                        {realisasiTerbaru ? `${realisasiTerbaru.nilai_realisasi} / ${k.target_nilai} ${k.satuan ?? ""}` : "Belum ada data"}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          capaian >= 100 ? "bg-accent-500" : capaian >= 60 ? "bg-brand-500" : "bg-red-400"
                        }`}
                        style={{ width: `${capaian}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {!kpiList?.length && (
        <p className="text-sm text-slate-400">Belum ada data KPI tahun {TAHUN_INI}.</p>
      )}
    </main>
  );
}
