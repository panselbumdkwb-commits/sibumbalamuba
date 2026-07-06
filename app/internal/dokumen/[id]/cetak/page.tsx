import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CetakButton from "./cetak-button";

const SIFAT_LABEL: Record<string, string> = {
  biasa: "Biasa",
  penting: "Penting",
  segera: "Segera",
  rahasia: "Rahasia",
};

export default async function CetakSuratPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["panitia_seleksi", "ketua_pansel", "super_admin"]);
  const { id } = await params;

  const supabase = await createClient();
  const { data: surat } = await supabase
    .from("dokumen_internal")
    .select("*")
    .eq("id", id)
    .single();

  if (!surat || !surat.nomor_surat) notFound();

  const [{ data: pembuat }, { data: approver }] = await Promise.all([
    supabase.from("profiles").select("nama_lengkap").eq("id", surat.pembuat_id).single(),
    surat.approver_id
      ? supabase.from("profiles").select("nama_lengkap").eq("id", surat.approver_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const tanggalSurat = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(surat.updated_at));

  const tembusanList = surat.tembusan?.split("\n").filter(Boolean) ?? [];

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white">
      <div className="no-print mb-6">
        <CetakButton />
      </div>

      {/* Kop Surat */}
      <div className="text-center border-b-4 border-double border-black pb-3 mb-6">
        <p className="text-sm font-semibold uppercase">Pemerintah Kota Batu</p>
        <p className="text-lg font-bold uppercase">Panitia Seleksi Direksi, Dewan Pengawas, dan Komisaris BUMD</p>
        <p className="text-xs mt-1">Jl. Panglima Sudirman, Kota Batu, Jawa Timur</p>
      </div>

      {/* Kepala Surat */}
      <div className="grid grid-cols-[auto_1fr] gap-x-2 text-sm mb-6">
        <span>Nomor</span><span>: {surat.nomor_surat}</span>
        <span>Sifat</span><span>: {SIFAT_LABEL[surat.sifat] ?? surat.sifat}</span>
        <span>Lampiran</span><span>: {surat.lampiran || "-"}</span>
        <span>Hal</span><span className="font-medium">: {surat.judul}</span>
      </div>

      <div className="text-right text-sm mb-6">Kota Batu, {tanggalSurat}</div>

      {surat.kepada && (
        <div className="text-sm mb-6">
          <p>Kepada Yth.</p>
          <p className="font-medium">{surat.kepada}</p>
          <p>di Tempat</p>
        </div>
      )}

      <div className="text-sm leading-relaxed whitespace-pre-wrap mb-8">
        {surat.isi_surat || <span className="text-slate-400">(isi surat belum diisi)</span>}
      </div>

      {/* Blok tanda tangan */}
      <div className="flex justify-end mb-8">
        <div className="text-sm text-center w-64">
          <p>Ketua Panitia Seleksi,</p>
          <div className="h-20" />
          <p className="font-medium underline">{approver?.nama_lengkap ?? "( belum ditandatangani )"}</p>
        </div>
      </div>

      {tembusanList.length > 0 && (
        <div className="text-xs mt-8">
          <p>Tembusan:</p>
          <ol className="list-decimal list-inside">
            {tembusanList.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </div>
      )}

      <p className="no-print text-xs text-slate-400 mt-10">
        Dibuat oleh {pembuat?.nama_lengkap} · Status: {surat.status}
      </p>
    </div>
  );
}
