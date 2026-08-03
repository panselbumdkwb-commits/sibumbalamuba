"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { hitungUlangSkorBumd, hitungUlangSkorBlud } from "@/actions/scoring-engine.actions";

type Entity = { id: string; nama: string };

const TAHUN_INI = new Date().getFullYear();

export default function HitungSkorPanel({
  bumdList,
  bludList,
}: {
  bumdList: Entity[];
  bludList: Entity[];
}) {
  return (
    <section className="card p-5">
      <p className="font-medium text-slate-900 mb-1">Hitung Ulang Skor Kesehatan</p>
      <p className="text-xs text-slate-500 mb-3">
        Menghitung skor tahun {TAHUN_INI} dari data realisasi Monev yang
        sudah terverifikasi/disetujui, ditimbang bobot indikator
        (`/internal/bobot-indikator`), lalu menyimpannya sebagai hasil
        evaluasi resmi.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase mb-1.5">BUMD</p>
          <div className="flex flex-col gap-1.5">
            {bumdList.map((b) => (
              <EntityRow key={b.id} entity={b} jenis="bumd" />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase mb-1.5">BLUD</p>
          <div className="flex flex-col gap-1.5">
            {bludList.map((b) => (
              <EntityRow key={b.id} entity={b} jenis="blud" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EntityRow({ entity, jenis }: { entity: Entity; jenis: "bumd" | "blud" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hasil, setHasil] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      const action = jenis === "bumd" ? hitungUlangSkorBumd : hitungUlangSkorBlud;
      const result = await action({ entityId: entity.id, tahun: TAHUN_INI });
      if (result.success) {
        setHasil(`Skor ${result.skorTotal} (${result.kategori})`);
        router.refresh();
      } else {
        setHasil(result.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
      <span className="text-slate-700">{entity.nama}</span>
      <div className="flex items-center gap-2">
        {hasil && <span className="text-xs text-slate-500">{hasil}</span>}
        <button
          disabled={isPending}
          onClick={handleClick}
          className="text-xs text-primary-700 font-medium hover:underline"
        >
          {isPending ? "Menghitung…" : "Hitung Ulang"}
        </button>
      </div>
    </div>
  );
}
