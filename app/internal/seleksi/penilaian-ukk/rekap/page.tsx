import { getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "../../../_components/page-header";
import BuatBeritaAcaraButton from "./buat-berita-acara-button";
import ExportCsvButton from "./export-csv-button";

export default async function RekapUkkPage({
  searchParams,
}: {
  searchParams: Promise<{ proses?: string }>;
}) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login/internal");
  if (!["tim_ukk", "panitia_seleksi", "ketua_pansel", "eksekutif", "admin_bpsda", "super_admin"].includes(profile.role)) {
    redirect("/internal/dashboard");
  }

  const { proses: seleksiProsesId } = await searchParams;
  if (!seleksiProsesId) redirect("/internal/seleksi/proses");

  const supabase = await createClient();
  const { data: rekap } = await supabase.rpc("get_rekap_ukk_tertimbang", {
    p_seleksi_proses_id: seleksiProsesId,
  });

  const pesertaIds = rekap?.map((r) => r.peserta_id) ?? [];
  const { data: pesertaSeleksi } = pesertaIds.length
    ? await supabase.from("peserta_seleksi").select("id, user_id").in("id", pesertaIds)
    : { data: [] };
  const userIds = pesertaSeleksi?.map((p) => p.user_id) ?? [];
  const { data: profilPeserta } = userIds.length
    ? await supabase.from("profiles").select("id, nama_lengkap").in("id", userIds)
    : { data: [] };

  const namaPeserta = (pesertaId: string) => {
    const ps = pesertaSeleksi?.find((p) => p.id === pesertaId);
    return profilPeserta?.find((pr) => pr.id === ps?.user_id)?.nama_lengkap ?? "Peserta";
  };

  const hasil = (rekap ?? [])
    .map((r) => ({ ...r, nama: namaPeserta(r.peserta_id) }))
    .sort((a, b) => a.peringkat - b.peringkat);

  const bisaBuatBeritaAcara = ["tim_ukk", "panitia_seleksi", "ketua_pansel", "super_admin"].includes(profile.role);

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="🏆"
        color="bg-amber-50 text-amber-700"
        title="Rekap & Peringkat Hasil UKK"
        description="Skor akhir tertimbang (rata-rata seluruh asesor yang sudah finalisasi). Nilai mentah per aspek/asesor tidak pernah ditampilkan di sini."
      />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <ExportCsvButton hasil={hasil} />
        {bisaBuatBeritaAcara && <BuatBeritaAcaraButton seleksiProsesId={seleksiProsesId} />}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="text-left px-4 py-2.5">Peringkat</th>
              <th className="text-left px-4 py-2.5">Nama Peserta</th>
              <th className="text-right px-4 py-2.5">Skor Akhir</th>
              <th className="text-right px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {hasil.map((r) => (
              <tr key={r.peserta_id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{r.peringkat}</td>
                <td className="px-4 py-3">{r.nama}</td>
                <td className="px-4 py-3 text-right font-medium">{r.skor_akhir ?? "-"}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`badge ${r.sudah_lengkap ? "bg-accent-50 text-accent-700" : "bg-amber-50 text-amber-700"}`}>
                    {r.sudah_lengkap ? "Lengkap" : `${r.jumlah_asesor_final}/${r.total_tim_ukk_aktif} asesor`}
                  </span>
                </td>
              </tr>
            ))}
            {!hasil.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Belum ada nilai final dari asesor manapun.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        Catatan: hasil UKK bersifat rekomendasi profesional. Penetapan
        kelulusan dan pengangkatan tetap wewenang Kepala Daerah/KPM sesuai
        PP 54/2017 dan Permendagri 37/2018 — sistem ini tidak pernah
        menetapkan keputusan akhir.
      </p>
    </main>
  );
}
