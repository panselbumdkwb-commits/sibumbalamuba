"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buatSurat } from "@/actions/dokumen.actions";

export default function CreateSuratForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [judul, setJudul] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await buatSurat({ judul });
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setJudul("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary w-fit">
        + Buat Draf Surat
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-medium text-slate-900">Draf Surat Baru</p>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-slate-700">
          Batal
        </button>
      </div>
      <div>
        <label className="label">Judul / Perihal Surat</label>
        <input
          required
          minLength={5}
          className="input"
          placeholder="mis. Surat Undangan Tes Wawancara Tahap II"
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-fit">
        {loading ? "Menyimpan…" : "Simpan Draf"}
      </button>
    </form>
  );
}
