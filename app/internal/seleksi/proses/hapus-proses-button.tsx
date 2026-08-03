"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { hapusSeleksiProses } from "@/actions/seleksi-proses.actions";

export default function HapusProsesButton({ prosesId, label }: { prosesId: string; label: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Hapus proses "${label}"? Semua posisi & 24 checklist tugasnya ikut terhapus. Peserta yang sudah tertaut akan otomatis terlepas (tidak ikut terhapus). Tindakan ini tidak bisa dibatalkan.`)) return;

    setError(null);
    startTransition(async () => {
      try {
        const r = await hapusSeleksiProses({ id: prosesId });
        if (!r.success) {
          setError(r.error);
          return;
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? `Error tak terduga: ${err.message}` : "Error tak terduga saat menghubungi server");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
      >
        {isPending ? "Menghapus…" : "🗑️ Hapus"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
