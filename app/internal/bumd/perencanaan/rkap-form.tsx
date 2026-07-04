"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { simpanRkap } from "@/actions/monev-bumd.actions";

type Rkap = {
  target_pendapatan: number | null;
  target_laba: number | null;
  target_dividen: number | null;
  target_investasi: number | null;
} | null;

export default function RkapForm({
  bumdId,
  tahun,
  existing,
}: {
  bumdId: string;
  tahun: number;
  existing: Rkap;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    targetPendapatan: existing?.target_pendapatan?.toString() ?? "",
    targetLaba: existing?.target_laba?.toString() ?? "",
    targetDividen: existing?.target_dividen?.toString() ?? "",
    targetInvestasi: existing?.target_investasi?.toString() ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await simpanRkap({
      bumdId,
      tahun,
      targetPendapatan: form.targetPendapatan || undefined,
      targetLaba: form.targetLaba || undefined,
      targetDividen: form.targetDividen || undefined,
      targetInvestasi: form.targetInvestasi || undefined,
    });
    setSaving(false);
    if (result.success) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="Pendapatan" value={form.targetPendapatan} onChange={(v) => setForm((f) => ({ ...f, targetPendapatan: v }))} />
        <Field label="Laba" value={form.targetLaba} onChange={(v) => setForm((f) => ({ ...f, targetLaba: v }))} />
        <Field label="Dividen" value={form.targetDividen} onChange={(v) => setForm((f) => ({ ...f, targetDividen: v }))} />
        <Field label="Investasi" value={form.targetInvestasi} onChange={(v) => setForm((f) => ({ ...f, targetInvestasi: v }))} />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-secondary w-fit !py-1.5 !px-3 text-xs">
          {saving ? "Menyimpan…" : "Simpan RKAP"}
        </button>
        {saved && <span className="text-xs text-accent-700">Tersimpan.</span>}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-slate-400">{label}</label>
      <input
        type="number"
        className="input !py-1.5 !px-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
