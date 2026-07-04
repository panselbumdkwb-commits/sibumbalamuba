"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordAkun, toggleAktifAkun } from "@/actions/akun.actions";

type Account = {
  id: string;
  namaLengkap: string;
  username: string | null;
  role: string;
  roleLabel: string;
  entityName: string | null;
  isActive: boolean;
};

export default function AccountRow({ account }: { account: Account }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function handleToggleActive() {
    startTransition(async () => {
      const result = await toggleAktifAkun({ userId: account.id, aktif: !account.isActive });
      if (result.success) router.refresh();
    });
  }

  function handleResetPassword() {
    if (newPassword.length < 8) {
      setMessage("Minimal 8 karakter");
      return;
    }
    startTransition(async () => {
      const result = await resetPasswordAkun({ userId: account.id, passwordBaru: newPassword });
      setMessage(result.success ? "Password diperbarui." : result.error);
      if (result.success) {
        setNewPassword("");
        setTimeout(() => setResetting(false), 1200);
      }
    });
  }

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3">{account.namaLengkap}</td>
      <td className="px-4 py-3 text-slate-500">{account.username ?? "—"}</td>
      <td className="px-4 py-3">
        <span className="badge bg-primary-50 text-primary-700">{account.roleLabel}</span>
      </td>
      <td className="px-4 py-3 text-slate-500">{account.entityName ?? "—"}</td>
      <td className="px-4 py-3">
        <span
          className={`badge ${account.isActive ? "bg-accent-50 text-accent-700" : "bg-slate-100 text-slate-500"}`}
        >
          {account.isActive ? "Aktif" : "Nonaktif"}
        </span>
      </td>
      <td className="px-4 py-3">
        {resetting ? (
          <div className="flex items-center gap-1.5 justify-end">
            <input
              type="text"
              placeholder="password baru"
              className="input !py-1 !px-2 text-xs w-32"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              disabled={isPending}
              onClick={handleResetPassword}
              className="text-xs text-primary-700 font-medium hover:underline"
            >
              Simpan
            </button>
            <button
              onClick={() => setResetting(false)}
              className="text-xs text-slate-400 hover:underline"
            >
              Batal
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 justify-end text-xs">
            {message && <span className="text-slate-400">{message}</span>}
            <button
              onClick={() => setResetting(true)}
              className="text-primary-700 hover:underline"
            >
              Reset Password
            </button>
            <button
              disabled={isPending}
              onClick={handleToggleActive}
              className={account.isActive ? "text-red-600 hover:underline" : "text-accent-700 hover:underline"}
            >
              {account.isActive ? "Nonaktifkan" : "Aktifkan"}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
