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

// Kombinasi 2-posisi dibatasi jadi PILIHAN JADI (bukan 2 dropdown bebas)
// supaya panitia tidak mungkin salah pilih kombinasi yang tidak valid.
const KOMBINASI_OPTIONS = [
  { value: "direksi+komisaris", labelUtama: "Direksi", labelPasangan: "Komisaris", jenisPasangan: "komisaris" },
  { value: "direksi+dewas", labelUtama: "Direksi", labelPasangan: "Dewan Pengawas", jenisPasangan: "dewas" },
];

type Mode = "satu" | "dua";

export default function BuatProsesForm({ bumdList }: { bumdList: { id: string; nama: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("satu");

  // Mode satu posisi
  const [jenisSatu, setJenisSatu] = useState("direksi");
  const [jabatanSatu, setJabatanSatu] = useState("");

  // Mode dua posisi (kombinasi jadi)
  const [kombinasi, setKombinasi] = useState(KOMBINASI_OPTIONS[0].value);
  const [jabatanUtama, setJabatanUtama] = useState("");
  const [jabatanPasangan, setJabatanPasangan] = useState("");

  const [bumdId, setBumdId] = useState("");
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const kombinasiTerpilih = KOMBINASI_OPTIONS.find((k) => k.value === kombinasi)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const lowongan =
      mode === "satu"
        ? [{ jenisSeleksi: jenisSatu, jabatanLowong: jabatanSatu }]
        : [
            { jenisSeleksi: "direksi", jabatanLowong: jabatanUtama },
            { jenisSeleksi: kombinasiTerpilih.jenisPasangan, jabatanLowong: jabatanPasangan },
          ];

    try {
      const result = await buatSeleksiProses({ lowongan, bumdId: bumdId || undefined, tahun });
      setLoading(false);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/internal/seleksi/proses/${result.id}`);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? `Error tak terduga: ${err.message}` : "Error tak terduga saat menghubungi server");
    }
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

      <div className="flex gap-2 text-sm" role="radiogroup" aria-label="Jumlah posisi">
        <button
          type="button"
          onClick={() => setMode("satu")}
          className={`flex-1 px-3 py-2 rounded-lg border text-left ${mode === "satu" ? "bg-brand-50 border-brand-300 text-brand-700 font-medium" : "border-slate-200 text-slate-500"}`}
        >
          1 Posisi<br /><span className="font-normal text-xs">Direksi, Komisaris, Dewas, atau Pegawai BLUD saja</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("dua")}
          className={`flex-1 px-3 py-2 rounded-lg border text-left ${mode === "dua" ? "bg-brand-50 border-brand-300 text-brand-700 font-medium" : "border-slate-200 text-slate-500"}`}
        >
          2 Posisi Sekaligus<br /><span className="font-normal text-xs">Direksi + Komisaris/Dewas dalam 1 jadwal</span>
        </button>
      </div>

      {mode === "satu" ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Jenis Seleksi</label>
            <select className="input" value={jenisSatu} onChange={(e) => setJenisSatu(e.target.value)}>
              {JENIS_OPTIONS.map((j) => (
                <option key={j.value} value={j.value}>{j.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Jabatan Lowong</label>
            <input
              required
              className="input"
              placeholder="mis. Direktur Utama"
              value={jabatanSatu}
              onChange={(e) => setJabatanSatu(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <label className="label">Kombinasi</label>
            <select className="input" value={kombinasi} onChange={(e) => setKombinasi(e.target.value)}>
              {KOMBINASI_OPTIONS.map((k) => (
                <option key={k.value} value={k.value}>{k.labelUtama} &amp; {k.labelPasangan}</option>
              ))}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Jabatan Lowong — {kombinasiTerpilih.labelUtama}</label>
              <input
                required
                className="input"
                placeholder="mis. Direktur Utama"
                value={jabatanUtama}
                onChange={(e) => setJabatanUtama(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Jabatan Lowong — {kombinasiTerpilih.labelPasangan}</label>
              <input
                required
                className="input"
                placeholder={`mis. Anggota ${kombinasiTerpilih.labelPasangan}`}
                value={jabatanPasangan}
                onChange={(e) => setJabatanPasangan(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Akan dibuat 1 proses (1 Pansel, 1 checklist 24 tugas) yang menaungi kedua posisi ini sekaligus.
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">BUMD (opsional)</label>
          <select className="input" value={bumdId} onChange={(e) => setBumdId(e.target.value)}>
            <option value="">— tidak spesifik —</option>
            {bumdList.map((b) => (
              <option key={b.id} value={b.id}>{b.nama}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tahun</label>
          <input required type="number" className="input" value={tahun} onChange={(e) => setTahun(e.target.value)} />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 whitespace-pre-wrap">{error}</p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-fit">
        {loading ? "Membuat…" : mode === "dua" ? "Buat Proses (2 posisi, 24 tugas otomatis)" : "Buat Proses (24 tugas otomatis dibuat)"}
      </button>
    </form>
  );
}
