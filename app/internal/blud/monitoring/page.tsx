import { getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "../../_components/page-header";
import RealisasiBludForm from "./realisasi-blud-form";
import VerifikasiBludPanel from "./verifikasi-blud-panel";

const TAHUN_INI = new Date().getFullYear();

const PERIODE_LABEL: Record<string, (n: number) => string> = {
  bulanan: (n) => `Bulan ${n}`,
  triwulanan: (n) => `Triwulan ${n}`,
  semester: (n) => `Semester ${n}`,
  tahunan: () => "Tahunan",
};

const STATUS_COLOR: Record<string, string> = {
  belum_diverifikasi: "bg-slate-100 text-slate-500",
  perlu_perbaikan: "bg-amber-50 text-amber-700",
  disetujui: "bg-accent-50 text-accent-700",
};

const STATUS_LABEL: Record<string, string> = {
  belum_diverifikasi: "Belum Diverifikasi",
  perlu_perbaikan: "Perlu Perbaikan",
  disetujui: "Disetujui",
};

export default async function MonitoringBludPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login/internal");
  if (!["admin_blud", "admin_bpsda", "eksekutif", "super_admin"].includes(profile.role)) {
    redirect("/internal/dashboard");
  }

  const canInput = profile.role === "admin_blud" || profile.role === "super_admin";
  const canVerify = profile.role === "admin_bpsda" || profile.role === "super_admin";

  const supabase = await createClient();
  const bludQuery = supabase.from("blud").select("id, nama");
  const { data: bludList } =
    profile.role === "admin_blud" && profile.entityId
      ? await bludQuery.eq("id", profile.entityId)
      : await bludQuery.order("nama");

  const bludIds = bludList?.map((b) => b.id) ?? [];
  const { data: kpiList } = bludIds.length
    ? await supabase.from("blud_kpi").select("*").in("blud_id", bludIds).eq("tahun", TAHUN_INI)
    : { data: [] };

  const kpiIds = kpiList?.map((k) => k.id) ?? [];
  const { data: realisasiList } = kpiIds.length
    ? await supabase.from("blud_realisasi").select("*").in("blud_kpi_id", kpiIds).order("created_at", { ascending: false })
    : { data: [] };

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="📈"
        color="bg-emerald-50 text-emerald-700"
        title="Monitoring Realisasi Kinerja BLUD"
        description={`Lapor & verifikasi realisasi terhadap target KPI tahun ${TAHUN_INI}. Setiap laporan wajib memuat analisis penyebab dan rencana tindak lanjut.`}
      />

      {bludList?.map((blud) => {
        const kpis = kpiList?.filter((k) => k.blud_id === blud.id) ?? [];
        if (!kpis.length) return null;

        return (
          <div key={blud.id} className="card p-5 flex flex-col gap-4">
            <p className="font-medium text-slate-900">{blud.nama}</p>
            {kpis.map((k) => {
              const realisasi = realisasiList?.filter((r) => r.blud_kpi_id === k.id) ?? [];
              return (
                <div key={k.id} className="border-t border-slate-100 pt-3">
                  <p className="text-sm font-medium text-slate-700">
                    {k.nama_indikator}{" "}
                    <span className="text-xs text-slate-400 font-normal">
                      (target {k.target_nilai} {k.satuan ?? ""})
                    </span>
                  </p>
                  <div className="flex flex-col gap-3 mt-2">
                    {realisasi.map((r) => (
                      <div key={r.id} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">
                            {PERIODE_LABEL[r.jenis_periode]?.(r.nomor_periode) ?? r.jenis_periode} {r.tahun}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{r.nilai_realisasi}</span>
                            <span className={`badge ${STATUS_COLOR[r.status_verifikasi]}`}>
                              {STATUS_LABEL[r.status_verifikasi]}
                            </span>
                          </div>
                        </div>
                        {r.analisis_penyebab && (
                          <p className="text-xs text-slate-500 mt-1.5">
                            <span className="font-medium">Analisis:</span> {r.analisis_penyebab}
                          </p>
                        )}
                        {r.rencana_tindak_lanjut && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            <span className="font-medium">Rencana tindak lanjut:</span> {r.rencana_tindak_lanjut}
                          </p>
                        )}
                        {r.catatan_verifikasi && (
                          <p className="text-xs text-amber-700 mt-1">
                            <span className="font-medium">Catatan OPD Pembina:</span> {r.catatan_verifikasi}
                          </p>
                        )}
                        {canVerify && r.status_verifikasi !== "disetujui" && (
                          <VerifikasiBludPanel realisasiId={r.id} />
                        )}
                      </div>
                    ))}
                    {!realisasi.length && <p className="text-xs text-slate-400">Belum ada laporan realisasi.</p>}
                  </div>
                  {canInput && <RealisasiBludForm bludKpiId={k.id} tahunBerjalan={TAHUN_INI} />}
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
