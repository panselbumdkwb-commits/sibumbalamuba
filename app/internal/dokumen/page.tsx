import { getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CreateSuratForm from "./create-surat-form";
import SuratRow from "./surat-row";
import PageHeader from "../_components/page-header";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draf",
  diajukan: "Menunggu Persetujuan",
  disetujui: "Disetujui & Ditandatangani",
  ditolak: "Ditolak",
  diarsipkan: "Diarsipkan",
};

export default async function DokumenPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login/internal");
  if (!["panitia_seleksi", "ketua_pansel", "super_admin"].includes(profile.role)) {
    redirect("/internal/dashboard");
  }

  const isKetua = profile.role === "ketua_pansel" || profile.role === "super_admin";

  const supabase = await createClient();
  const { data: dokumen } = await supabase
    .from("dokumen_internal")
    .select("id, judul, status, pembuat_id, approver_id, versi, nomor_surat, jenis_naskah, sifat, created_at, updated_at")
    .order("created_at", { ascending: false });

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="✍️"
        color="bg-indigo-50 text-indigo-700"
        title="Surat & Dokumen Panitia Seleksi"
        description={
          isKetua
            ? "Sebagai Ketua Panitia, Anda satu-satunya yang bisa menyetujui/menandatangani surat yang diajukan."
            : "Anda bisa membuat draf dan mengajukan surat. Persetujuan/tanda tangan akhir wewenang Ketua Panitia."
        }
      />

      <CreateSuratForm />

      <div className="flex flex-col gap-3">
        {dokumen?.map((d) => (
          <SuratRow
            key={d.id}
            surat={{
              id: d.id,
              judul: d.judul,
              status: d.status,
              statusLabel: STATUS_LABEL[d.status] ?? d.status,
              isPembuat: d.pembuat_id === profile.id,
              adaApprover: Boolean(d.approver_id),
              tanggal: d.updated_at,
              nomorSurat: d.nomor_surat,
              jenisNaskah: d.jenis_naskah,
              sifat: d.sifat,
            }}
            isKetua={isKetua}
          />
        ))}
        {!dokumen?.length && (
          <p className="text-sm text-slate-400">Belum ada surat/dokumen.</p>
        )}
      </div>
    </main>
  );
}
