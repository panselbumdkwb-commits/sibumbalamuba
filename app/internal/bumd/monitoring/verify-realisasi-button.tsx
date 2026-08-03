"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifikasiRealisasi } from "@/actions/monev-bumd.actions";

export default function VerifyRealisasiButton({ realisasiId }: { realisasiId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [isPending, startTransition] = useTransition();

  function handle(status: "perlu_perbaikan" | "terverifikasi" | "ditolak") {
    startTransition(async () => {
      await verifikasiRealisasi({ realisasiId, status, catatanVerifikasi: catatan || undefined });
      setOpen(false);
      setCatatan("");
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-primary-700 font-medium hover:underline">
        Tanggapi
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2 w-full">
      <textarea
        placeholder="Analisa/tanggapan (wajib diisi kalau minta perbaikan atau menolak)"
        className="input !py-1.5 !px-2 text-xs min-h-14"
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
      />
      <div className="flex gap-2">
        <button disabled={isPending} onClick={() => handle("terverifikasi")} className="btn-secondary !py-1 !px-2.5 text-xs">
          Setujui
        </button>
        <button disabled={isPending} onClick={() => handle("perlu_perbaikan")} className="btn-ghost !py-1 !px-2.5 text-xs text-amber-700">
          Minta Perbaikan
        </button>
        <button disabled={isPending} onClick={() => handle("ditolak")} className="btn-ghost !py-1 !px-2.5 text-xs text-red-600">
          Tolak
        </button>
        <button onClick={() => setOpen(false)} className="text-xs text-slate-400">
          Batal
        </button>
      </div>
    </div>
  );
}
