"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buatAkunInternal } from "@/actions/akun.actions";

type Entity = { id: string; nama: string };

const ROLE_OPTIONS = [
  { value: "admin_bpsda", label: "Admin BPSDA (lihat saja, lintas entitas)" },
  { value: "admin_bumd", label: "Admin BUMD (kelola 1 entitas)" },
  { value: "admin_blud", label: "Admin BLUD (kelola 1 entitas)" },
  { value: "panitia_seleksi", label: "Panitia Seleksi" },
  { value: "tim_ukk", label: "Tim Penilai UKK" },
  { value: "eksekutif", label: "Pimpinan (Eksekutif — lihat saja)" },
  { value: "super_admin", label: "Super Admin" },
];

export default function CreateAccountForm({
  bumdList,
  bludList,
}: {
  bumdList: Entity[];
  bludList: Entity[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    namaLengkap: "",
    username: "",
    email: "",
    password: "",
    role: "panitia_seleksi",
    entityId: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const needsEntity = form.role === "admin_bumd" || form.role === "admin_blud";
  const entityOptions = form.role === "admin_bumd" ? bumdList : bludList;

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await buatAkunInternal({
      namaLengkap: form.namaLengkap,
      username: form.username,
      email: form.email,
      password: form.password,
      role: form.role,
      entityType: needsEntity ? (form.role === "admin_bumd" ? "bumd" : "blud") : undefined,
      entityId: needsEntity ? form.entityId : undefined,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setForm({
      namaLengkap: "",
      username: "",
      email: "",
      password: "",
      role: "panitia_seleksi",
      entityId: "",
    });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary w-fit">
        + Buat Akun Baru
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-medium text-slate-900">Buat Akun Baru</p>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-slate-700">
          Batal
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Nama lengkap</label>
          <input
            required
            className="input"
            value={form.namaLengkap}
            onChange={(e) => update("namaLengkap", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Username (untuk login)</label>
          <input
            required
            className="input"
            placeholder="mis. kabag_bpsda"
            value={form.username}
            onChange={(e) => update("username", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            required
            className="input"
            placeholder="boleh email internal (mis. nama@sibumbalumba.internal)"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Kata sandi awal</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              className="input pr-16"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-500 hover:text-primary-700"
              tabIndex={-1}
            >
              {showPassword ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>
        </div>
        <div>
          <label className="label">Role</label>
          <select
            className="input"
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        {needsEntity && (
          <div>
            <label className="label">Entitas</label>
            <select
              required
              className="input"
              value={form.entityId}
              onChange={(e) => update("entityId", e.target.value)}
            >
              <option value="">— pilih entitas —</option>
              {entityOptions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nama}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-fit">
        {loading ? "Membuat akun…" : "Buat Akun"}
      </button>
    </form>
  );
}
