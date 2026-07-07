"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { buatBeritaAcaraUkk } from "@/actions/ukk-instrumen.actions";

export default function BuatBeritaAcaraButton({ seleksiProsesId }: { seleksiProsesId: string }) {
  const [isPending, startTransition] = useTransition();
  const [selesai, setSelesai] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      const result = await buatBeritaAcaraUkk({ seleksiProsesId });
      if (result.success) {
        setSelesai(true);
      } else {
        setError(result.error);
      }
    });
  }

  if (selesai) {
    return (
      <p className="text-sm text-accent-700">
        Draf Berita Acara dibuat.{" "}
        <Link href="/internal/dokumen" className="underline font-medium">
          Buka di Surat & Dokumen →
        </Link>
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleClick} disabled={isPending} className="btn-primary">
        {isPending ? "Membuat…" : "📄 Buat Draf Berita Acara UKK"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
