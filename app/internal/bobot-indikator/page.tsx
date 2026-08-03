import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import BobotForm from "./bobot-form";

const LABEL_BUMD: Record<string, string> = {
  keuangan: "Keuangan",
  operasional: "Operasional",
  pelayanan: "Pelayanan",
  tata_kelola: "Tata Kelola",
  kontribusi_daerah: "Kontribusi Daerah",
};

const LABEL_BLUD: Record<string, string> = {
  pelayanan: "Pelayanan",
  keuangan: "Keuangan",
  tata_kelola: "Tata Kelola",
  sdm: "SDM",
  pengembangan: "Pengembangan",
};

export default async function BobotIndikatorPage() {
  const profile = await requireRole(["admin_bpsda", "eksekutif"]);
  const canEdit = profile.role === "admin_bpsda";

  const supabase = await createClient();
  const { data: bobotList } = await supabase
    .from("konfigurasi_bobot")
    .select("id, jenis_entitas, nama_indikator, bobot, berlaku_sejak, aktif")
    .order("jenis_entitas")
    .order("nama_indikator");

  // Hanya baris aktif yang dihitung ke total & dipakai scoring engine
  // (migration 0025) — baris arsip tetap ditampilkan terpisah supaya
  // riwayat tidak hilang, tapi jelas tidak ikut dijumlah.
  const aktif = bobotList?.filter((b) => b.aktif) ?? [];
  const arsip = bobotList?.filter((b) => !b.aktif) ?? [];

  const bumdAktif = aktif.filter((b) => b.jenis_entitas === "bumd");
  const bludAktif = aktif.filter((b) => b.jenis_entitas === "blud");

  return (
    <main className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Bobot Indikator Evaluasi</h1>
        <p className="text-sm text-slate-500 mt-1">
          Bobot dipakai mesin penilaian evaluasi kinerja BUMD/BLUD. Total bobot per jenis entitas selalu 100%
          {canEdit ? " — ubah persentase di bawah lalu simpan (sistem menolak simpan kalau totalnya bukan 100%)." : "; hubungi admin_bpsda untuk perubahan."}
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="font-medium text-slate-900">BUMD</p>
        </div>
        {bumdAktif.length ? (
          <BobotForm
            jenisEntitas="bumd"
            canEdit={canEdit}
            items={bumdAktif.map((i) => ({
              id: i.id,
              bobot: Number(i.bobot),
              label: LABEL_BUMD[i.nama_indikator] ?? i.nama_indikator,
            }))}
          />
        ) : (
          <p className="px-5 py-4 text-sm text-slate-400">Belum ada indikator aktif.</p>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="font-medium text-slate-900">BLUD</p>
        </div>
        {bludAktif.length ? (
          <BobotForm
            jenisEntitas="blud"
            canEdit={canEdit}
            items={bludAktif.map((i) => ({
              id: i.id,
              bobot: Number(i.bobot),
              label: LABEL_BLUD[i.nama_indikator] ?? i.nama_indikator,
            }))}
          />
        ) : (
          <p className="px-5 py-4 text-sm text-slate-400">Belum ada indikator aktif.</p>
        )}
      </div>

      {arsip.length > 0 && (
        <details className="card overflow-hidden">
          <summary className="px-5 py-3 cursor-pointer text-sm text-slate-500 select-none">
            Riwayat / Arsip ({arsip.length}) — tidak dihitung ke total maupun skor kesehatan
          </summary>
          <table className="w-full text-sm">
            <tbody>
              {arsip.map((i) => (
                <tr key={i.id} className="border-t border-slate-100 text-slate-400">
                  <td className="px-5 py-2">
                    {i.jenis_entitas.toUpperCase()} · {i.nama_indikator}
                  </td>
                  <td className="px-5 py-2 text-right">{Math.round(Number(i.bobot) * 100)}%</td>
                  <td className="px-5 py-2 text-right text-xs">
                    berlaku sejak {new Date(i.berlaku_sejak).toLocaleDateString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </main>
  );
}
