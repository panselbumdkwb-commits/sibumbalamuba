"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buatInstrumen } from "@/actions/ukk-instrumen.actions";

const ASPEK_OPTIONS = [
  { value: "integritas", label: "Integritas" },
  { value: "kepemimpinan", label: "Kepemimpinan" },
  { value: "kompetensi_manajerial", label: "Kompetensi Manajerial" },
  { value: "kompetensi_bisnis", label: "Kompetensi Bisnis" },
  { value: "kompetensi_keuangan", label: "Kompetensi Keuangan" },
  { value: "tata_kelola", label: "Tata Kelola" },
  { value: "regulasi", label: "Regulasi" },
  { value: "komunikasi", label: "Komunikasi" },
  { value: "problem_solving", label: "Problem Solving" },
  { value: "business_plan", label: "Business Plan" },
];

export default function TambahInstrumenForm({ seleksiProsesId }: { seleksiProsesId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ aspek: "integritas", bobotPersen: "10", deskripsi: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await buatInstrumen({
      seleksiProsesId,
      aspek: form.aspek,
      bobot: Number(form.bobotPersen) / 100,
      deskripsiIndikator: form.deskripsi || undefined,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setForm({ aspek: "integritas", bobotPersen: "10", deskripsi: "" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-primary-700 font-medium hover:underline">
        + Tambah aspek penilaian
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-wrap items-end gap-2 bg-slate-50 rounded-lg p-3">
      <select
        className="input !py-1.5 !px-2 text-xs w-44"
        value={form.aspek}
        onChange={(e) => setForm((f) => ({ ...f, aspek: e.target.value }))}
      >
        {ASPEK_OPTIONS.map((a) => (
          <option key={a.value} value={a.value}>{a.label}</option>
        ))}
      </select>
      <div className="flex items-center gap-1">
        <input
          required
          type="number"
          min={1}
          max={100}
          className="input !py-1.5 !px-2 text-xs w-16"
          value={form.bobotPersen}
          onChange={(e) => setForm((f) => ({ ...f, bobotPersen: e.target.value }))}
        />
        <span className="text-xs text-slate-400">%</span>
      </div>
      <input
        placeholder="Deskripsi indikator (opsional)"
        className="input !py-1.5 !px-2 text-xs flex-1 min-w-32"
        value={form.deskripsi}
        onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
      />
      <button type="submit" disabled={loading} className="btn-primary !py-1.5 !px-3 text-xs">
        {loading ? "…" : "Tambah"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400">
        Batal
      </button>
      {error && <p className="text-xs text-red-600 w-full">{error}</p>}
    </form>
  );
}
