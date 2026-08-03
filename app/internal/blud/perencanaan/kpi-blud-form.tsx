"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { tambahKpiBlud } from "@/actions/monev-blud.actions";

const KATEGORI_OPTIONS = [
  { value: "pelayanan", label: "Pelayanan" },
  { value: "keuangan", label: "Keuangan" },
  { value: "tata_kelola", label: "Tata Kelola" },
  { value: "sdm", label: "SDM" },
  { value: "pengembangan", label: "Pengembangan" },
];

export default function KpiBludForm({ bludId, tahun }: { bludId: string; tahun: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ kategori: "pelayanan", namaIndikator: "", targetNilai: "", satuan: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await tambahKpiBlud({
      bludId,
      tahun,
      kategori: form.kategori,
      namaIndikator: form.namaIndikator,
      targetNilai: form.targetNilai,
      satuan: form.satuan || undefined,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setForm({ kategori: "pelayanan", namaIndikator: "", targetNilai: "", satuan: "" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-cyan-700 font-medium hover:underline mt-2">
        + Tambah target KPI
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-wrap items-end gap-2 bg-slate-50 rounded-lg p-3">
      <select
        className="input !py-1.5 !px-2 text-xs w-32"
        value={form.kategori}
        onChange={(e) => setForm((f) => ({ ...f, kategori: e.target.value }))}
      >
        {KATEGORI_OPTIONS.map((k) => (
          <option key={k.value} value={k.value}>{k.label}</option>
        ))}
      </select>
      <input
        required
        placeholder="Nama indikator"
        className="input !py-1.5 !px-2 text-xs flex-1 min-w-32"
        value={form.namaIndikator}
        onChange={(e) => setForm((f) => ({ ...f, namaIndikator: e.target.value }))}
      />
      <input
        required
        type="number"
        placeholder="Target"
        className="input !py-1.5 !px-2 text-xs w-24"
        value={form.targetNilai}
        onChange={(e) => setForm((f) => ({ ...f, targetNilai: e.target.value }))}
      />
      <input
        placeholder="Satuan"
        className="input !py-1.5 !px-2 text-xs w-20"
        value={form.satuan}
        onChange={(e) => setForm((f) => ({ ...f, satuan: e.target.value }))}
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
