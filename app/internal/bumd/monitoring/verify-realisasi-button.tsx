"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifikasiRealisasi } from "@/actions/monev-bumd.actions";

export default function VerifyRealisasiButton({ realisasiId }: { realisasiId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handle(status: "terverifikasi" | "ditolak") {
    startTransition(async () => {
      await verifikasiRealisasi({ realisasiId, status });
      router.refresh();
    });
  }

  return (
    <div className="flex gap-1.5">
      <button disabled={isPending} onClick={() => handle("terverifikasi")} className="text-xs text-accent-700 hover:underline">
        Verifikasi
      </button>
      <button disabled={isPending} onClick={() => handle("ditolak")} className="text-xs text-red-600 hover:underline">
        Tolak
      </button>
    </div>
  );
}
