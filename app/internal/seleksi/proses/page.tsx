import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import PageHeader from "../../_components/page-header";
import BuatProsesForm from "./buat-proses-form";
import HapusProsesButton from "./hapus-proses-button";

const JENIS_LABEL: Record<string, string> = {
  direksi: "Direksi",
  dewas: "Dewan Pengawas",
  komisaris: "Komisaris",
  pegawai_blud: "Pegawai BLUD",
};

export default async function DaftarProsesSeleksiPage() {
  await requireRole(["panitia_seleksi", "ketua_pansel", "eksekutif"]);

  const supabase = await createClient();
  const [{ data: prosesList }, { data: bumdList }, { data: lowonganList }] = await Promise.all([
    supabase
      .from("seleksi_proses")
      .select("id, tahun, kelompok_berjalan, bumd_id")
      .order("created_at", { ascending: false }),
    supabase.from("bumd").select("id, nama").order("nama"),
    supabase.from("seleksi_lowongan").select("id, seleksi_proses_id, jenis_seleksi, jabatan_lowong"),
  ]);

  const namaBumd = (id: string | null) => bumdList?.find((b) => b.id === id)?.nama ?? null;
  const lowonganProses = (prosesId: string) => lowonganList?.filter((l) => l.seleksi_proses_id === prosesId) ?? [];

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
        description="Satu proses bisa memuat lebih dari satu posisi (mis. Komisaris & Direktur BUMD yang sama) — 24 tugas baku otomatis dibuat sesuai matriks tugas & fungsi Panitia Seleksi."
      />

      <BuatProsesForm bumdList={bumdList ?? []} />

      <div className="flex flex-col gap-3">
        {prosesList?.map((p) => {
          const tugasProses = tahapanList?.filter((t) => t.seleksi_proses_id === p.id) ?? [];
          const selesai = tugasProses.filter((t) => t.status === "selesai").length;
          const total = tugasProses.length || 24;
          const persen = Math.round((selesai / total) * 100);
          const posisi = lowonganProses(p.id);

          return (
            <div key={p.id} className="relative card p-5 hover:shadow-card-hover transition-shadow">
              <Link href={`/internal/seleksi/proses/${p.id}`} className="absolute inset-0 z-0" aria-label="Buka detail proses" />
              <div className="relative z-[1] pointer-events-none flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-medium text-slate-900">
                    Seleksi{" "}
                    {posisi.length > 1
                      ? posisi.map((l) => `${JENIS_LABEL[l.jenis_seleksi] ?? l.jenis_seleksi} (${l.jabatan_lowong})`).join(" & ")
                      : posisi.map((l) => `${JENIS_LABEL[l.jenis_seleksi] ?? l.jenis_seleksi} — ${l.jabatan_lowong}`).join("")}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {namaBumd(p.bumd_id) ?? "Tanpa entitas spesifik"} · Tahun {p.tahun}
                  </p>
                  {posisi.length > 1 && (
                    <span className="inline-block mt-1.5 text-[11px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                      🔗 {posisi.length} posisi dalam satu proses
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge bg-primary-50 text-primary-700 capitalize">
                    {p.kelompok_berjalan.replace(/_/g, " ")}
                  </span>
                  <div className="pointer-events-auto flex items-center gap-3">
                    <Link href={`/internal/seleksi/proses/${p.id}?edit=1`} className="text-xs text-primary-700 hover:text-primary-900">
                      ✏️ Edit
                    </Link>
                    <HapusProsesButton
                      prosesId={p.id}
                      label={posisi.map((l) => `${JENIS_LABEL[l.jenis_seleksi] ?? l.jenis_seleksi} — ${l.jabatan_lowong}`).join(" & ") || "proses ini"}
                    />
                  </div>
                </div>
              </div>
              <div className="relative z-[1] pointer-events-none mt-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Progres tugas</span>
                  <span>{selesai}/{total} selesai</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-accent-500" style={{ width: `${persen}%` }} />
                </div>
              </div>
            </div>
          );
        })}

        {!prosesList?.length && (
          <p className="text-sm text-slate-400">Belum ada proses seleksi yang dibuat.</p>
        )}
      </div>
    </main>
  );
}
