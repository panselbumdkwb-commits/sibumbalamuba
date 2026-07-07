import { requireRole, getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import PageHeader from "../../_components/page-header";
import PilihProsesSelect from "./pilih-proses-select";
import TambahInstrumenForm from "./tambah-instrumen-form";
import PesertaPenilaianCard from "./peserta-penilaian-card";

const JENIS_LABEL: Record<string, string> = {
  direksi: "Direksi",
  dewas: "Dewan Pengawas",
  komisaris: "Komisaris",
  pegawai_blud: "Pegawai BLUD",
};

const ASPEK_LABEL: Record<string, string> = {
  integritas: "Integritas",
  kepemimpinan: "Kepemimpinan",
  kompetensi_manajerial: "Kompetensi Manajerial",
  kompetensi_bisnis: "Kompetensi Bisnis",
  kompetensi_keuangan: "Kompetensi Keuangan",
  tata_kelola: "Tata Kelola",
  regulasi: "Regulasi",
  komunikasi: "Komunikasi",
  problem_solving: "Problem Solving",
  business_plan: "Business Plan",
};

export default async function PenilaianUkkPage({
  searchParams,
}: {
  searchParams: Promise<{ proses?: string }>;
}) {
  await requireRole(["tim_ukk", "super_admin"]);
  const profile = await getSessionProfile();
  const { proses: seleksiProsesId } = await searchParams;

  const supabase = await createClient();
  const { data: prosesList } = await supabase
    .from("seleksi_proses")
    .select("id, jenis_seleksi, jabatan_lowong, tahun")
    .order("created_at", { ascending: false });

  const prosesOptions =
    prosesList?.map((p) => ({
      id: p.id,
      label: `${JENIS_LABEL[p.jenis_seleksi] ?? p.jenis_seleksi} — ${p.jabatan_lowong} (${p.tahun})`,
    })) ?? [];

  let instrumenList: { id: string; aspek: string; bobot: number; deskripsi_indikator: string | null }[] = [];
  let pesertaList: { id: string; nama_lengkap: string }[] = [];
  let nilaiSaya: { instrumen_id: string; peserta_id: string; skor: number; catatan: string | null; is_final: boolean }[] = [];
  let totalBobot = 0;

  if (seleksiProsesId) {
    const { data: instrumenData } = await supabase
      .from("ukk_instrumen")
      .select("id, aspek, bobot, deskripsi_indikator")
      .eq("seleksi_proses_id", seleksiProsesId)
      .order("aspek");
    instrumenList = instrumenData ?? [];
    totalBobot = instrumenList.reduce((s, i) => s + Number(i.bobot), 0);

    const { data: pesertaSeleksi } = await supabase
      .from("peserta_seleksi")
      .select("id, user_id")
      .eq("seleksi_proses_id", seleksiProsesId);

    const userIds = pesertaSeleksi?.map((p) => p.user_id) ?? [];
    const { data: profilPeserta } = userIds.length
      ? await supabase.from("profiles").select("id, nama_lengkap").in("id", userIds)
      : { data: [] };

    pesertaList =
      pesertaSeleksi?.map((p) => ({
        id: p.id,
        nama_lengkap: profilPeserta?.find((pr) => pr.id === p.user_id)?.nama_lengkap ?? "Peserta",
      })) ?? [];

    const pesertaIds = pesertaList.map((p) => p.id);
    if (pesertaIds.length && profile) {
      const { data: nilaiData } = await supabase
        .from("ukk_penilaian")
        .select("instrumen_id, peserta_id, skor, catatan, is_final")
        .in("peserta_id", pesertaIds)
        .eq("tim_ukk_id", profile.id);
      nilaiSaya = nilaiData ?? [];
    }
  }

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="📝"
        color="bg-accent-50 text-accent-700"
        title="Penilaian UKK"
        description="Nilai yang Anda input di sini hanya terlihat oleh Anda sendiri dan super_admin, sampai direkap rata-rata tertimbang dengan asesor lain."
      />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PilihProsesSelect prosesList={prosesOptions} />
        {seleksiProsesId && (
          <Link href={`/internal/seleksi/penilaian-ukk/rekap?proses=${seleksiProsesId}`} className="text-sm text-primary-700 hover:underline">
            Lihat Rekap & Peringkat →
          </Link>
        )}
      </div>

      {seleksiProsesId && (
        <>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-slate-900">Instrumen & Bobot Penilaian</p>
              <span className={`badge ${Math.abs(totalBobot - 1) < 0.001 ? "bg-accent-50 text-accent-700" : "bg-amber-50 text-amber-700"}`}>
                Total {(totalBobot * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex flex-col gap-1.5 mb-2">
              {instrumenList.map((i) => (
                <div key={i.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    {ASPEK_LABEL[i.aspek] ?? i.aspek}
                    {i.deskripsi_indikator && <span className="text-xs text-slate-400"> — {i.deskripsi_indikator}</span>}
                  </span>
                  <span className="font-medium text-slate-900">{(Number(i.bobot) * 100).toFixed(0)}%</span>
                </div>
              ))}
              {!instrumenList.length && <p className="text-sm text-slate-400">Belum ada instrumen. Tambahkan dulu sebelum menilai.</p>}
            </div>
            <TambahInstrumenForm seleksiProsesId={seleksiProsesId} />
          </div>

          {instrumenList.length > 0 && (
            <div className="flex flex-col gap-3">
              {pesertaList.map((p) => (
                <PesertaPenilaianCard
                  key={p.id}
                  pesertaId={p.id}
                  namaPeserta={p.nama_lengkap}
                  seleksiProsesId={seleksiProsesId}
                  instrumenList={instrumenList}
                  nilaiSaya={nilaiSaya.filter((n) => n.peserta_id === p.id)}
                />
              ))}
              {!pesertaList.length && (
                <p className="text-sm text-slate-400">
                  Belum ada peserta yang terhubung ke siklus seleksi ini.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
