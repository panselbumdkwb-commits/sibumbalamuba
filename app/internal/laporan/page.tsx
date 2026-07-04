import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  terdaftar: "Terdaftar",
  administrasi: "Verifikasi Administrasi",
  lolos_administrasi: "Lolos Administrasi",
  penilaian: "Tahap Penilaian",
  selesai: "Selesai",
  ditolak: "Ditolak",
  mengundurkan_diri: "Mengundurkan Diri",
};

/**
 * Halaman khusus role `eksekutif` (Asisten Perekonomian dan Pembangunan,
 * Sekretaris Daerah) — murni lihat-saja, ringkasan lintas entitas, tanpa
 * satu pun tombol ubah data. Detail nilai UKK mentah per penilai maupun
 * berkas administrasi peserta SENGAJA tidak ditampilkan di sini.
 */
export default async function LaporanPimpinanPage() {
  await requireRole(["eksekutif", "super_admin"]);

  const supabase = await createClient();

  const [
    { data: bumdList },
    { data: bludList },
    { data: evaluasiBumd },
    { data: evaluasiBlud },
    { data: peserta },
  ] = await Promise.all([
    supabase.from("bumd").select("id, nama, status"),
    supabase.from("blud").select("id, nama, status"),
    supabase.from("evaluasi_bumd").select("id, periode, skor_total, kategori, status"),
    supabase.from("evaluasi_blud").select("id, periode, skor_total, maturitas, status"),
    supabase.from("peserta_seleksi").select("id, jenis_seleksi, status"),
  ]);

  const statusCounts = (peserta ?? []).reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Laporan Ringkas Pimpinan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Ringkasan lintas entitas untuk keperluan pengawasan pimpinan.
          Halaman ini bersifat lihat-saja.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <SummaryCard label="Total BUMD" value={bumdList?.length ?? 0} />
        <SummaryCard label="Total BLUD" value={bludList?.length ?? 0} />
        <SummaryCard label="Total Pendaftar Seleksi" value={peserta?.length ?? 0} />
      </div>

      <section className="card p-5">
        <p className="font-medium text-slate-900 mb-3">Status Pendaftaran Seleksi</p>
        <div className="flex flex-col gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{STATUS_LABEL[status] ?? status}</span>
              <span className="font-medium text-slate-900">{count}</span>
            </div>
          ))}
          {!Object.keys(statusCounts).length && (
            <p className="text-sm text-slate-400">Belum ada pendaftar.</p>
          )}
        </div>
      </section>

      <section className="card p-5">
        <p className="font-medium text-slate-900 mb-3">Evaluasi Kinerja BUMD</p>
        <EvaluasiTable
          rows={evaluasiBumd ?? []}
          categoryField="kategori"
        />
      </section>

      <section className="card p-5">
        <p className="font-medium text-slate-900 mb-3">Evaluasi Kinerja BLUD</p>
        <EvaluasiTable
          rows={evaluasiBlud ?? []}
          categoryField="maturitas"
        />
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5 text-center">
      <p className="text-2xl font-bold text-primary-800">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function EvaluasiTable({
  rows,
  categoryField,
}: {
  rows: { id: string; periode: string; skor_total: number | null; status: string; [key: string]: unknown }[];
  categoryField: string;
}) {
  if (!rows.length) {
    return <p className="text-sm text-slate-400">Belum ada data evaluasi.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead className="text-xs uppercase text-slate-400">
        <tr>
          <th className="text-left py-1.5">Periode</th>
          <th className="text-left py-1.5">Kategori</th>
          <th className="text-right py-1.5">Skor</th>
          <th className="text-right py-1.5">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-t border-slate-100">
            <td className="py-1.5">{r.periode}</td>
            <td className="py-1.5">{String(r[categoryField] ?? "-")}</td>
            <td className="py-1.5 text-right font-medium">{r.skor_total ?? "-"}</td>
            <td className="py-1.5 text-right text-xs text-slate-500">{r.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
