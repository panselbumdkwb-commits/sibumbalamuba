"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { simpanPenilaian, finalisasiPenilaian } from "@/actions/ukk-instrumen.actions";

type Instrumen = { id: string; aspek: string; bobot: number; deskripsi_indikator: string | null };
type Nilai = { instrumen_id: string; skor: number; catatan: string | null; is_final: boolean };

const ASPEK_LABEL: Record<string, string> = {
  integritas: "Integritas",
  kepemimpinan: "Kepemimpinan",
  kompetensi_manajerial: "Kompetensi Manajerial",
  kompetensi_bisnis: "Kompetensi Bisnis",
  kompetensi_keuangan: "Kompetensi Keuangan",
  tata_kelola: "Tata Kelola",
  regulasi: "Regulasi",
  komunikasi: "Komunikasi",
  problem_solving: "Problem Solving",
  business_plan: "Business Plan",
};

export default function PesertaPenilaianCard({
  pesertaId,
  namaPeserta,
  seleksiProsesId,
  instrumenList,
  nilaiSaya,
}: {
  pesertaId: string;
  namaPeserta: string;
  seleksiProsesId: string;
  instrumenList: Instrumen[];
  nilaiSaya: Nilai[];
}) {
  const router = useRouter();
  const [skorForm, setSkorForm] = useState<Record<string, string>>(
    Object.fromEntries(instrumenList.map((i) => [i.id, nilaiSaya.find((n) => n.instrumen_id === i.id)?.skor.toString() ?? ""]))
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const sudahFinal = nilaiSaya.some((n) => n.is_final);
  const lengkap = instrumenList.every((i) => skorForm[i.id]);

  function handleSaveSkor(instrumenId: string) {
    const skor = skorForm[instrumenId];
    if (!skor) return;
    startTransition(async () => {
      await simpanPenilaian({ pesertaId, instrumenId, skor });
      router.refresh();
    });
  }

  function handleFinalisasi() {
    startTransition(async () => {
      const result = await finalisasiPenilaian({ pesertaId, seleksiProsesId });
      setMessage(result.success ? "Nilai difinalisasi — tidak bisa diubah lagi." : result.error);
      router.refresh();
    });
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-medium text-slate-900">{namaPeserta}</p>
        {sudahFinal ? (
          <span className="badge bg-accent-50 text-accent-700">Sudah Final</span>
        ) : (
          <span className="badge bg-slate-100 text-slate-500">Draf</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {instrumenList.map((i) => (
          <div key={i.id} className="flex items-center gap-2">
            <span className="text-xs text-slate-600 w-40 shrink-0">
              {ASPEK_LABEL[i.aspek] ?? i.aspek}
              <span className="text-slate-400"> ({(Number(i.bobot) * 100).toFixed(0)}%)</span>
            </span>
            <input
              type="number"
              min={0}
              max={100}
              disabled={sudahFinal || isPending}
              className="input !py-1 !px-2 text-xs w-20"
              value={skorForm[i.id] ?? ""}
              onChange={(e) => setSkorForm((f) => ({ ...f, [i.id]: e.target.value }))}
              onBlur={() => handleSaveSkor(i.id)}
            />
          </div>
        ))}
      </div>

      {!sudahFinal && (
        <div className="mt-3 flex items-center gap-3">
          <button
            disabled={!lengkap || isPending}
            onClick={handleFinalisasi}
            className="btn-secondary !py-1 !px-3 text-xs"
          >
            Finalisasi Nilai
          </button>
          {message && <span className="text-xs text-red-600">{message}</span>}
        </div>
      )}
    </div>
  );
}
