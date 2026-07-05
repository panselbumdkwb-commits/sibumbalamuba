"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStatusRisikoBlud } from "@/actions/monev-blud.actions";

const STATUS_OPTIONS = [
  { value: "belum_ditangani", label: "Belum Ditangani" },
  { value: "dalam_proses", label: "Dalam Proses" },
  { value: "selesai", label: "Selesai" },
];

export default function StatusRisikoBludSelect({
  risikoId,
  statusSaatIni,
}: {
  risikoId: string;
  statusSaatIni: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(status: string) {
    startTransition(async () => {
      await updateStatusRisikoBlud({ risikoId, status });
      router.refresh();
    });
  }

  return (
    <select
      disabled={isPending}
      defaultValue={statusSaatIni}
      onChange={(e) => handleChange(e.target.value)}
      className="input !py-1 !px-2 text-xs shrink-0 w-36"
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  );
}
