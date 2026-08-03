"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { laporRealisasi } from "@/actions/monev-bumd.actions";

const PERIODE_OPTIONS = [
  { value: "triwulan_1", label: "Triwulan I" },
  { value: "triwulan_2", label: "Triwulan II" },
  { value: "triwulan_3", label: "Triwulan III" },
  { value: "triwulan_4", label: "Triwulan IV" },
  { value: "semester_1", label: "Semester I" },
  { value: "semester_2", label: "Semester II" },
  { value: "tahunan", label: "Tahunan" },
];

export default function RealisasiForm({ bumdKpiId }: { bumdKpiId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    periode: "triwulan_1",
    nilaiRealisasi: "",
    analisisPenyebab: "",
    rencanaTindakLanjut: "",
    buktiDukungUrl: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await laporRealisasi({
      bumdKpiId,
      periode: form.periode,
      nilaiRealisasi: form.nilaiRealisasi,
      analisisPenyebab: form.analisisPenyebab || undefined,
      rencanaTindakLanjut: form.rencanaTindakLanjut || undefined,
      buktiDukungUrl: form.buktiDukungUrl || undefined,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setForm({ periode: "triwulan_1", nilaiRealisasi: "", analisisPenyebab: "", rencanaTindakLanjut: "", buktiDukungUrl: "" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-primary-700 font-medium hover:underline mt-2">
        + Lapor realisasi
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 bg-slate-50 rounded-lg p-3">
      <div className="flex gap-2">
        <select
          className="input !py-1.5 !px-2 text-xs w-28"
          value={form.periode}
          onChange={(e) => setForm((f) => ({ ...f, periode: e.target.value }))}
        >
          {PERIODE_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <input
          required
          type="number"
          placeholder="Nilai realisasi"
          className="input !py-1.5 !px-2 text-xs flex-1"
          value={form.nilaiRealisasi}
          onChange={(e) => setForm((f) => ({ ...f, nilaiRealisasi: e.target.value }))}
        />
      </div>
      <textarea
        placeholder="Analisis penyebab (wajib diisi kalau capaian jauh dari target)"
        className="input !py-1.5 !px-2 text-xs min-h-14"
        value={form.analisisPenyebab}
        onChange={(e) => setForm((f) => ({ ...f, analisisPenyebab: e.target.value }))}
      />
      <textarea
        placeholder="Rencana tindak lanjut"
        className="input !py-1.5 !px-2 text-xs min-h-14"
        value={form.rencanaTindakLanjut}
        onChange={(e) => setForm((f) => ({ ...f, rencanaTindakLanjut: e.target.value }))}
      />
      <input
        placeholder="Tautan bukti dukung (opsional)"
        className="input !py-1.5 !px-2 text-xs"
        value={form.buktiDukungUrl}
        onChange={(e) => setForm((f) => ({ ...f, buktiDukungUrl: e.target.value }))}
      />
      <div className="flex items-center gap-2">
        <button type="submit" disabled={loading} className="btn-primary !py-1.5 !px-3 text-xs w-fit">
          {loading ? "…" : "Simpan Laporan"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400">
          Batal
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
