import { getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "../../_components/page-header";
import RealisasiForm from "./realisasi-form";
import VerifyRealisasiButton from "./verify-realisasi-button";

const TAHUN_INI = new Date().getFullYear();

const PERIODE_LABEL: Record<string, string> = {
  triwulan_1: "Triwulan I",
  triwulan_2: "Triwulan II",
  triwulan_3: "Triwulan III",
  triwulan_4: "Triwulan IV",
  semester_1: "Semester I",
  semester_2: "Semester II",
  tahunan: "Tahunan",
};

export default async function MonitoringBumdPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login/internal");
  if (!["admin_bumd", "admin_bpsda", "eksekutif", "super_admin"].includes(profile.role)) {
    redirect("/internal/dashboard");
  }

  const canInput = profile.role === "admin_bumd" || profile.role === "super_admin";
  const canVerify = profile.role === "admin_bpsda" || profile.role === "super_admin";

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
    ? await supabase.from("bumd_realisasi").select("*").in("bumd_kpi_id", kpiIds)
    : { data: [] };

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="📈"
        color="bg-emerald-50 text-emerald-700"
        title="Monitoring Realisasi Kinerja"
        description={`Lapor & verifikasi realisasi terhadap target KPI tahun ${TAHUN_INI}.`}
      />

      {bumdList?.map((bumd) => {
        const kpis = kpiList?.filter((k) => k.bumd_id === bumd.id) ?? [];
        if (!kpis.length) return null;

        return (
          <div key={bumd.id} className="card p-5 flex flex-col gap-4">
            <p className="font-medium text-slate-900">{bumd.nama}</p>
            {kpis.map((k) => {
              const realisasi = realisasiList?.filter((r) => r.bumd_kpi_id === k.id) ?? [];
              return (
                <div key={k.id} className="border-t border-slate-100 pt-3">
                  <p className="text-sm font-medium text-slate-700">
                    {k.nama_indikator}{" "}
                    <span className="text-xs text-slate-400 font-normal">
                      (target {k.target_nilai} {k.satuan ?? ""})
                    </span>
                  </p>
                  <div className="flex flex-col gap-1.5 mt-2">
                    {realisasi.map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{PERIODE_LABEL[r.periode] ?? r.periode}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{r.nilai_realisasi}</span>
                          {r.status_verifikasi === "pending" && canVerify ? (
                            <VerifyRealisasiButton realisasiId={r.id} />
                          ) : (
                            <span
                              className={`badge ${
                                r.status_verifikasi === "terverifikasi"
                                  ? "bg-accent-50 text-accent-700"
                                  : r.status_verifikasi === "ditolak"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {r.status_verifikasi === "pending" ? "Menunggu" : r.status_verifikasi}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {canInput && <RealisasiForm bumdKpiId={k.id} />}
                </div>
              );
            })}
          </div>
        );
      })}

      {!kpiList?.length && (
        <p className="text-sm text-slate-400">
          Belum ada target KPI tahun {TAHUN_INI}. Target ditetapkan lewat halaman Perencanaan Kinerja.
        </p>
      )}
    </main>
  );
}
