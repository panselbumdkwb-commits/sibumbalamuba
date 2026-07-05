"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateStatusTahapan, hubungkanDokumen } from "@/actions/seleksi-proses.actions";

type Tugas = {
  id: string;
  nama_tugas: string;
  output_label: string;
  dasar_regulasi: string;
  status: string;
  dokumen_id: string | null;
  tanggal_selesai: string | null;
  catatan: string | null;
};

type Dokumen = { id: string; judul: string; status: string };

const STATUS_OPTIONS = [
  { value: "belum_mulai", label: "Belum Mulai" },
  { value: "proses", label: "Sedang Proses" },
  { value: "selesai", label: "Selesai" },
];

const STATUS_COLOR: Record<string, string> = {
  belum_mulai: "bg-slate-100 text-slate-500",
  proses: "bg-amber-50 text-amber-700",
  selesai: "bg-accent-50 text-accent-700",
};

export default function TahapanRow({ tugas, dokumenList }: { tugas: Tugas; dokumenList: Dokumen[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [catatan, setCatatan] = useState(tugas.catatan ?? "");
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: string) {
    startTransition(async () => {
      await updateStatusTahapan({ tahapanId: tugas.id, status, catatan: catatan || undefined });
      router.refresh();
    });
  }

  function handleDokumenChange(dokumenId: string) {
    startTransition(async () => {
      await hubungkanDokumen({ tahapanId: tugas.id, dokumenId: dokumenId || null });
      router.refresh();
    });
  }

  const dokumenTertaut = dokumenList.find((d) => d.id === tugas.dokumen_id);

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800">{tugas.nama_tugas}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Output: {tugas.output_label} · Dasar: {tugas.dasar_regulasi}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            disabled={isPending}
            defaultValue={tugas.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`input !py-1 !px-2 text-xs w-32 ${STATUS_COLOR[tugas.status] ?? ""}`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button onClick={() => setExpanded((v) => !v)} className="text-xs text-slate-400 hover:text-slate-700">
            {expanded ? "Tutup" : "Detail"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-3">
          <div>
            <label className="text-xs text-slate-400">Dokumen output (dibuat lewat Surat & Dokumen)</label>
            <select
              disabled={isPending}
              defaultValue={tugas.dokumen_id ?? ""}
              onChange={(e) => handleDokumenChange(e.target.value)}
              className="input !py-1.5 !px-2 text-xs mt-1"
            >
              <option value="">— belum ditautkan —</option>
              {dokumenList.map((d) => (
                <option key={d.id} value={d.id}>{d.judul} ({d.status})</option>
              ))}
            </select>
            {dokumenTertaut && (
              <p className="text-xs text-slate-400 mt-1">
                Status dokumen: <span className="font-medium">{dokumenTertaut.status}</span>
              </p>
            )}
            <Link href="/internal/dokumen" className="text-xs text-primary-700 hover:underline mt-1 inline-block">
              + Buat draf surat baru di Surat &amp; Dokumen
            </Link>
          </div>

          <div>
            <label className="text-xs text-slate-400">Catatan</label>
            <textarea
              className="input !py-1.5 !px-2 text-xs min-h-14 mt-1"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              onBlur={() => handleStatusChange(tugas.status)}
              placeholder="Catatan pelaksanaan tugas ini (opsional)"
            />
          </div>

          {tugas.tanggal_selesai && (
            <p className="text-xs text-slate-400">Diselesaikan: {tugas.tanggal_selesai}</p>
          )}
        </div>
      )}
    </div>
  );
}
