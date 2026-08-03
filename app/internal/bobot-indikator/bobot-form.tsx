"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBobotSet } from "@/actions/bobot.actions";

type Item = { id: string; label: string; bobot: number };

export default function BobotForm({
  jenisEntitas,
  items,
  canEdit,
}: {
  jenisEntitas: "bumd" | "blud";
  items: Item[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(items.map((i) => [i.id, Math.round(i.bobot * 100)]))
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalPersen = Object.values(values).reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);
  const valid = totalPersen === 100;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateBobotSet({
        jenisEntitas,
        items: items.map((i) => ({ id: i.id, bobot: values[i.id] / 100 })),
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <table className="w-full text-sm">
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className="border-t border-slate-100">
              <td className="px-5 py-3 text-slate-700">{i.label}</td>
              <td className="px-5 py-3 text-right">
                {canEdit ? (
                  <div className="flex items-center justify-end gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={values[i.id]}
                      onChange={(e) => setValues((v) => ({ ...v, [i.id]: Number(e.target.value) }))}
                      className="w-16 rounded border border-slate-300 px-2 py-1 text-right text-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-100 outline-none"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                ) : (
                  <span className="font-medium text-slate-900">{Math.round(i.bobot * 100)}%</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {canEdit && (
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <p className={`text-xs font-medium ${valid ? "text-accent-700" : "text-red-600"}`}>
            Total: {totalPersen}% {!valid && "— harus tepat 100% sebelum bisa disimpan"}
          </p>
          <button
            type="submit"
            disabled={!valid || isPending}
            className="btn-primary !py-1.5 !px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "Menyimpan…" : "Simpan Perubahan"}
          </button>
        </div>
      )}

      {error && (
        <p className="mx-5 mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      {saved && !error && <p className="mx-5 mb-3 text-xs text-accent-700">Tersimpan.</p>}
    </form>
  );
}
