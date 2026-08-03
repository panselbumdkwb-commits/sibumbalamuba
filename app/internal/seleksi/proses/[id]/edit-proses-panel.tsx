"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editSeleksiProses, tambahLowongan, updateLowongan, hapusLowongan, hapusSeleksiProses } from "@/actions/seleksi-proses.actions";

const JENIS_OPTIONS = [
  { value: "direksi", label: "Direksi" },
  { value: "dewas", label: "Dewan Pengawas" },
  { value: "komisaris", label: "Komisaris" },
  { value: "pegawai_blud", label: "Pegawai BLUD" },
];

type Lowongan = { id: string; jenis_seleksi: string; jabatan_lowong: string };
type Bumd = { id: string; nama: string };

export default function EditProsesPanel({
  prosesId,
  tahun,
  bumdId,
  bumdList,
  lowonganList,
  defaultOpen = false,
}: {
  prosesId: string;
  tahun: number;
  bumdId: string | null;
  bumdList: Bumd[];
  lowonganList: Lowongan[];
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [tahunForm, setTahunForm] = useState(String(tahun));
  const [bumdForm, setBumdForm] = useState(bumdId ?? "");
  const [editLowongan, setEditLowongan] = useState<Record<string, { jenis: string; jabatan: string }>>({});
  const [posisiBaru, setPosisiBaru] = useState<{ jenis: string; jabatan: string } | null>(null);

  function refresh() {
    router.refresh();
  }

  async function simpanMetadata(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const r = await editSeleksiProses({ id: prosesId, bumdId: bumdForm || null, tahun: tahunForm });
        if (!r.success) return setError(r.error);
        refresh();
      } catch (err) {
        setError(err instanceof Error ? `Error tak terduga: ${err.message}` : "Error tak terduga saat menghubungi server");
      }
    });
  }

  function simpanLowongan(l: Lowongan) {
    setError(null);
    const patch = editLowongan[l.id] ?? { jenis: l.jenis_seleksi, jabatan: l.jabatan_lowong };
    startTransition(async () => {
      try {
        const r = await updateLowongan({ id: l.id, jenisSeleksi: patch.jenis, jabatanLowong: patch.jabatan });
        if (!r.success) return setError(r.error);
        setEditLowongan((s) => {
          const { [l.id]: _drop, ...rest } = s;
          return rest;
        });
        refresh();
      } catch (err) {
        setError(err instanceof Error ? `Error tak terduga: ${err.message}` : "Error tak terduga saat menghubungi server");
      }
    });
  }

  function hapus(l: Lowongan) {
    if (!confirm(`Hapus posisi "${l.jabatan_lowong}"? Peserta yang sudah tertaut ke posisi ini akan terlepas.`)) return;
    setError(null);
    startTransition(async () => {
      try {
        const r = await hapusLowongan({ id: l.id });
        if (!r.success) return setError(r.error);
        refresh();
      } catch (err) {
        setError(err instanceof Error ? `Error tak terduga: ${err.message}` : "Error tak terduga saat menghubungi server");
      }
    });
  }

  function simpanPosisiBaru() {
    if (!posisiBaru) return;
    setError(null);
    startTransition(async () => {
      try {
        const r = await tambahLowongan({
          seleksiProsesId: prosesId,
          jenisSeleksi: posisiBaru.jenis,
          jabatanLowong: posisiBaru.jabatan,
        });
        if (!r.success) return setError(r.error);
        setPosisiBaru(null);
        refresh();
      } catch (err) {
        setError(err instanceof Error ? `Error tak terduga: ${err.message}` : "Error tak terduga saat menghubungi server");
      }
    });
  }

  function hapusProsesIni() {
    if (!confirm("Hapus SELURUH proses ini beserta semua posisi & 24 checklist tugasnya? Tindakan ini tidak bisa dibatalkan.")) return;
    setError(null);
    startTransition(async () => {
      try {
        const r = await hapusSeleksiProses({ id: prosesId });
        if (!r.success) return setError(r.error);
        router.push("/internal/seleksi/proses");
      } catch (err) {
        setError(err instanceof Error ? `Error tak terduga: ${err.message}` : "Error tak terduga saat menghubungi server");
      }
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-primary-700 hover:underline w-fit">
        ✏️ Edit proses ini
      </button>
    );
  }

  return (
    <div className="card p-5 flex flex-col gap-5 border-primary-200">
      <div className="flex items-center justify-between">
        <p className="font-medium text-slate-900">Edit Proses Seleksi</p>
        <div className="flex items-center gap-3">
          <button type="button" disabled={isPending} onClick={hapusProsesIni} className="text-sm text-red-500 hover:text-red-700">
            🗑️ Hapus proses ini
          </button>
          <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-slate-700">
            Tutup
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <form onSubmit={simpanMetadata} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <div>
          <label className="label">BUMD</label>
          <select className="input" value={bumdForm} onChange={(e) => setBumdForm(e.target.value)}>
            <option value="">— tidak spesifik —</option>
            {bumdList.map((b) => (
              <option key={b.id} value={b.id}>{b.nama}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tahun</label>
          <input required type="number" className="input" value={tahunForm} onChange={(e) => setTahunForm(e.target.value)} />
        </div>
        <button type="submit" disabled={isPending} className="btn-secondary h-fit">Simpan</button>
      </form>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Posisi dalam proses ini</p>
        {lowonganList.map((l) => {
          const patch = editLowongan[l.id] ?? { jenis: l.jenis_seleksi, jabatan: l.jabatan_lowong };
          return (
            <div key={l.id} className="grid sm:grid-cols-[1fr_1.4fr_auto_auto] gap-3 items-end border border-slate-100 rounded-lg p-3">
              <div>
                <label className="label">Jenis</label>
                <select
                  className="input"
                  value={patch.jenis}
                  onChange={(e) => setEditLowongan((s) => ({ ...s, [l.id]: { ...patch, jenis: e.target.value } }))}
                >
                  {JENIS_OPTIONS.map((j) => (
                    <option key={j.value} value={j.value}>{j.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Jabatan Lowong</label>
                <input
                  className="input"
                  value={patch.jabatan}
                  onChange={(e) => setEditLowongan((s) => ({ ...s, [l.id]: { ...patch, jabatan: e.target.value } }))}
                />
              </div>
              <button type="button" disabled={isPending} onClick={() => simpanLowongan(l)} className="btn-secondary h-fit text-sm">
                Simpan
              </button>
              <button type="button" disabled={isPending} onClick={() => hapus(l)} className="text-xs text-red-500 hover:text-red-700 h-fit pb-2.5">
                Hapus
              </button>
            </div>
          );
        })}

        {lowonganList.length < 2 && (
          posisiBaru ? (
            <div className="grid sm:grid-cols-[1fr_1.4fr_auto] gap-3 items-end border border-dashed border-slate-200 rounded-lg p-3">
              <div>
                <label className="label">Jenis (posisi baru)</label>
                <select
                  className="input"
                  value={posisiBaru.jenis}
                  onChange={(e) => setPosisiBaru({ ...posisiBaru, jenis: e.target.value })}
                >
                  {JENIS_OPTIONS.map((j) => (
                    <option key={j.value} value={j.value}>{j.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Jabatan Lowong</label>
                <input
                  className="input"
                  placeholder="mis. Anggota Komisaris"
                  value={posisiBaru.jabatan}
                  onChange={(e) => setPosisiBaru({ ...posisiBaru, jabatan: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={isPending} onClick={simpanPosisiBaru} className="btn-primary h-fit text-sm">
                  Tambah
                </button>
                <button type="button" onClick={() => setPosisiBaru(null)} className="text-xs text-slate-400 hover:text-slate-700">
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPosisiBaru({ jenis: "komisaris", jabatan: "" })}
              className="text-sm text-primary-700 hover:underline w-fit"
            >
              + Tambah posisi kedua (jalankan bersamaan dalam proses ini)
            </button>
          )
        )}
      </div>
    </div>
  );
}
