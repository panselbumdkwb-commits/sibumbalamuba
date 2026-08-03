"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifikasiRealisasiBlud } from "@/actions/monev-blud.actions";

export default function VerifikasiBludPanel({ realisasiId }: { realisasiId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [isPending, startTransition] = useTransition();

  function handle(status: "perlu_perbaikan" | "disetujui") {
    startTransition(async () => {
      await verifikasiRealisasiBlud({ realisasiId, status, catatanVerifikasi: catatan || undefined });
      setOpen(false);
      setCatatan("");
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-primary-700 font-medium hover:underline mt-2">
        Verifikasi (OPD Pembina)
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <textarea
        placeholder="Catatan verifikasi (wajib diisi kalau meminta perbaikan)"
        className="input !py-1.5 !px-2 text-xs min-h-14"
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          disabled={isPending}
          onClick={() => handle("disetujui")}
          className="btn-secondary !py-1 !px-2.5 text-xs"
        >
          Setujui
        </button>
        <button
          disabled={isPending}
          onClick={() => handle("perlu_perbaikan")}
          className="btn-ghost !py-1 !px-2.5 text-xs text-amber-700"
        >
          Minta Perbaikan
        </button>
        <button onClick={() => setOpen(false)} className="text-xs text-slate-400">
          Batal
        </button>
      </div>
    </div>
  );
}
