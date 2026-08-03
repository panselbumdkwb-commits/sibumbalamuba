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

// Kop surat resmi (gambar) per BUMD — lihat catatan yang sama di
// surat-row.tsx / migration 0024. Surat lama/umum tanpa BUMD terpilih
// jatuh ke kop teks generik di bawah.
const KOP_IMAGE: Record<string, string> = {
  perumdam: "/kop-surat/kop-perumdam.png",
  pt_bwr: "/kop-surat/kop-pt-bwr.png",
};

export default async function CetakSuratPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["panitia_seleksi", "ketua_pansel"]);
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
    <div className="max-w-3xl mx-auto p-8 print:p-0 print:max-w-none bg-white naskah-dinas">
      <div className="no-print mb-6">
        <CetakButton />
      </div>

      {/* Kop Surat — pakai gambar resmi per BUMD kalau surat sudah
          memilih salah satu; kalau belum (surat lama/umum), pakai kop
          teks generik sebagai fallback. */}
      {surat.entitas_seleksi && KOP_IMAGE[surat.entitas_seleksi] ? (
        <div className="mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={KOP_IMAGE[surat.entitas_seleksi]} alt="Kop Surat" className="w-full" />
        </div>
      ) : (
        <div className="text-center border-b-4 border-double border-black pb-3 mb-6">
          <p className="font-semibold uppercase">Pemerintah Kota Batu</p>
          <p className="text-base font-bold uppercase">Panitia Seleksi Direksi, Dewan Pengawas, dan Komisaris BUMD</p>
          <p className="text-xs mt-1">Jl. Panglima Sudirman, Kota Batu, Jawa Timur</p>
        </div>
      )}

      {/* Kepala Surat */}
      <div className="grid grid-cols-[auto_1fr] gap-x-2 mb-6">
        <span>Nomor</span><span>: {surat.nomor_surat}</span>
        <span>Sifat</span><span>: {SIFAT_LABEL[surat.sifat] ?? surat.sifat}</span>
        <span>Lampiran</span><span>: {surat.lampiran || "-"}</span>
        <span>Hal</span><span className="font-medium">: {surat.judul}</span>
      </div>

      <div className="text-right mb-6">Kota Batu, {tanggalSurat}</div>

      {surat.kepada && (
        <div className="mb-6">
          <p>Kepada Yth.</p>
          <p className="font-medium">{surat.kepada}</p>
          <p>di Tempat</p>
        </div>
      )}

      {/* Isi surat — rata kiri-kanan (justify) sesuai tata naskah dinas */}
      <div className="text-justify whitespace-pre-wrap mb-8">
        {surat.isi_surat || <span className="text-slate-400">(isi surat belum diisi)</span>}
      </div>

      {/* Blok tanda tangan — kolom di sebelah kanan, teks di dalamnya
          rata kiri (bukan rata tengah) sesuai ketentuan tata naskah
          dinas resmi. */}
      <div className="flex justify-end mb-8">
        <div className="text-left w-64">
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
