"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { tautkanProsesSeleksi } from "@/actions/seleksi.actions";

export default function TautkanProsesSelect({
  pesertaId,
  prosesSaatIni,
  prosesList,
}: {
  pesertaId: string;
  prosesSaatIni: string | null;
  prosesList: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    startTransition(async () => {
      await tautkanProsesSeleksi({ pesertaId, seleksiProsesId: value || null });
      router.refresh();
    });
  }

  return (
    <select
      disabled={isPending}
      defaultValue={prosesSaatIni ?? ""}
      onChange={(e) => handleChange(e.target.value)}
      className="input !py-1 !px-2 text-xs w-56"
    >
      <option value="">— belum ditautkan ke siklus seleksi —</option>
      {prosesList.map((p) => (
        <option key={p.id} value={p.id}>{p.label}</option>
      ))}
    </select>
  );
}
