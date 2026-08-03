"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function PilihProsesSelect({
  prosesList,
}: {
  prosesList: { id: string; label: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("proses") ?? "";

  return (
    <select
      className="input max-w-md"
      value={current}
      onChange={(e) => router.push(`?proses=${e.target.value}`)}
    >
      <option value="">— pilih siklus seleksi —</option>
      {prosesList.map((p) => (
        <option key={p.id} value={p.id}>{p.label}</option>
      ))}
    </select>
  );
}
