"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { simpanRenstraRba } from "@/actions/monev-blud.actions";

type Renstra = {
  target_pendapatan: number | null;
  target_belanja: number | null;
  ringkasan_target_layanan: string | null;
} | null;

export default function RenstraRbaForm({
  bludId,
  tahun,
  existing,
}: {
  bludId: string;
  tahun: number;
  existing: Renstra;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    targetPendapatan: existing?.target_pendapatan?.toString() ?? "",
    targetBelanja: existing?.target_belanja?.toString() ?? "",
    ringkasan: existing?.ringkasan_target_layanan ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await simpanRenstraRba({
      bludId,
      tahun,
      targetPendapatan: form.targetPendapatan || undefined,
      targetBelanja: form.targetBelanja || undefined,
      ringkasanTargetLayanan: form.ringkasan || undefined,
    });
    setSaving(false);
    if (result.success) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400">Target Pendapatan</label>
          <input
            type="number"
            className="input !py-1.5 !px-2 text-sm"
            value={form.targetPendapatan}
            onChange={(e) => setForm((f) => ({ ...f, targetPendapatan: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Target Belanja</label>
          <input
            type="number"
            className="input !py-1.5 !px-2 text-sm"
            value={form.targetBelanja}
            onChange={(e) => setForm((f) => ({ ...f, targetBelanja: e.target.value }))}
          />
        </div>
      </div>
      <textarea
        placeholder="Ringkasan target layanan"
        className="input !py-1.5 !px-2 text-sm min-h-16"
        value={form.ringkasan}
        onChange={(e) => setForm((f) => ({ ...f, ringkasan: e.target.value }))}
      />
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-secondary w-fit !py-1.5 !px-3 text-xs">
          {saving ? "Menyimpan…" : "Simpan RBA"}
        </button>
        {saved && <span className="text-xs text-accent-700">Tersimpan.</span>}
      </div>
    </div>
  );
}
