import { getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "../../_components/page-header";

const TAHUN_INI = new Date().getFullYear();

const KATEGORI_LABEL: Record<string, string> = {
  pelayanan: "Pelayanan",
  keuangan: "Keuangan",
  tata_kelola: "Tata Kelola",
  sdm: "SDM",
  pengembangan: "Pengembangan",
};

export default async function DashboardKinerjaBludPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login/internal");
  if (!["admin_blud", "admin_bpsda", "eksekutif", "super_admin"].includes(profile.role)) {
    redirect("/internal/dashboard");
  }

  const supabase = await createClient();
  const bludQuery = supabase.from("blud").select("id, nama");
  const { data: bludList } =
    profile.role === "admin_blud" && profile.entityId
      ? await bludQuery.eq("id", profile.entityId)
      : await bludQuery.order("nama");

  const bludIds = bludList?.map((b) => b.id) ?? [];
  const { data: capaianList } = bludIds.length
    ? await supabase
        .from("v_blud_capaian")
        .select("*")
        .in("blud_id", bludIds)
        .eq("tahun", TAHUN_INI)
        .eq("status_verifikasi", "disetujui")
    : { data: [] };

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="📊"
        color="bg-teal-50 text-teal-700"
        title="Dashboard Kinerja BLUD"
        description={`Capaian realisasi yang sudah disetujui OPD Pembina terhadap target KPI tahun ${TAHUN_INI}.`}
      />

      {bludList?.map((blud) => {
        const capaianBlud = capaianList?.filter((c) => c.blud_id === blud.id) ?? [];
        if (!capaianBlud.length) return null;

        // Ambil capaian terbaru per indikator (KPI bisa punya beberapa periode).
        const perIndikator = Object.values(
          capaianBlud.reduce<Record<string, (typeof capaianBlud)[number]>>((acc, c) => {
            if (!acc[c.blud_kpi_id] || c.nomor_periode > acc[c.blud_kpi_id].nomor_periode) {
              acc[c.blud_kpi_id] = c;
            }
            return acc;
          }, {})
        );

        return (
          <div key={blud.id} className="card p-5 flex flex-col gap-3">
            <p className="font-medium text-slate-900">{blud.nama}</p>
            {perIndikator.map((c) => {
              const capaian = Math.min(100, c.persentase_capaian ?? 0);
              return (
                <div key={c.realisasi_id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-700">
                      <span className="badge bg-slate-100 text-slate-500 mr-2 text-[10px]">
                        {KATEGORI_LABEL[c.kategori] ?? c.kategori}
                      </span>
                      {c.nama_indikator}
                    </span>
                    <span className="text-xs text-slate-400">
                      {c.nilai_realisasi} / {c.target_nilai} ({capaian}%)
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
        );
      })}

      {!capaianList?.length && (
        <p className="text-sm text-slate-400">
          Belum ada realisasi yang disetujui OPD Pembina untuk tahun {TAHUN_INI}.
        </p>
      )}
    </main>
  );
}
