"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { tambahRisiko } from "@/actions/monev-bumd.actions";

const KATEGORI_OPTIONS = [
  { value: "strategis", label: "Strategis" },
  { value: "keuangan", label: "Keuangan" },
  { value: "operasional", label: "Operasional" },
  { value: "sdm", label: "SDM" },
  { value: "hukum", label: "Hukum" },
  { value: "reputasi", label: "Reputasi" },
];

const TINGKAT_OPTIONS = [
  { value: "rendah", label: "Rendah" },
  { value: "sedang", label: "Sedang" },
  { value: "tinggi", label: "Tinggi" },
];

export default function TambahRisikoForm({ bumdId, tahun }: { bumdId: string; tahun: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    kategori: "operasional",
    deskripsi: "",
    tingkat: "sedang",
    mitigasi: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await tambahRisiko({
      bumdId,
      tahun,
      kategori: form.kategori,
      deskripsi: form.deskripsi,
      tingkat: form.tingkat,
      mitigasi: form.mitigasi || undefined,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setForm({ kategori: "operasional", deskripsi: "", tingkat: "sedang", mitigasi: "" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-primary-700 font-medium hover:underline mt-1 w-fit">
        + Catat risiko baru
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 bg-slate-50 rounded-lg p-3">
      <div className="flex gap-2">
        <select
          className="input !py-1.5 !px-2 text-xs w-32"
          value={form.kategori}
          onChange={(e) => setForm((f) => ({ ...f, kategori: e.target.value }))}
        >
          {KATEGORI_OPTIONS.map((k) => (
            <option key={k.value} value={k.value}>{k.label}</option>
          ))}
        </select>
        <select
          className="input !py-1.5 !px-2 text-xs w-28"
          value={form.tingkat}
          onChange={(e) => setForm((f) => ({ ...f, tingkat: e.target.value }))}
        >
          {TINGKAT_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <textarea
        required
        placeholder="Deskripsi risiko"
        className="input !py-1.5 !px-2 text-xs min-h-16"
        value={form.deskripsi}
        onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
      />
      <input
        placeholder="Rencana mitigasi (opsional)"
        className="input !py-1.5 !px-2 text-xs"
        value={form.mitigasi}
        onChange={(e) => setForm((f) => ({ ...f, mitigasi: e.target.value }))}
      />
      <div className="flex items-center gap-2">
        <button type="submit" disabled={loading} className="btn-primary !py-1.5 !px-3 text-xs w-fit">
          {loading ? "…" : "Simpan"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400">
          Batal
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
