import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import EntityLogo from "@/components/entity-logo";
import { createClient } from "@/lib/supabase/server";

const LABEL_KATEGORI: Record<string, string> = {
  pelayanan: "Pelayanan",
  keuangan: "Keuangan",
  tata_kelola: "Tata Kelola",
  sdm: "SDM",
  pengembangan: "Pengembangan",
};

// Sama seperti di halaman utama — lampu lalu lintas kategori
// kesehatan (AA/A/BBB/BB/B/C, ambang batas di skor_ke_kategori_kesehatan).
const KATEGORI_COLOR: Record<string, string> = {
  AA: "bg-accent-50 text-accent-700",
  A: "bg-accent-50 text-accent-700",
  BBB: "bg-amber-50 text-amber-700",
  BB: "bg-amber-50 text-amber-700",
  B: "bg-red-50 text-red-600",
  C: "bg-red-50 text-red-600",
};

export default async function BludDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: blud } = await supabase
    .from("blud")
    .select("id, nama, jenis_layanan, status, opd_induk, status_blud, tahun_penetapan, alamat_kantor, wilayah_pelayanan")
    .eq("id", id)
    .single();

  if (!blud) notFound();

  const { data: riwayat } = await supabase.rpc("riwayat_skor_blud_publik", { p_blud_id: id });
  const terbaru = riwayat?.[0] ?? null;

  const { data: rincian } = terbaru
    ? await supabase.rpc("skor_kesehatan_blud_detail_publik", { p_blud_id: id, p_tahun: terbaru.tahun })
    : { data: null };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full flex flex-col gap-8">
        <Link href="/#blud" className="text-sm text-primary-700 hover:underline w-fit">
          ← Kembali ke Beranda
        </Link>

        {/* Profil */}
        <div className="card p-6 flex items-start gap-4">
          <EntityLogo nama={blud.nama} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-slate-900">{blud.nama}</h1>
              <span
                className={`badge shrink-0 ${
                  blud.status === "aktif" ? "bg-accent-50 text-accent-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {blud.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">{blud.jenis_layanan}</p>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-4 text-sm">
              {blud.opd_induk && <Field label="OPD Induk" value={blud.opd_induk} />}
              {blud.status_blud && <Field label="Status BLUD" value={blud.status_blud} />}
              {blud.tahun_penetapan && <Field label="Tahun Penetapan" value={String(blud.tahun_penetapan)} />}
              {blud.alamat_kantor && <Field label="Alamat Kantor" value={blud.alamat_kantor} />}
              {blud.wilayah_pelayanan && <Field label="Wilayah Pelayanan" value={blud.wilayah_pelayanan} />}
            </dl>
          </div>
        </div>

        {/* Hasil Monev */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Hasil Evaluasi Kinerja (Monev)</h2>
          <p className="text-sm text-slate-500 mb-4">
            Skor dihitung otomatis dari data KPI yang sudah terverifikasi berjenjang. Data KPI/realisasi
            mentah tidak pernah dipublikasikan — hanya skor akhir dan rincian per kategori.
          </p>

          {!terbaru ? (
            <div className="card p-6 text-sm text-slate-400">
              Belum ada hasil evaluasi yang dipublikasikan untuk entitas ini.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="card p-6 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-slate-400">Tahun evaluasi {terbaru.tahun}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{terbaru.skor_total ?? "-"}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    dari {terbaru.jumlah_indikator_terhitung} kategori indikator terverifikasi
                  </p>
                  {terbaru.dipublikasikan_at && (
                    <p className="text-xs text-slate-400 mt-2">
                      Data per{" "}
                      {new Date(terbaru.dipublikasikan_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      (tanggal publikasi resmi oleh BPSDA)
                    </p>
                  )}
                </div>
                {terbaru.kategori && (
                  <span className={`badge text-base px-4 py-1.5 ${KATEGORI_COLOR[terbaru.kategori] ?? "bg-slate-100 text-slate-500"}`}>
                    {terbaru.kategori}
                  </span>
                )}
              </div>

              {rincian && rincian.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100">
                    <p className="font-medium text-slate-900">Rincian per Kategori — {terbaru.tahun}</p>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {rincian.map((r) => (
                        <tr key={r.kategori} className="border-t border-slate-100">
                          <td className="px-5 py-3 text-slate-700">{LABEL_KATEGORI[r.kategori] ?? r.kategori}</td>
                          <td className="px-5 py-3 text-right text-slate-400 text-xs">bobot {Math.round(r.bobot * 100)}%</td>
                          <td className="px-5 py-3 text-right font-medium text-slate-900 w-24">
                            {r.rata_capaian ?? "-"}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {riwayat && riwayat.length > 1 && (
                <div className="card overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100">
                    <p className="font-medium text-slate-900">Riwayat Skor per Tahun</p>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {riwayat.map((r) => (
                        <tr key={r.tahun} className="border-t border-slate-100">
                          <td className="px-5 py-3 text-slate-700">{r.tahun}</td>
                          <td className="px-5 py-3 text-right text-slate-500">{r.skor_total ?? "-"}</td>
                          <td className="px-5 py-3 text-right w-20">
                            {r.kategori && (
                              <span className={`badge ${KATEGORI_COLOR[r.kategori] ?? "bg-slate-100 text-slate-500"}`}>
                                {r.kategori}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-slate-700">{value}</dd>
    </div>
  );
}
