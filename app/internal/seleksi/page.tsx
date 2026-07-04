import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import VerifyBerkasButton from "./verify-berkas-button";
import CancelPesertaButton from "./cancel-peserta-button";

const STATUS_LABEL: Record<string, string> = {
  terdaftar: "Terdaftar",
  administrasi: "Verifikasi Administrasi",
  lolos_administrasi: "Lolos Administrasi",
  penilaian: "Tahap Penilaian",
  selesai: "Selesai",
  ditolak: "Ditolak",
  mengundurkan_diri: "Mengundurkan Diri",
};

const STATUS_FINAL = ["selesai", "ditolak", "mengundurkan_diri"];

export default async function KelolaSeleksiPage() {
  await requireRole(["panitia_seleksi", "super_admin"]);

  const supabase = await createClient();
  const { data: peserta } = await supabase
    .from("peserta_seleksi")
    .select("id, jenis_seleksi, jalur_pendaftaran, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const pesertaIds = peserta?.map((p) => p.id) ?? [];
  const { data: berkasList } = pesertaIds.length
    ? await supabase
        .from("berkas")
        .select("id, peserta_id, jenis_dokumen, status_verifikasi, catatan")
        .in("peserta_id", pesertaIds)
    : { data: [] };

  return (
    <main className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Kelola Seleksi</h1>
        <p className="text-sm text-slate-500 mt-1">
          Verifikasi berkas administrasi peserta seleksi Direksi, Dewan
          Pengawas, dan Komisaris.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {peserta?.map((p) => {
          const berkasPeserta = berkasList?.filter((b) => b.peserta_id === p.id) ?? [];
          return (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-medium text-slate-900 capitalize">
                    Seleksi {p.jenis_seleksi.replace("_", " ")}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Jalur {p.jalur_pendaftaran} · terdaftar{" "}
                    {new Date(p.created_at).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge bg-primary-50 text-primary-700">
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                  {!STATUS_FINAL.includes(p.status) && <CancelPesertaButton pesertaId={p.id} />}
                </div>
              </div>

              {berkasPeserta.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4 flex flex-col gap-2">
                  {berkasPeserta.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-slate-600">{b.jenis_dokumen}</span>
                      <VerifyBerkasButton berkasId={b.id} currentStatus={b.status_verifikasi} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {!peserta?.length && (
          <p className="text-sm text-slate-400">Belum ada peserta terdaftar.</p>
        )}
      </div>
    </main>
  );
}
