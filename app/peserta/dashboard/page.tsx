import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/rbac";

const STATUS_LABEL: Record<string, string> = {
  terdaftar: "Terdaftar",
  administrasi: "Verifikasi Administrasi",
  lolos_administrasi: "Lolos Administrasi",
  penilaian: "Tahap Penilaian",
  selesai: "Selesai",
  ditolak: "Tidak Lolos",
};

const TAHAP_LABEL: Record<string, string> = {
  psikotes: "Psikotes",
  tes_tulis: "Tes Tertulis",
  ukk: "Uji Kompetensi Kerja (UKK)",
  presentasi: "Presentasi",
  wawancara: "Wawancara",
};

export default async function PesertaDashboardPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login/peserta");
  if (profile.role !== "peserta") redirect("/internal/dashboard");

  const supabase = await createClient();

  const { data: pendaftaran } = await supabase
    .from("peserta_seleksi")
    .select("id, jenis_seleksi, status, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const pesertaIds = pendaftaran?.map((p) => p.id) ?? [];

  const [{ data: berkasList }, { data: nilaiList }] = await Promise.all([
    pesertaIds.length
      ? supabase.from("berkas").select("id, peserta_id, jenis_dokumen, status_verifikasi").in("peserta_id", pesertaIds)
      : Promise.resolve({ data: [] }),
    pesertaIds.length
      ? supabase.from("nilai_ukk").select("peserta_id, tahap, skor, is_final").in("peserta_id", pesertaIds)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <main className="max-w-3xl mx-auto p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Halo, {profile.namaLengkap}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Pantau status pendaftaran dan tahapan seleksi Anda di sini.
        </p>
      </div>

      {pendaftaran?.map((p) => (
        <div key={p.id} className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-900 capitalize">
                Seleksi {p.jenis_seleksi.replace("_", " ")}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Terdaftar {new Date(p.created_at).toLocaleDateString("id-ID")}
              </p>
            </div>
            <span className="badge bg-primary-50 text-primary-700">
              {STATUS_LABEL[p.status] ?? p.status}
            </span>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Berkas Administrasi
            </p>
            <div className="flex flex-col gap-1.5">
              {berkasList
                ?.filter((b) => b.peserta_id === p.id)
                .map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{b.jenis_dokumen}</span>
                    <span
                      className={`badge ${
                        b.status_verifikasi === "lolos"
                          ? "bg-accent-50 text-accent-700"
                          : b.status_verifikasi === "ditolak"
                          ? "bg-red-50 text-red-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {b.status_verifikasi === "pending" ? "Menunggu" : b.status_verifikasi}
                    </span>
                  </div>
                ))}
              {!berkasList?.some((b) => b.peserta_id === p.id) && (
                <p className="text-sm text-slate-400">Belum ada berkas diunggah.</p>
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Hasil Penilaian (tampil setelah difinalisasi panitia)
            </p>
            <div className="flex flex-col gap-1.5">
              {nilaiList
                ?.filter((n) => n.peserta_id === p.id)
                .map((n) => (
                  <div key={n.tahap} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{TAHAP_LABEL[n.tahap] ?? n.tahap}</span>
                    <span className="font-medium text-slate-900">{n.skor}</span>
                  </div>
                ))}
              {!nilaiList?.some((n) => n.peserta_id === p.id) && (
                <p className="text-sm text-slate-400">Belum ada nilai final yang dipublikasikan.</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {!pendaftaran?.length && (
        <div className="card p-6 text-sm text-slate-500">
          Anda belum terdaftar di seleksi manapun.
        </div>
      )}
    </main>
  );
}
