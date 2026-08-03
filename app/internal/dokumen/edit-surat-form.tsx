"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSurat } from "@/actions/dokumen.actions";

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

const ENTITAS_OPTIONS = [
  { value: "", label: "(Umum — tanpa kop khusus)" },
  { value: "perumdam", label: "Perumdam Among Tirto" },
  { value: "pt_bwr", label: "PT. Batu Wisata Resource" },
];

type EditableSurat = {
  id: string;
  judul: string;
  jenisNaskah: string;
  sifat: string;
  lampiran: string | null;
  kepada: string | null;
  isiSurat: string | null;
  tembusan: string | null;
  entitasSeleksi: string | null;
};

export default function EditSuratForm({
  surat,
  onDone,
}: {
  surat: EditableSurat;
  onDone: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    judul: surat.judul,
    jenisNaskah: surat.jenisNaskah,
    sifat: surat.sifat,
    lampiran: surat.lampiran ?? "-",
    kepada: surat.kepada ?? "",
    isiSurat: surat.isiSurat ?? "",
    tembusan: surat.tembusan ?? "",
    entitasSeleksi: surat.entitasSeleksi ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await updateSurat({
      dokumenId: surat.id,
      judul: form.judul,
      jenisNaskah: form.jenisNaskah,
      sifat: form.sifat,
      lampiran: form.lampiran || undefined,
      kepada: form.kepada || undefined,
      isiSurat: form.isiSurat || undefined,
      tembusan: form.tembusan || undefined,
      entitasSeleksi: (form.entitasSeleksi || undefined) as "perumdam" | "pt_bwr" | undefined,
    });
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 flex flex-col gap-4 border-primary-200">
      <div className="flex items-center justify-between">
        <p className="font-medium text-slate-900">Edit Draf Surat</p>
        <button type="button" onClick={onDone} className="text-sm text-slate-400 hover:text-slate-700">
          Batal
        </button>
      </div>

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
        <label className="label">Kop Surat (BUMD Tujuan Seleksi)</label>
        <select
          className="input"
          value={form.entitasSeleksi}
          onChange={(e) => setForm((f) => ({ ...f, entitasSeleksi: e.target.value }))}
        >
          {ENTITAS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Hal / Perihal</label>
        <input
          required
          minLength={5}
          className="input"
          value={form.judul}
          onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Kepada</label>
          <input
            className="input"
            value={form.kepada}
            onChange={(e) => setForm((f) => ({ ...f, kepada: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Lampiran</label>
          <input
            className="input"
            value={form.lampiran}
            onChange={(e) => setForm((f) => ({ ...f, lampiran: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <label className="label">Isi Surat</label>
        <textarea
          className="input min-h-28"
          value={form.isiSurat}
          onChange={(e) => setForm((f) => ({ ...f, isiSurat: e.target.value }))}
        />
      </div>

      <div>
        <label className="label">Tembusan (opsional, satu per baris)</label>
        <textarea
          className="input min-h-16"
          value={form.tembusan}
          onChange={(e) => setForm((f) => ({ ...f, tembusan: e.target.value }))}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-fit">
        {loading ? "Menyimpan…" : "Simpan Perubahan"}
      </button>
    </form>
  );
}
