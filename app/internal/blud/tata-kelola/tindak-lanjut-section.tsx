"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { tambahTindakLanjut, updateProgresTindakLanjut } from "@/actions/tata-kelola-blud.actions";

type Blud = { id: string; nama: string };
type TindakLanjut = {
  id: string;
  blud_id: string;
  sumber: string;
  rekomendasi: string;
  rencana_tindak_lanjut: string | null;
  persentase_penyelesaian: number;
  target_penyelesaian: string | null;
  status: string;
};

const SUMBER_LABEL: Record<string, string> = {
  audit_internal: "Audit Internal",
  audit_eksternal: "Audit Eksternal",
  evaluasi_bpsda: "Evaluasi BPSDA",
  lainnya: "Lainnya",
};

const STATUS_OPTIONS = [
  { value: "belum_ditangani", label: "Belum Ditangani" },
  { value: "dalam_proses", label: "Dalam Proses" },
  { value: "selesai", label: "Selesai" },
];

export default function TindakLanjutSection({
  bludList,
  tindakLanjutList,
  canManage,
  tahun,
}: {
  bludList: Blud[];
  tindakLanjutList: TindakLanjut[];
  canManage: boolean;
  tahun: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      {bludList.map((blud) => (
        <div key={blud.id} className="card p-5 flex flex-col gap-3">
          <p className="font-medium text-slate-900">{blud.nama}</p>

          {tindakLanjutList
            .filter((t) => t.blud_id === blud.id)
            .map((t) => (
              <div key={t.id} className="border-t border-slate-100 pt-3">
                <span className="badge bg-slate-100 text-slate-500 text-[10px]">
                  {SUMBER_LABEL[t.sumber] ?? t.sumber}
                </span>
                <p className="text-sm text-slate-800 mt-1.5">{t.rekomendasi}</p>
                {t.rencana_tindak_lanjut && (
                  <p className="text-xs text-slate-500 mt-1">Rencana: {t.rencana_tindak_lanjut}</p>
                )}
                {t.target_penyelesaian && (
                  <p className="text-xs text-slate-400 mt-0.5">Target selesai: {t.target_penyelesaian}</p>
                )}

                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${t.persentase_penyelesaian >= 100 ? "bg-accent-500" : "bg-brand-500"}`}
                      style={{ width: `${t.persentase_penyelesaian}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">{t.persentase_penyelesaian}%</span>
                </div>

                {canManage ? (
                  <ProgresForm tindakLanjutId={t.id} persentaseSaatIni={t.persentase_penyelesaian} statusSaatIni={t.status} />
                ) : (
                  <span className="badge bg-slate-100 text-slate-500 mt-2">
                    {STATUS_OPTIONS.find((s) => s.value === t.status)?.label}
                  </span>
                )}
              </div>
            ))}

          {!tindakLanjutList.some((t) => t.blud_id === blud.id) && (
            <p className="text-sm text-slate-400">Belum ada rekomendasi tercatat tahun ini.</p>
          )}

          {canManage && <TambahForm bludId={blud.id} tahun={tahun} />}
        </div>
      ))}
      {!bludList.length && <p className="text-sm text-slate-400">Belum ada entitas BLUD.</p>}
    </div>
  );
}

function ProgresForm({
  tindakLanjutId,
  persentaseSaatIni,
  statusSaatIni,
}: {
  tindakLanjutId: string;
  persentaseSaatIni: number;
  statusSaatIni: string;
}) {
  const router = useRouter();
  const [persentase, setPersentase] = useState(persentaseSaatIni.toString());
  const [status, setStatus] = useState(statusSaatIni);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateProgresTindakLanjut({
      tindakLanjutId,
      persentasePenyelesaian: persentase,
      status,
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={100}
        className="input !py-1 !px-2 text-xs w-16"
        value={persentase}
        onChange={(e) => setPersentase(e.target.value)}
      />
      <span className="text-xs text-slate-400">%</span>
      <select
        className="input !py-1 !px-2 text-xs w-36"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <button onClick={handleSave} disabled={saving} className="btn-secondary !py-1 !px-2.5 text-xs">
        {saving ? "…" : "Simpan"}
      </button>
    </div>
  );
}

function TambahForm({ bludId, tahun }: { bludId: string; tahun: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    sumber: "audit_internal",
    rekomendasi: "",
    rencanaTindakLanjut: "",
    targetPenyelesaian: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await tambahTindakLanjut({
      bludId,
      tahun,
      sumber: form.sumber,
      rekomendasi: form.rekomendasi,
      rencanaTindakLanjut: form.rencanaTindakLanjut || undefined,
      targetPenyelesaian: form.targetPenyelesaian || undefined,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setForm({ sumber: "audit_internal", rekomendasi: "", rencanaTindakLanjut: "", targetPenyelesaian: "" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-primary-700 font-medium hover:underline mt-1 w-fit">
        + Catat rekomendasi baru
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 bg-slate-50 rounded-lg p-3">
      <div className="flex gap-2">
        <select
          className="input !py-1.5 !px-2 text-xs w-40"
          value={form.sumber}
          onChange={(e) => setForm((f) => ({ ...f, sumber: e.target.value }))}
        >
          {Object.entries(SUMBER_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <input
          type="date"
          className="input !py-1.5 !px-2 text-xs"
          value={form.targetPenyelesaian}
          onChange={(e) => setForm((f) => ({ ...f, targetPenyelesaian: e.target.value }))}
        />
      </div>
      <textarea
        required
        placeholder="Rekomendasi hasil audit/evaluasi"
        className="input !py-1.5 !px-2 text-xs min-h-16"
        value={form.rekomendasi}
        onChange={(e) => setForm((f) => ({ ...f, rekomendasi: e.target.value }))}
      />
      <input
        placeholder="Rencana tindak lanjut (opsional)"
        className="input !py-1.5 !px-2 text-xs"
        value={form.rencanaTindakLanjut}
        onChange={(e) => setForm((f) => ({ ...f, rencanaTindakLanjut: e.target.value }))}
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
