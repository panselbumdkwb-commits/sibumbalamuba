"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ajukanSurat, putuskanSurat, hapusSurat } from "@/actions/dokumen.actions";
import EditSuratForm from "./edit-surat-form";

type Surat = {
  id: string;
  judul: string;
  status: string;
  statusLabel: string;
  isPembuat: boolean;
  adaApprover: boolean;
  tanggal: string;
  nomorSurat: string | null;
  jenisNaskah: string;
  sifat: string;
  lampiran: string | null;
  kepada: string | null;
  isiSurat: string | null;
  tembusan: string | null;
  entitasSeleksi: string | null;
  catatanRevisi: string | null;
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-slate-100 text-slate-500",
  diajukan: "bg-amber-50 text-amber-700",
  disetujui: "bg-accent-50 text-accent-700",
  ditolak: "bg-red-50 text-red-600",
  diarsipkan: "bg-slate-100 text-slate-400",
};

const JENIS_LABEL: Record<string, string> = {
  surat_biasa: "Surat Biasa",
  surat_undangan: "Surat Undangan",
  nota_dinas: "Nota Dinas",
  berita_acara: "Berita Acara",
  surat_keterangan: "Surat Keterangan",
  surat_edaran: "Surat Edaran",
  laporan: "Laporan",
  surat_pengantar: "Surat Pengantar",
};

const SIFAT_LABEL: Record<string, string> = {
  biasa: "Biasa",
  penting: "Penting",
  segera: "Segera",
  rahasia: "Rahasia",
};

// Kop surat resmi (gambar) per BUMD — diunggah panitia, disimpan di
// /public/kop-surat. Surat lama/umum yang belum memilih BUMD tujuan
// (entitasSeleksi null) jatuh ke kop teks generik sebagai fallback.
const KOP_IMAGE: Record<string, string> = {
  perumdam: "/kop-surat/kop-perumdam.png",
  pt_bwr: "/kop-surat/kop-pt-bwr.png",
};

const ENTITAS_LABEL: Record<string, string> = {
  perumdam: "Perumdam Among Tirto",
  pt_bwr: "PT. Batu Wisata Resource",
};

