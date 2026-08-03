import { getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "../../_components/page-header";
import TambahRisikoForm from "./tambah-risiko-form";
import StatusRisikoSelect from "./status-risiko-select";

const TAHUN_INI = new Date().getFullYear();

const KATEGORI_LABEL: Record<string, string> = {
  strategis: "Strategis",
  keuangan: "Keuangan",
  operasional: "Operasional",
  sdm: "SDM",
  hukum: "Hukum",
  reputasi: "Reputasi",
};

const TINGKAT_COLOR: Record<string, string> = {
  rendah: "bg-accent-50 text-accent-700",
  sedang: "bg-amber-50 text-amber-700",
  tinggi: "bg-red-50 text-red-600",
};

export default async function RisikoBumdPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login/internal");
  if (!["admin_bumd", "admin_bpsda", "eksekutif", "super_admin"].includes(profile.role)) {
    redirect("/internal/dashboard");
  }

  const canManage = profile.role !== "eksekutif";

  const supabase = await createClient();
  const bumdQuery = supabase.from("bumd").select("id, nama");
  const { data: bumdList } =
    profile.role === "admin_bumd" && profile.entityId
      ? await bumdQuery.eq("id", profile.entityId)
      : await bumdQuery.order("nama");

  const bumdIds = bumdList?.map((b) => b.id) ?? [];
  const { data: risikoList } = bumdIds.length
    ? await supabase
        .from("bumd_risiko")
        .select("*")
        .in("bumd_id", bumdIds)
        .eq("tahun", TAHUN_INI)
        .order("tingkat", { ascending: false })
    : { data: [] };

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="⚠️"
        color="bg-red-50 text-red-700"
        title="Manajemen Risiko BUMD"
        description={`Registrasi risiko dan tindak lanjut mitigasi tahun ${TAHUN_INI}.`}
      />

      {bumdList?.map((bumd) => {
        const risikoBumd = risikoList?.filter((r) => r.bumd_id === bumd.id) ?? [];
        return (
          <div key={bumd.id} className="card p-5 flex flex-col gap-3">
            <p className="font-medium text-slate-900">{bumd.nama}</p>

            {risikoBumd.map((r) => (
              <div key={r.id} className="border-t border-slate-100 pt-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="badge bg-slate-100 text-slate-500 mr-2 text-[10px]">
                      {KATEGORI_LABEL[r.kategori] ?? r.kategori}
                    </span>
                    <span className={`badge ${TINGKAT_COLOR[r.tingkat]}`}>{r.tingkat}</span>
                    <p className="text-sm text-slate-700 mt-1.5">{r.deskripsi}</p>
                    {r.mitigasi && <p className="text-xs text-slate-500 mt-1">Mitigasi: {r.mitigasi}</p>}
                  </div>
                  {canManage ? (
                    <StatusRisikoSelect risikoId={r.id} statusSaatIni={r.status} />
                  ) : (
                    <span className="badge bg-slate-100 text-slate-500 shrink-0">{r.status}</span>
                  )}
                </div>
              </div>
            ))}

            {!risikoBumd.length && (
              <p className="text-sm text-slate-400">Belum ada risiko tercatat tahun ini.</p>
            )}

            {canManage && <TambahRisikoForm bumdId={bumd.id} tahun={TAHUN_INI} />}
          </div>
        );
      })}

      {!bumdList?.length && (
        <p className="text-sm text-slate-400">Belum ada entitas BUMD yang terhubung ke akun Anda.</p>
      )}
    </main>
  );
}
