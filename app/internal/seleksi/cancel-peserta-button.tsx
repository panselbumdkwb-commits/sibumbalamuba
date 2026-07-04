"use client";

import { useState, useTransition } from "react";
import { batalkanPendaftaran } from "@/actions/seleksi.actions";

export default function CancelPesertaButton({ pesertaId }: { pesertaId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (done) return null;

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs text-slate-400 hover:text-red-600"
      >
        Batalkan
      </button>
    );
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await batalkanPendaftaran({ pesertaId });
      if (result.success) setDone(true);
    });
  }

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-slate-500">Yakin batalkan?</span>
      <button
        disabled={isPending}
        onClick={handleConfirm}
        className="text-red-600 font-medium hover:underline"
      >
        Ya, batalkan
      </button>
      <button
        disabled={isPending}
        onClick={() => setConfirming(false)}
        className="text-slate-400 hover:underline"
      >
        Tidak
      </button>
    </div>
  );
}
