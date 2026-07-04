import { getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "../../_components/page-header";
import RkapForm from "./rkap-form";
import KpiForm from "./kpi-form";

const KATEGORI_LABEL: Record<string, string> = {
  keuangan: "Keuangan",
  operasional: "Operasional",
  pelayanan: "Pelayanan",
  tata_kelola: "Tata Kelola",
  kontribusi_daerah: "Kontribusi Daerah",
};

const TAHUN_INI = new Date().getFullYear();

export default async function PerencanaanBumdPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login/internal");
  if (!["admin_bumd", "admin_bpsda", "eksekutif", "super_admin"].includes(profile.role)) {
    redirect("/internal/dashboard");
  }

  const canSetTarget = profile.role === "admin_bpsda" || profile.role === "super_admin";

  const supabase = await createClient();
  const bumdQuery = supabase.from("bumd").select("id, nama");
  const { data: bumdList } =
    profile.role === "admin_bumd" && profile.entityId
      ? await bumdQuery.eq("id", profile.entityId)
      : await bumdQuery.order("nama");

  const bumdIds = bumdList?.map((b) => b.id) ?? [];

  const [{ data: rkapList }, { data: kpiList }] = await Promise.all([
    bumdIds.length
      ? supabase.from("bumd_rkap").select("*").in("bumd_id", bumdIds).eq("tahun", TAHUN_INI)
      : Promise.resolve({ data: [] }),
    bumdIds.length
      ? supabase.from("bumd_kpi").select("*").in("bumd_id", bumdIds).eq("tahun", TAHUN_INI)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="🎯"
        color="bg-primary-50 text-primary-700"
        title="Perencanaan Kinerja BUMD"
        description={`Target RKAP dan indikator kinerja (KPI/IKU) tahun ${TAHUN_INI}. ${
          canSetTarget ? "Anda berwenang menetapkan target." : "Target ditetapkan oleh Admin BPSDA."
        }`}
      />

      {bumdList?.map((bumd) => {
        const rkap = rkapList?.find((r) => r.bumd_id === bumd.id);
        const kpis = kpiList?.filter((k) => k.bumd_id === bumd.id) ?? [];

        return (
          <div key={bumd.id} className="card p-5 flex flex-col gap-4">
            <p className="font-medium text-slate-900">{bumd.nama}</p>

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                RKAP {TAHUN_INI}
              </p>
              {canSetTarget ? (
                <RkapForm bumdId={bumd.id} tahun={TAHUN_INI} existing={rkap ?? null} />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <Metric label="Pendapatan" value={rkap?.target_pendapatan} />
                  <Metric label="Laba" value={rkap?.target_laba} />
                  <Metric label="Dividen" value={rkap?.target_dividen} />
                  <Metric label="Investasi" value={rkap?.target_investasi} />
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Target KPI/IKU {TAHUN_INI}
              </p>
              <div className="flex flex-col gap-1.5">
                {kpis.map((k) => (
                  <div key={k.id} className="flex items-center justify-between text-sm border-b border-slate-50 pb-1.5">
                    <div>
                      <span className="badge bg-slate-100 text-slate-500 mr-2">
                        {KATEGORI_LABEL[k.kategori] ?? k.kategori}
                      </span>
                      {k.nama_indikator}
                    </div>
                    <span className="font-medium text-slate-900">
                      {k.target_nilai} {k.satuan ?? ""}
                    </span>
                  </div>
                ))}
                {!kpis.length && <p className="text-sm text-slate-400">Belum ada target KPI.</p>}
              </div>
              {canSetTarget && <KpiForm bumdId={bumd.id} tahun={TAHUN_INI} />}
            </div>
          </div>
        );
      })}

      {!bumdList?.length && (
        <p className="text-sm text-slate-400">Belum ada entitas BUMD yang terhubung ke akun Anda.</p>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div>
      <p className="text-slate-400 text-xs">{label}</p>
      <p className="font-medium text-slate-900">
        {value != null ? new Intl.NumberFormat("id-ID").format(value) : "—"}
      </p>
    </div>
  );
}
