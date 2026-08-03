"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { simpanKepatuhan } from "@/actions/tata-kelola-blud.actions";

type Blud = { id: string; nama: string };
type Kepatuhan = {
  id: string;
  blud_id: string;
  jenis: string;
  status: string;
  tanggal_pemenuhan: string | null;
  keterangan: string | null;
};

const JENIS_OPTIONS = [
  { value: "rba", label: "RBA" },
  { value: "laporan_keuangan", label: "Laporan Keuangan" },
  { value: "laporan_kinerja", label: "Laporan Kinerja" },
  { value: "opini_auditor", label: "Opini Auditor" },
  { value: "ppk_blud", label: "Kepatuhan PPK-BLUD" },
  { value: "pengadaan", label: "Kepatuhan Pengadaan" },
  { value: "perpajakan", label: "Kepatuhan Perpajakan" },
];

const STATUS_OPTIONS = [
  { value: "tepat_waktu", label: "Tepat Waktu" },
  { value: "terlambat", label: "Terlambat" },
  { value: "belum_disampaikan", label: "Belum Disampaikan" },
];

const STATUS_COLOR: Record<string, string> = {
  tepat_waktu: "bg-accent-50 text-accent-700",
  terlambat: "bg-amber-50 text-amber-700",
  belum_disampaikan: "bg-slate-100 text-slate-500",
};

export default function KepatuhanSection({
  bludList,
  kepatuhanList,
  canManage,
  tahun,
}: {
  bludList: Blud[];
  kepatuhanList: Kepatuhan[];
  canManage: boolean;
  tahun: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      {bludList.map((blud) => (
        <div key={blud.id} className="card p-5">
          <p className="font-medium text-slate-900 mb-3">{blud.nama}</p>
          <div className="flex flex-col gap-1.5">
            {JENIS_OPTIONS.map((jenis) => {
              const data = kepatuhanList.find((k) => k.blud_id === blud.id && k.jenis === jenis.value);
              return (
                <KepatuhanRow
                  key={jenis.value}
                  bludId={blud.id}
                  tahun={tahun}
                  jenisValue={jenis.value}
                  jenisLabel={jenis.label}
                  data={data}
                  canManage={canManage}
                />
              );
            })}
          </div>
        </div>
      ))}
      {!bludList.length && <p className="text-sm text-slate-400">Belum ada entitas BLUD.</p>}
    </div>
  );
}

function KepatuhanRow({
  bludId,
  tahun,
  jenisValue,
  jenisLabel,
  data,
  canManage,
}: {
  bludId: string;
  tahun: number;
  jenisValue: string;
  jenisLabel: string;
  data?: Kepatuhan;
  canManage: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    status: data?.status ?? "belum_disampaikan",
    tanggalPemenuhan: data?.tanggal_pemenuhan ?? "",
    keterangan: data?.keterangan ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await simpanKepatuhan({
      bludId,
      tahun,
      jenis: jenisValue,
      status: form.status,
      tanggalPemenuhan: form.tanggalPemenuhan || undefined,
      keterangan: form.keterangan || undefined,
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="bg-slate-50 rounded-lg p-3 flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-700">{jenisLabel}</p>
        <div className="flex gap-2 flex-wrap">
          <select
            className="input !py-1.5 !px-2 text-xs w-40"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <input
            type="date"
            className="input !py-1.5 !px-2 text-xs w-36"
            value={form.tanggalPemenuhan}
            onChange={(e) => setForm((f) => ({ ...f, tanggalPemenuhan: e.target.value }))}
          />
        </div>
        <input
          placeholder="Keterangan (opsional)"
          className="input !py-1.5 !px-2 text-xs"
          value={form.keterangan}
          onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
        />
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary !py-1 !px-2.5 text-xs w-fit">
            {saving ? "…" : "Simpan"}
          </button>
          <button onClick={() => setEditing(false)} className="text-xs text-slate-400">Batal</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-slate-600">{jenisLabel}</span>
      <div className="flex items-center gap-2">
        <span className={`badge ${STATUS_COLOR[data?.status ?? "belum_disampaikan"]}`}>
          {STATUS_OPTIONS.find((s) => s.value === (data?.status ?? "belum_disampaikan"))?.label}
        </span>
        {canManage && (
          <button onClick={() => setEditing(true)} className="text-xs text-primary-700 hover:underline">
            Ubah
          </button>
        )}
      </div>
    </div>
  );
}
