import { getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "../../_components/page-header";
import TambahRisikoBludForm from "./tambah-risiko-blud-form";
import StatusRisikoBludSelect from "./status-risiko-blud-select";

const TAHUN_INI = new Date().getFullYear();

const KATEGORI_LABEL: Record<string, string> = {
  strategis: "Strategis",
  pelayanan: "Pelayanan",
  sdm: "SDM",
  keuangan: "Keuangan",
  teknologi_informasi: "Teknologi Informasi",
  hukum: "Hukum",
};

const TINGKAT_COLOR: Record<string, string> = {
  rendah: "bg-accent-50 text-accent-700",
  sedang: "bg-amber-50 text-amber-700",
  tinggi: "bg-red-50 text-red-600",
};

export default async function RisikoBludPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login/internal");
  if (!["admin_blud", "admin_bpsda", "eksekutif", "super_admin"].includes(profile.role)) {
    redirect("/internal/dashboard");
  }

  const canManage = profile.role !== "eksekutif";

  const supabase = await createClient();
  const bludQuery = supabase.from("blud").select("id, nama");
  const { data: bludList } =
    profile.role === "admin_blud" && profile.entityId
      ? await bludQuery.eq("id", profile.entityId)
      : await bludQuery.order("nama");

  const bludIds = bludList?.map((b) => b.id) ?? [];
  const { data: risikoList } = bludIds.length
    ? await supabase
        .from("blud_risiko")
        .select("*")
        .in("blud_id", bludIds)
        .eq("tahun", TAHUN_INI)
        .order("tingkat", { ascending: false })
    : { data: [] };

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="⚠️"
        color="bg-red-50 text-red-700"
        title="Manajemen Risiko Pelayanan BLUD"
        description={`Registrasi risiko dan tindak lanjut mitigasi tahun ${TAHUN_INI}.`}
      />

      {bludList?.map((blud) => {
        const risikoBlud = risikoList?.filter((r) => r.blud_id === blud.id) ?? [];
        return (
          <div key={blud.id} className="card p-5 flex flex-col gap-3">
            <p className="font-medium text-slate-900">{blud.nama}</p>

            {risikoBlud.map((r) => (
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
                    <StatusRisikoBludSelect risikoId={r.id} statusSaatIni={r.status} />
                  ) : (
                    <span className="badge bg-slate-100 text-slate-500 shrink-0">{r.status}</span>
                  )}
                </div>
              </div>
            ))}

            {!risikoBlud.length && (
              <p className="text-sm text-slate-400">Belum ada risiko tercatat tahun ini.</p>
            )}

            {canManage && <TambahRisikoBludForm bludId={blud.id} tahun={TAHUN_INI} />}
          </div>
        );
      })}

      {!bludList?.length && (
        <p className="text-sm text-slate-400">Belum ada entitas BLUD yang terhubung ke akun Anda.</p>
      )}
    </main>
  );
}
