import { getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "../../_components/page-header";
import RenstraRbaForm from "./renstra-rba-form";
import KpiBludForm from "./kpi-blud-form";

const KATEGORI_LABEL: Record<string, string> = {
  pelayanan: "Pelayanan",
  keuangan: "Keuangan",
  tata_kelola: "Tata Kelola",
  sdm: "SDM",
  pengembangan: "Pengembangan",
};

const TAHUN_INI = new Date().getFullYear();

export default async function PerencanaanBludPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login/internal");
  if (!["admin_blud", "admin_bpsda", "eksekutif", "super_admin"].includes(profile.role)) {
    redirect("/internal/dashboard");
  }

  const canSetTarget = profile.role === "admin_bpsda" || profile.role === "super_admin";

  const supabase = await createClient();
  const bludQuery = supabase.from("blud").select("id, nama");
  const { data: bludList } =
    profile.role === "admin_blud" && profile.entityId
      ? await bludQuery.eq("id", profile.entityId)
      : await bludQuery.order("nama");

  const bludIds = bludList?.map((b) => b.id) ?? [];

  const [{ data: renstraList }, { data: kpiList }] = await Promise.all([
    bludIds.length
      ? supabase.from("blud_renstra_rba").select("*").in("blud_id", bludIds).eq("tahun", TAHUN_INI)
      : Promise.resolve({ data: [] }),
    bludIds.length
      ? supabase.from("blud_kpi").select("*").in("blud_id", bludIds).eq("tahun", TAHUN_INI)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="🎯"
        color="bg-cyan-50 text-cyan-700"
        title="Perencanaan Kinerja BLUD"
        description={`Renstra Bisnis, RBA, dan target KPI/IKU tahun ${TAHUN_INI}. ${
          canSetTarget ? "Anda berwenang menetapkan target (OPD Pembina)." : "Target ditetapkan oleh Admin BPSDA."
        }`}
      />

      {bludList?.map((blud) => {
        const renstra = renstraList?.find((r) => r.blud_id === blud.id);
        const kpis = kpiList?.filter((k) => k.blud_id === blud.id) ?? [];

        return (
          <div key={blud.id} className="card p-5 flex flex-col gap-4">
            <p className="font-medium text-slate-900">{blud.nama}</p>

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                RBA {TAHUN_INI}
              </p>
              {canSetTarget ? (
                <RenstraRbaForm bludId={blud.id} tahun={TAHUN_INI} existing={renstra ?? null} />
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Metric label="Target Pendapatan" value={renstra?.target_pendapatan} />
                  <Metric label="Target Belanja" value={renstra?.target_belanja} />
                </div>
              )}
              {renstra?.ringkasan_target_layanan && (
                <p className="text-xs text-slate-500 mt-2">{renstra.ringkasan_target_layanan}</p>
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
              {canSetTarget && <KpiBludForm bludId={blud.id} tahun={TAHUN_INI} />}
            </div>
          </div>
        );
      })}

      {!bludList?.length && (
        <p className="text-sm text-slate-400">Belum ada entitas BLUD yang terhubung ke akun Anda.</p>
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
