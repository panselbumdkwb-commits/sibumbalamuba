import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import PageHeader from "../../_components/page-header";
import BuatProsesForm from "./buat-proses-form";

const JENIS_LABEL: Record<string, string> = {
  direksi: "Direksi",
  dewas: "Dewan Pengawas",
  komisaris: "Komisaris",
  pegawai_blud: "Pegawai BLUD",
};

export default async function DaftarProsesSeleksiPage() {
  await requireRole(["panitia_seleksi", "ketua_pansel", "eksekutif", "admin_bpsda", "super_admin"]);

  const supabase = await createClient();
  const [{ data: prosesList }, { data: bumdList }] = await Promise.all([
    supabase
      .from("seleksi_proses")
      .select("id, jenis_seleksi, jabatan_lowong, tahun, kelompok_berjalan, bumd_id")
      .order("created_at", { ascending: false }),
    supabase.from("bumd").select("id, nama").order("nama"),
  ]);

  const namaBumd = (id: string | null) => bumdList?.find((b) => b.id === id)?.nama ?? null;

  // Hitung progres per proses (berapa dari 24 tugas sudah selesai).
  const prosesIds = prosesList?.map((p) => p.id) ?? [];
  const { data: tahapanList } = prosesIds.length
    ? await supabase.from("seleksi_tahapan").select("seleksi_proses_id, status").in("seleksi_proses_id", prosesIds)
    : { data: [] };

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="🗂️"
        color="bg-brand-50 text-brand-700"
        title="Proses Seleksi Direksi/Dewas/Komisaris"
        description="Setiap siklus seleksi otomatis mendapat 24 tugas baku sesuai matriks tugas & fungsi Panitia Seleksi."
      />

      <BuatProsesForm bumdList={bumdList ?? []} />

      <div className="flex flex-col gap-3">
        {prosesList?.map((p) => {
          const tugasProses = tahapanList?.filter((t) => t.seleksi_proses_id === p.id) ?? [];
          const selesai = tugasProses.filter((t) => t.status === "selesai").length;
          const total = tugasProses.length || 24;
          const persen = Math.round((selesai / total) * 100);

          return (
            <Link key={p.id} href={`/internal/seleksi/proses/${p.id}`} className="card p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-medium text-slate-900">
                    Seleksi {JENIS_LABEL[p.jenis_seleksi] ?? p.jenis_seleksi} — {p.jabatan_lowong}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {namaBumd(p.bumd_id) ?? "Tanpa entitas spesifik"} · Tahun {p.tahun}
                  </p>
                </div>
                <span className="badge bg-primary-50 text-primary-700 capitalize">
                  {p.kelompok_berjalan.replace(/_/g, " ")}
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Progres tugas</span>
                  <span>{selesai}/{total} selesai</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-accent-500" style={{ width: `${persen}%` }} />
                </div>
              </div>
            </Link>
          );
        })}

        {!prosesList?.length && (
          <p className="text-sm text-slate-400">Belum ada proses seleksi yang dibuat.</p>
        )}
      </div>
    </main>
  );
}
