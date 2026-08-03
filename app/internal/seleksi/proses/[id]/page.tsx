import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import PageHeader from "../../../_components/page-header";
import TahapanRow from "./tahapan-row";
import KewenanganPanel from "../kewenangan-panel";
import EditProsesPanel from "./edit-proses-panel";

const JENIS_LABEL: Record<string, string> = {
  direksi: "Direksi",
  dewas: "Dewan Pengawas",
  komisaris: "Komisaris",
  pegawai_blud: "Pegawai BLUD",
};

const KELOMPOK_LABEL: Record<string, string> = {
  persiapan: "1. Persiapan",
  pengumuman: "2. Pengumuman",
  pendaftaran: "3. Pendaftaran",
  seleksi_administrasi: "4. Seleksi Administrasi",
  ukk: "5. Uji Kelayakan dan Kepatutan (UKK)",
  penilaian: "6. Penilaian",
  wawancara_akhir: "7. Wawancara Akhir",
  penetapan: "8. Penetapan",
  dokumentasi: "9. Dokumentasi",
  evaluasi: "10. Evaluasi",
};

const KELOMPOK_URUTAN = Object.keys(KELOMPOK_LABEL);

export default async function DetailProsesSeleksiPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireRole(["panitia_seleksi", "ketua_pansel", "eksekutif"]);
  const { id } = await params;
  const { edit } = await searchParams;

  const supabase = await createClient();
  const { data: proses } = await supabase
    .from("seleksi_proses")
    .select("id, tahun, bumd_id")
    .eq("id", id)
    .single();

  if (!proses) notFound();

  const [{ data: tahapanList }, { data: bumd }, { data: dokumenList }, { data: lowonganList }, { data: bumdList }] = await Promise.all([
    supabase.from("seleksi_tahapan").select("*").eq("seleksi_proses_id", id).order("urutan"),
    proses.bumd_id ? supabase.from("bumd").select("nama").eq("id", proses.bumd_id).single() : Promise.resolve({ data: null }),
    supabase.from("dokumen_internal").select("id, judul, status").order("created_at", { ascending: false }),
    supabase.from("seleksi_lowongan").select("id, jenis_seleksi, jabatan_lowong").eq("seleksi_proses_id", id),
    supabase.from("bumd").select("id, nama").order("nama"),
  ]);

  const selesai = tahapanList?.filter((t) => t.status === "selesai").length ?? 0;
  const total = tahapanList?.length ?? 24;
  const posisi = lowonganList ?? [];
  const judulPosisi = posisi
    .map((l) => `${JENIS_LABEL[l.jenis_seleksi] ?? l.jenis_seleksi} — ${l.jabatan_lowong}`)
    .join(" & ");

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="🗂️"
        color="bg-brand-50 text-brand-700"
        title={`Seleksi ${judulPosisi || "(belum ada posisi)"}`}
        description={`${bumd?.nama ?? "Tanpa entitas spesifik"} · Tahun ${proses.tahun} · ${selesai}/${total} tugas selesai`}
      />

      {posisi.length > 1 && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
          🔗 Proses ini menangani <strong>{posisi.length} posisi sekaligus</strong> dalam satu Pansel &amp; satu
          checklist tugas yang sama:{" "}
          {posisi.map((l, i) => (
            <span key={l.id}>
              {i > 0 && " · "}
              <strong>{JENIS_LABEL[l.jenis_seleksi] ?? l.jenis_seleksi}</strong> ({l.jabatan_lowong})
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <EditProsesPanel
          prosesId={proses.id}
          tahun={proses.tahun}
          bumdId={proses.bumd_id}
          bumdList={bumdList ?? []}
          lowonganList={posisi}
          defaultOpen={edit === "1"}
        />
        <Link
          href={`/internal/seleksi/penilaian-ukk/rekap?proses=${proses.id}`}
          className="text-sm text-primary-700 hover:underline"
        >
          🏆 Lihat Rekap &amp; Peringkat Hasil UKK →
        </Link>
      </div>

      <KewenanganPanel />

      <div className="flex flex-col gap-6">
        {KELOMPOK_URUTAN.map((kelompok) => {
          const tugasKelompok = tahapanList?.filter((t) => t.kelompok === kelompok) ?? [];
          if (!tugasKelompok.length) return null;

          return (
            <section key={kelompok}>
              <h2 className="text-sm font-semibold text-slate-900 mb-3">{KELOMPOK_LABEL[kelompok]}</h2>
              <div className="flex flex-col gap-2">
                {tugasKelompok.map((tugas) => (
                  <TahapanRow key={tugas.id} tugas={tugas} dokumenList={dokumenList ?? []} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