// "Unduh" — tanpa library PDF/Word tambahan, dokumen dibuat sebagai
// berkas .doc (HTML dengan ekstensi .doc dibaca Microsoft Word secara
// native), memakai format naskah dinas yang sama dengan halaman
// Cetak, termasuk kop surat resmi sesuai BUMD yang dipilih. Berbeda
// dari Cetak, ini bisa dipakai untuk draf yang belum diajukan/belum
// bernomor sekalipun (mis. untuk ditinjau di luar sistem sebelum
// diajukan). Kop dirujuk via URL absolut (origin situs saat ini)
// supaya Word bisa memuatnya saat file .doc dibuka.
function handleUnduh(surat: Surat) {
  const tembusanList = surat.tembusan?.split("\n").filter(Boolean) ?? [];
  const tanggal = new Date(surat.tanggal).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const kopPath = surat.entitasSeleksi ? KOP_IMAGE[surat.entitasSeleksi] : null;
  const kopUrl = kopPath ? `${window.location.origin}${kopPath}` : null;

  const kopHtml = kopUrl
    ? `<div style="text-align:center;margin-bottom:20px;"><img src="${kopUrl}" style="width:100%;max-width:700px;" /></div>`
    : `<div style="text-align:center;border-bottom:4px double #000;padding-bottom:8px;margin-bottom:20px;">
  <p style="font-weight:600;text-transform:uppercase;margin:0;">Pemerintah Kota Batu</p>
  <p style="font-weight:700;text-transform:uppercase;font-size:16px;margin:4px 0;">Panitia Seleksi Direksi, Dewan Pengawas, dan Komisaris BUMD</p>
  <p style="font-size:11px;margin:0;">Jl. Panglima Sudirman, Kota Batu, Jawa Timur</p>
</div>`;

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<style>
  /* Tata naskah dinas resmi: HVS A4, tepi atas 1,5cm HANYA di halaman
     pertama (ada kop surat), 2,5cm di halaman lanjutan/lampiran; tepi
     bawah 2,5cm, kiri 3cm, kanan 2,5cm. mso-title-page:yes + "@page
     Section1:first" adalah cara resmi Word membedakan margin halaman
     pertama dari halaman berikutnya pada dokumen HTML. */
  @page Section1 {
    size: 21.0cm 29.7cm;
    margin: 2.5cm 2.5cm 2.5cm 3cm;
    mso-title-page: yes;
  }
  @page Section1:first {
    margin-top: 1.5cm;
  }
  div.Section1 { page: Section1; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.5; }
  .isi-surat { text-align: justify; }
</style>
</head>
<body>
<div class="Section1">
${kopHtml}
<table style="margin-bottom:20px;">
  <tr><td style="padding:1px 8px 1px 0;">Nomor</td><td>: ${surat.nomorSurat ?? "( belum diajukan )"}</td></tr>
  <tr><td style="padding:1px 8px 1px 0;">Sifat</td><td>: ${SIFAT_LABEL[surat.sifat] ?? surat.sifat}</td></tr>
  <tr><td style="padding:1px 8px 1px 0;">Lampiran</td><td>: ${surat.lampiran || "-"}</td></tr>
  <tr><td style="padding:1px 8px 1px 0;">Hal</td><td><b>: ${surat.judul}</b></td></tr>
</table>
<p style="text-align:right;">Kota Batu, ${tanggal}</p>
${surat.kepada ? `<p>Kepada Yth.<br><b>${surat.kepada}</b><br>di Tempat</p>` : ""}
<p style="white-space:pre-wrap;margin:20px 0;" class="isi-surat">${surat.isiSurat || "(isi surat belum diisi)"}</p>
<table style="margin-left:auto;text-align:left;width:260px;">
  <tr><td>Ketua Panitia Seleksi,</td></tr>
  <tr><td style="height:70px;"></td></tr>
  <tr><td style="font-weight:600;text-decoration:underline;">( belum ditandatangani )</td></tr>
</table>
${tembusanList.length ? `<p style="margin-top:20px;">Tembusan:</p><ol>${tembusanList.map((t) => `<li>${t}</li>`).join("")}</ol>` : ""}
</div>
</body></html>`;

  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(surat.nomorSurat ?? surat.judul).replace(/[\\/]/g, "-")}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SuratRow({ surat, isKetua }: { surat: Surat; isKetua: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showTolakForm, setShowTolakForm] = useState(false);
  const [catatanTolak, setCatatanTolak] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Pembuat boleh edit/hapus draf ATAU surat yang ditolak (revisi) —
  // begitu 'diajukan'/'disetujui', kunci. ketua_pansel/super_admin
  // boleh hapus surat SIAPA PUN selama belum 'disetujui' (wewenang
  // koreksi/pengawasan), meskipun bukan pembuatnya.
  const bisaEdit = surat.isPembuat && (surat.status === "draft" || surat.status === "ditolak");
  const bisaAjukan = surat.isPembuat && (surat.status === "draft" || surat.status === "ditolak");
  const bisaHapusPembuat = surat.isPembuat && (surat.status === "draft" || surat.status === "ditolak");
  const bisaHapusKetua = isKetua;
  const bisaHapus = bisaHapusPembuat || bisaHapusKetua;

  function handleAjukan() {
    startTransition(async () => {
      await ajukanSurat({ dokumenId: surat.id });
      router.refresh();
    });
  }

  function handleSetujui() {
    startTransition(async () => {
      await putuskanSurat({ dokumenId: surat.id, keputusan: "disetujui" });
      router.refresh();
    });
  }

  function handleTolak(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await putuskanSurat({ dokumenId: surat.id, keputusan: "ditolak", catatan: catatanTolak || undefined });
      setShowTolakForm(false);
      setCatatanTolak("");
      router.refresh();
    });
  }

  function handleHapus() {
    const peringatanTambahan =
      surat.status === "disetujui"
        ? " Surat ini SUDAH DISETUJUI & DITANDATANGANI (arsip resmi bernomor) — menghapusnya akan menghilangkan dokumen resmi ini secara PERMANEN."
        : "";
    if (!window.confirm(`Hapus surat "${surat.judul}"?${peringatanTambahan} Tindakan ini tidak bisa dibatalkan.`)) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await hapusSurat({ dokumenId: surat.id });
      if (!result.success) {
        setDeleteError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (showEdit) {
    return (
      <EditSuratForm
        surat={{
          id: surat.id,
          judul: surat.judul,
          jenisNaskah: surat.jenisNaskah,
          sifat: surat.sifat,
          lampiran: surat.lampiran,
          kepada: surat.kepada,
          isiSurat: surat.isiSurat,
          tembusan: surat.tembusan,
          entitasSeleksi: surat.entitasSeleksi,
        }}
        onDone={() => setShowEdit(false)}
      />
    );
  }

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-slate-900 truncate">{surat.judul}</p>
            {surat.sifat !== "biasa" && (
              <span className="badge bg-red-50 text-red-600 text-[10px] uppercase">{surat.sifat}</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {JENIS_LABEL[surat.jenisNaskah] ?? surat.jenisNaskah}
            {surat.nomorSurat && <span> · No. {surat.nomorSurat}</span>}
            {" · "}
            {new Date(surat.tanggal).toLocaleString("id-ID")}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`badge ${STATUS_COLOR[surat.status] ?? "bg-slate-100 text-slate-500"}`}>
            {surat.statusLabel}
          </span>

          {bisaAjukan && (
            <button
              disabled={isPending}
              onClick={handleAjukan}
              className="text-xs text-primary-700 font-medium hover:underline"
            >
              {surat.status === "ditolak" ? "Ajukan Ulang" : "Ajukan"}
            </button>
          )}

          {isKetua && surat.status === "diajukan" && !showTolakForm && (
            <div className="flex gap-2">
              <button
                disabled={isPending}
                onClick={handleSetujui}
                className="btn-secondary !py-1 !px-2.5 text-xs"
              >
                Setujui & Tanda Tangani
              </button>
              <button
                disabled={isPending}
                onClick={() => setShowTolakForm(true)}
                className="btn-ghost !py-1 !px-2.5 text-xs text-red-600"
              >
                Tolak & Minta Revisi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Form catatan revisi — muncul saat Ketua klik "Tolak & Minta
          Revisi", supaya anggota_pansel tahu persis apa yang perlu
          diperbaiki (bukan sekadar status "ditolak" tanpa penjelasan). */}
      {showTolakForm && (
        <form onSubmit={handleTolak} className="bg-red-50 border border-red-200 rounded-lg p-3 flex flex-col gap-2">
          <label className="text-xs font-medium text-red-700">
            Catatan revisi untuk anggota panitia (apa yang perlu diperbaiki)
          </label>
          <textarea
            className="input min-h-20 text-sm"
            value={catatanTolak}
            onChange={(e) => setCatatanTolak(e.target.value)}
            placeholder="mis. Perbaiki redaksi paragraf kedua, lampiran belum sesuai..."
          />
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="btn-primary !py-1.5 !px-3 text-xs">
              {isPending ? "Mengirim…" : "Kirim Penolakan & Revisi"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTolakForm(false);
                setCatatanTolak("");
              }}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Catatan revisi tersimpan — tampil ke pembuat selama surat
          masih berstatus 'ditolak' (belum direvisi & diajukan ulang). */}
      {surat.catatanRevisi && surat.status === "ditolak" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <span className="font-medium">🔁 Perlu direvisi:</span> {surat.catatanRevisi}
        </div>
      )}

      {/* Menu: lihat / edit / hapus / unduh / cetak */}
      <div className="flex items-center gap-3 text-xs border-t border-slate-100 pt-2.5">
        <button
          onClick={() => setShowDetail((v) => !v)}
          className="text-slate-500 hover:text-primary-700 font-medium"
        >
          {showDetail ? "Sembunyikan" : "Lihat"}
        </button>

        {bisaEdit && (
          <button onClick={() => setShowEdit(true)} className="text-slate-500 hover:text-primary-700 font-medium">
            Edit
          </button>
        )}

        <button onClick={() => handleUnduh(surat)} className="text-slate-500 hover:text-primary-700 font-medium">
          Unduh
        </button>

        {surat.nomorSurat && (
          <Link href={`/internal/dokumen/${surat.id}/cetak`} className="text-slate-500 hover:text-primary-700 font-medium">
            Cetak
          </Link>
        )}

        {bisaHapus && (
          <button
            disabled={isPending}
            onClick={handleHapus}
            className="text-red-500 hover:text-red-700 font-medium ml-auto"
          >
            Hapus
          </button>
        )}
      </div>

      {deleteError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{deleteError}</p>
      )}

      {showDetail && (
        <div className="bg-slate-50 rounded-lg p-3.5 text-sm text-slate-700 flex flex-col gap-2">
          <div>
            <span className="text-xs text-slate-400 block">Kop Surat</span>
            {surat.entitasSeleksi ? ENTITAS_LABEL[surat.entitasSeleksi] : <span className="text-slate-400">(Umum — tanpa kop khusus)</span>}
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Kepada</span>
            {surat.kepada || <span className="text-slate-400">-</span>}
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Lampiran</span>
            {surat.lampiran || "-"}
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Isi Surat</span>
            <p className="whitespace-pre-wrap">
              {surat.isiSurat || <span className="text-slate-400">(isi surat belum diisi)</span>}
            </p>
          </div>
          {surat.tembusan && (
            <div>
              <span className="text-xs text-slate-400 block">Tembusan</span>
              <ol className="list-decimal list-inside">
                {surat.tembusan.split("\n").filter(Boolean).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
