"use client";

import { useState, useTransition } from "react";
import { verifyBerkas } from "@/actions/seleksi.actions";

export default function VerifyBerkasButton({
  berkasId,
  currentStatus,
}: {
  berkasId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handle(newStatus: "lolos" | "ditolak") {
    startTransition(async () => {
      const result = await verifyBerkas({ berkasId, status: newStatus });
      if (result.success) setStatus(newStatus);
    });
  }

  if (status === "lolos" || status === "ditolak") {
    return (
      <span
        className={`badge ${
          status === "lolos" ? "bg-accent-50 text-accent-700" : "bg-red-50 text-red-600"
        }`}
      >
        {status === "lolos" ? "Lolos" : "Ditolak"}
      </span>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        disabled={isPending}
        onClick={() => handle("lolos")}
        className="btn-secondary !py-1 !px-2.5 text-xs"
      >
        Lolos
      </button>
      <button
        disabled={isPending}
        onClick={() => handle("ditolak")}
        className="btn-ghost !py-1 !px-2.5 text-xs text-red-600"
      >
        Tolak
      </button>
    </div>
  );
}
