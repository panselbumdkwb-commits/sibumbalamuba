import { getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "../../_components/page-header";
import RealisasiForm from "./realisasi-form";
import VerifyRealisasiButton from "./verify-realisasi-button";
import { dalamJendelaInputMonev, tanggalHariIniWib } from "@/lib/monev-window";

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

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu Tanggapan",
  perlu_perbaikan: "Perlu Perbaikan",
  terverifikasi: "Terverifikasi",
  ditolak: "Ditolak",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-slate-100 text-slate-500",
  perlu_perbaikan: "bg-amber-50 text-amber-700",
  terverifikasi: "bg-accent-50 text-accent-700",
  ditolak: "bg-red-50 text-red-600",
};

export default async function MonitoringBumdPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login/internal");
  if (!["admin_bumd", "admin_bpsda", "eksekutif", "super_admin"].includes(profile.role)) {
    redirect("/internal/dashboard");
  }

  const canInputRole = profile.role === "admin_bumd" || profile.role === "super_admin";
  const jendelaTerbuka = profile.role === "super_admin" || dalamJendelaInputMonev();
  const canInput = canInputRole && jendelaTerbuka;
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
        title="Monitoring Realisasi Kinerja BUMD"
        description={`Lapor & tanggapi realisasi terhadap target KPI tahun ${TAHUN_INI}. Admin BPSDA bisa menyetujui, meminta perbaikan, atau menolak disertai analisa tertulis.`}
      />

      {profile.role === "admin_bumd" && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            jendelaTerbuka
              ? "border-accent-200 bg-accent-50 text-accent-800"
              : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          {jendelaTerbuka ? (
            <>
              Input data Monev sedang <span className="font-medium">dibuka</span> (tanggal {tanggalHariIniWib()},
              jendela tanggal 1–10 tiap bulan WIB).
            </>
          ) : (
            <>
              Input data Monev <span className="font-medium">ditutup</span> untuk bulan ini — hanya dibuka tanggal
              1–10 setiap bulan (WIB). Sekarang tanggal {tanggalHariIniWib()}. Hubungi Super Admin kalau ada kondisi
              mendesak.
            </>
          )}
        </div>
      )}

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
                  <div className="flex flex-col gap-3 mt-2">
                    {realisasi.map((r) => (
                      <div key={r.id} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                          <span className="text-slate-600">{PERIODE_LABEL[r.periode] ?? r.periode}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{r.nilai_realisasi}</span>
                            <span className={`badge ${STATUS_COLOR[r.status_verifikasi] ?? "bg-slate-100 text-slate-500"}`}>
                              {STATUS_LABEL[r.status_verifikasi] ?? r.status_verifikasi}
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
                            <span className="font-medium">Tanggapan Admin BPSDA:</span> {r.catatan_verifikasi}
                          </p>
                        )}
                        {canVerify && r.status_verifikasi !== "terverifikasi" && (
                          <div className="mt-2">
                            <VerifyRealisasiButton realisasiId={r.id} />
                          </div>
                        )}
                      </div>
                    ))}
                    {!realisasi.length && <p className="text-xs text-slate-400">Belum ada laporan realisasi.</p>}
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
