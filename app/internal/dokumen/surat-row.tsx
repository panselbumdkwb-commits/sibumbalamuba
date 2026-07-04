"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ajukanSurat, putuskanSurat } from "@/actions/dokumen.actions";

type Surat = {
  id: string;
  judul: string;
  status: string;
  statusLabel: string;
  isPembuat: boolean;
  adaApprover: boolean;
  tanggal: string;
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-slate-100 text-slate-500",
  diajukan: "bg-amber-50 text-amber-700",
  disetujui: "bg-accent-50 text-accent-700",
  ditolak: "bg-red-50 text-red-600",
  diarsipkan: "bg-slate-100 text-slate-400",
};

export default function SuratRow({ surat, isKetua }: { surat: Surat; isKetua: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAjukan() {
    startTransition(async () => {
      await ajukanSurat({ dokumenId: surat.id });
      router.refresh();
    });
  }

  function handlePutuskan(keputusan: "disetujui" | "ditolak") {
    startTransition(async () => {
      await putuskanSurat({ dokumenId: surat.id, keputusan });
      router.refresh();
    });
  }

  return (
    <div className="card p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="font-medium text-slate-900 truncate">{surat.judul}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {new Date(surat.tanggal).toLocaleString("id-ID")}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={`badge ${STATUS_COLOR[surat.status] ?? "bg-slate-100 text-slate-500"}`}>
          {surat.statusLabel}
        </span>

        {surat.isPembuat && surat.status === "draft" && (
          <button
            disabled={isPending}
            onClick={handleAjukan}
            className="text-xs text-primary-700 font-medium hover:underline"
          >
            Ajukan
          </button>
        )}

        {isKetua && surat.status === "diajukan" && (
          <div className="flex gap-2">
            <button
              disabled={isPending}
              onClick={() => handlePutuskan("disetujui")}
              className="btn-secondary !py-1 !px-2.5 text-xs"
            >
              Setujui & Tanda Tangani
            </button>
            <button
              disabled={isPending}
              onClick={() => handlePutuskan("ditolak")}
              className="btn-ghost !py-1 !px-2.5 text-xs text-red-600"
            >
              Tolak
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
