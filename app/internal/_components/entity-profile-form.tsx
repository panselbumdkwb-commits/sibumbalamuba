"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Entity = {
  id: string;
  nama: string;
  status: string;
  profil_singkat: string | null;
  [key: string]: string | null;
};

export default function EntityProfileForm({
  table,
  entity,
  subtitleField,
}: {
  table: "bumd" | "blud";
  entity: Entity;
  subtitleField: string;
}) {
  const [form, setForm] = useState({
    nama: entity.nama,
    subtitle: entity[subtitleField] ?? "",
    status: entity.status,
    profilSingkat: entity.profil_singkat ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    const { error } = await supabase
      .from(table)
      .update({
        nama: form.nama,
        [subtitleField]: form.subtitle,
        status: form.status,
        profil_singkat: form.profilSingkat,
      } as never)
      .eq("id", entity.id);

    setSaving(false);
    if (!error) setSaved(true);
  }

  return (
    <form onSubmit={handleSave} className="card p-5 flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Nama</label>
          <input
            className="input"
            value={form.nama}
            onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">{subtitleField === "jenis_usaha" ? "Jenis Usaha" : "Jenis Layanan"}</label>
          <input
            className="input"
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <label className="label">Status</label>
        <select
          className="input"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </div>

      <div>
        <label className="label">Profil Singkat</label>
        <textarea
          className="input min-h-24"
          value={form.profilSingkat}
          onChange={(e) => setForm((f) => ({ ...f, profilSingkat: e.target.value }))}
        />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Menyimpan…" : "Simpan Perubahan"}
        </button>
        {saved && <span className="text-sm text-accent-700">Tersimpan.</span>}
      </div>
    </form>
  );
}
