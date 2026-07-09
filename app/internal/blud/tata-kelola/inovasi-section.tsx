"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { tambahInovasi, updateStatusInovasi } from "@/actions/tata-kelola-blud.actions";

type Blud = { id: string; nama: string };
type Inovasi = {
  id: string;
  blud_id: string;
  nama_inovasi: string;
  kategori: string;
  deskripsi: string | null;
  manfaat: string | null;
  status: string;
};

const KATEGORI_LABEL: Record<string, string> = {
  digitalisasi: "Digitalisasi",
  sistem_informasi: "Sistem Informasi",
  integrasi_layanan: "Integrasi Layanan",
  simplifikasi_prosedur: "Simplifikasi Prosedur",
  lainnya: "Lainnya",
};

const STATUS_OPTIONS = [
  { value: "direncanakan", label: "Direncanakan" },
  { value: "berjalan", label: "Berjalan" },
  { value: "selesai", label: "Selesai" },
];

const STATUS_COLOR: Record<string, string> = {
  direncanakan: "bg-slate-100 text-slate-500",
  berjalan: "bg-amber-50 text-amber-700",
  selesai: "bg-accent-50 text-accent-700",
};

export default function InovasiSection({
  bludList,
  inovasiList,
  canManage,
  tahun,
}: {
  bludList: Blud[];
  inovasiList: Inovasi[];
  canManage: boolean;
  tahun: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      {bludList.map((blud) => (
        <div key={blud.id} className="card p-5 flex flex-col gap-3">
          <p className="font-medium text-slate-900">{blud.nama}</p>

          {inovasiList
            .filter((i) => i.blud_id === blud.id)
            .map((i) => (
              <div key={i.id} className="border-t border-slate-100 pt-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="badge bg-slate-100 text-slate-500 mr-2 text-[10px]">
                      {KATEGORI_LABEL[i.kategori] ?? i.kategori}
                    </span>
                    <p className="text-sm font-medium text-slate-800 mt-1">{i.nama_inovasi}</p>
                    {i.deskripsi && <p className="text-xs text-slate-500 mt-0.5">{i.deskripsi}</p>}
                    {i.manfaat && <p className="text-xs text-slate-500 mt-0.5">Manfaat: {i.manfaat}</p>}
                  </div>
                  {canManage ? (
                    <StatusSelect inovasiId={i.id} statusSaatIni={i.status} />
                  ) : (
                    <span className={`badge shrink-0 ${STATUS_COLOR[i.status]}`}>
                      {STATUS_OPTIONS.find((s) => s.value === i.status)?.label}
                    </span>
                  )}
                </div>
              </div>
            ))}

          {!inovasiList.some((i) => i.blud_id === blud.id) && (
            <p className="text-sm text-slate-400">Belum ada inovasi tercatat tahun ini.</p>
          )}

          {canManage && <TambahInovasiForm bludId={blud.id} tahun={tahun} />}
        </div>
      ))}
      {!bludList.length && <p className="text-sm text-slate-400">Belum ada entitas BLUD.</p>}
    </div>
  );
}

function StatusSelect({ inovasiId, statusSaatIni }: { inovasiId: string; statusSaatIni: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleChange(status: string) {
    setSaving(true);
    await updateStatusInovasi({ inovasiId, status });
    setSaving(false);
    router.refresh();
  }

  return (
    <select
      disabled={saving}
      defaultValue={statusSaatIni}
      onChange={(e) => handleChange(e.target.value)}
      className="input !py-1 !px-2 text-xs shrink-0 w-32"
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  );
}

function TambahInovasiForm({ bludId, tahun }: { bludId: string; tahun: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ namaInovasi: "", kategori: "digitalisasi", deskripsi: "", manfaat: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await tambahInovasi({
      bludId,
      tahun,
      namaInovasi: form.namaInovasi,
      kategori: form.kategori,
      deskripsi: form.deskripsi || undefined,
      manfaat: form.manfaat || undefined,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setForm({ namaInovasi: "", kategori: "digitalisasi", deskripsi: "", manfaat: "" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-primary-700 font-medium hover:underline mt-1 w-fit">
        + Catat inovasi baru
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 bg-slate-50 rounded-lg p-3">
      <div className="flex gap-2">
        <input
          required
          placeholder="Nama inovasi"
          className="input !py-1.5 !px-2 text-xs flex-1"
          value={form.namaInovasi}
          onChange={(e) => setForm((f) => ({ ...f, namaInovasi: e.target.value }))}
        />
        <select
          className="input !py-1.5 !px-2 text-xs w-40"
          value={form.kategori}
          onChange={(e) => setForm((f) => ({ ...f, kategori: e.target.value }))}
        >
          {Object.entries(KATEGORI_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <textarea
        placeholder="Deskripsi (opsional)"
        className="input !py-1.5 !px-2 text-xs min-h-14"
        value={form.deskripsi}
        onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
      />
      <input
        placeholder="Manfaat (opsional)"
        className="input !py-1.5 !px-2 text-xs"
        value={form.manfaat}
        onChange={(e) => setForm((f) => ({ ...f, manfaat: e.target.value }))}
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
