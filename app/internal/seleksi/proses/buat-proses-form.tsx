"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buatSeleksiProses } from "@/actions/seleksi-proses.actions";

const JENIS_OPTIONS = [
  { value: "direksi", label: "Direksi" },
  { value: "dewas", label: "Dewan Pengawas" },
  { value: "komisaris", label: "Komisaris" },
  { value: "pegawai_blud", label: "Pegawai BLUD" },
];

export default function BuatProsesForm({ bumdList }: { bumdList: { id: string; nama: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    jenisSeleksi: "direksi",
    bumdId: "",
    jabatanLowong: "",
    tahun: String(new Date().getFullYear()),
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await buatSeleksiProses({
      jenisSeleksi: form.jenisSeleksi,
      bumdId: form.bumdId || undefined,
      jabatanLowong: form.jabatanLowong,
      tahun: form.tahun,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push(`/internal/seleksi/proses/${result.id}`);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary w-fit">
        + Mulai Proses Seleksi Baru
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-medium text-slate-900">Proses Seleksi Baru</p>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-slate-700">
          Batal
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Jenis Seleksi</label>
          <select
            className="input"
            value={form.jenisSeleksi}
            onChange={(e) => setForm((f) => ({ ...f, jenisSeleksi: e.target.value }))}
          >
            {JENIS_OPTIONS.map((j) => (
              <option key={j.value} value={j.value}>{j.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">BUMD (opsional)</label>
          <select
            className="input"
            value={form.bumdId}
            onChange={(e) => setForm((f) => ({ ...f, bumdId: e.target.value }))}
          >
            <option value="">— tidak spesifik —</option>
            {bumdList.map((b) => (
              <option key={b.id} value={b.id}>{b.nama}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Jabatan Lowong</label>
          <input
            required
            className="input"
            placeholder="mis. Direktur Utama"
            value={form.jabatanLowong}
            onChange={(e) => setForm((f) => ({ ...f, jabatanLowong: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Tahun</label>
          <input
            required
            type="number"
            className="input"
            value={form.tahun}
            onChange={(e) => setForm((f) => ({ ...f, tahun: e.target.value }))}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-fit">
        {loading ? "Membuat…" : "Buat Proses (24 tugas otomatis dibuat)"}
      </button>
    </form>
  );
}
