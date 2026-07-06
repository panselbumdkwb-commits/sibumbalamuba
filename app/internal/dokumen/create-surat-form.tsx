"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buatSurat } from "@/actions/dokumen.actions";

const JENIS_OPTIONS = [
  { value: "surat_biasa", label: "Surat Biasa" },
  { value: "surat_undangan", label: "Surat Undangan" },
  { value: "nota_dinas", label: "Nota Dinas" },
  { value: "berita_acara", label: "Berita Acara" },
  { value: "surat_keterangan", label: "Surat Keterangan" },
  { value: "surat_edaran", label: "Surat Edaran" },
  { value: "laporan", label: "Laporan" },
  { value: "surat_pengantar", label: "Surat Pengantar" },
];

const SIFAT_OPTIONS = [
  { value: "biasa", label: "Biasa" },
  { value: "penting", label: "Penting" },
  { value: "segera", label: "Segera" },
  { value: "rahasia", label: "Rahasia" },
];

export default function CreateSuratForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    judul: "",
    jenisNaskah: "surat_biasa",
    sifat: "biasa",
    lampiran: "-",
    kepada: "",
    isiSurat: "",
    tembusan: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await buatSurat({
      judul: form.judul,
      jenisNaskah: form.jenisNaskah,
      sifat: form.sifat,
      lampiran: form.lampiran || undefined,
      kepada: form.kepada || undefined,
      isiSurat: form.isiSurat || undefined,
      tembusan: form.tembusan || undefined,
    });
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setForm({ judul: "", jenisNaskah: "surat_biasa", sifat: "biasa", lampiran: "-", kepada: "", isiSurat: "", tembusan: "" });
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
    <form onSubmit={handleSubmit} className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-medium text-slate-900">Draf Surat Baru</p>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-slate-700">
          Batal
        </button>
      </div>

      <p className="text-xs text-slate-400 -mt-2">
        Nomor surat akan dibuat otomatis begitu surat diajukan, sesuai
        format naskah dinas (Permendagri No. 1/2023).
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Jenis Naskah</label>
          <select
            className="input"
            value={form.jenisNaskah}
            onChange={(e) => setForm((f) => ({ ...f, jenisNaskah: e.target.value }))}
          >
            {JENIS_OPTIONS.map((j) => (
              <option key={j.value} value={j.value}>{j.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Sifat</label>
          <select
            className="input"
            value={form.sifat}
            onChange={(e) => setForm((f) => ({ ...f, sifat: e.target.value }))}
          >
            {SIFAT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Hal / Perihal</label>
        <input
          required
          minLength={5}
          className="input"
          placeholder="mis. Undangan Rapat Koordinasi Panitia Seleksi"
          value={form.judul}
          onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Kepada</label>
          <input
            className="input"
            placeholder="mis. Direktur Utama Perumdam Among Tirto"
            value={form.kepada}
            onChange={(e) => setForm((f) => ({ ...f, kepada: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Lampiran</label>
          <input
            className="input"
            placeholder="mis. 1 (satu) berkas, atau -"
            value={form.lampiran}
            onChange={(e) => setForm((f) => ({ ...f, lampiran: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <label className="label">Isi Surat</label>
        <textarea
          className="input min-h-28"
          placeholder="Isi/badan surat..."
          value={form.isiSurat}
          onChange={(e) => setForm((f) => ({ ...f, isiSurat: e.target.value }))}
        />
      </div>

      <div>
        <label className="label">Tembusan (opsional, satu per baris)</label>
        <textarea
          className="input min-h-16"
          placeholder={"Sekretaris Daerah Kota Batu\nKepala BPSDA"}
          value={form.tembusan}
          onChange={(e) => setForm((f) => ({ ...f, tembusan: e.target.value }))}
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
