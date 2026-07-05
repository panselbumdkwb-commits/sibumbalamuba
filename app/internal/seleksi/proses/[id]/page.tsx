import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PageHeader from "../../../_components/page-header";
import TahapanRow from "./tahapan-row";
import KewenanganPanel from "../kewenangan-panel";

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

export default async function DetailProsesSeleksiPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["panitia_seleksi", "ketua_pansel", "eksekutif", "super_admin"]);
  const { id } = await params;

  const supabase = await createClient();
  const { data: proses } = await supabase
    .from("seleksi_proses")
    .select("id, jenis_seleksi, jabatan_lowong, tahun, bumd_id")
    .eq("id", id)
    .single();

  if (!proses) notFound();

  const [{ data: tahapanList }, { data: bumd }, { data: dokumenList }] = await Promise.all([
    supabase.from("seleksi_tahapan").select("*").eq("seleksi_proses_id", id).order("urutan"),
    proses.bumd_id ? supabase.from("bumd").select("nama").eq("id", proses.bumd_id).single() : Promise.resolve({ data: null }),
    supabase.from("dokumen_internal").select("id, judul, status").order("created_at", { ascending: false }),
  ]);

  const selesai = tahapanList?.filter((t) => t.status === "selesai").length ?? 0;
  const total = tahapanList?.length ?? 24;

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="🗂️"
        color="bg-brand-50 text-brand-700"
        title={`Seleksi ${JENIS_LABEL[proses.jenis_seleksi] ?? proses.jenis_seleksi} — ${proses.jabatan_lowong}`}
        description={`${bumd?.nama ?? "Tanpa entitas spesifik"} · Tahun ${proses.tahun} · ${selesai}/${total} tugas selesai`}
      />

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
