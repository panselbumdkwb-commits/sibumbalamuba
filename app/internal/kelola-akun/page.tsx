import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import CreateAccountForm from "./create-account-form";
import AccountRow from "./account-row";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  admin_bpsda: "Admin BPSDA",
  admin_bumd: "Admin BUMD",
  admin_blud: "Admin BLUD",
  panitia_seleksi: "Panitia Seleksi",
  tim_ukk: "Tim Penilai UKK",
  peserta: "Peserta",
  eksekutif: "Pimpinan (Eksekutif)",
};

export default async function KelolaAkunPage() {
  await requireRole(["super_admin"]);

  const supabase = await createClient();

  const [{ data: profiles }, { data: bumdList }, { data: bludList }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nama_lengkap, username, role, entity_type, entity_id, is_active")
      .neq("role", "peserta")
      .order("role"),
    supabase.from("bumd").select("id, nama").order("nama"),
    supabase.from("blud").select("id, nama").order("nama"),
  ]);

  const entityName = (entityType: string | null, entityId: string | null) => {
    if (!entityType || !entityId) return null;
    const list = entityType === "bumd" ? bumdList : bludList;
    return list?.find((e) => e.id === entityId)?.nama ?? null;
  };

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Kelola Akun Pengguna</h1>
        <p className="text-sm text-slate-500 mt-1">
          Buat akun baru, reset password, atau nonaktifkan akun internal.
          Akun peserta tidak dikelola di sini (peserta mendaftar mandiri
          lewat halaman publik).
        </p>
      </div>

      <CreateAccountForm bumdList={bumdList ?? []} bludList={bludList ?? []} />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="text-left px-4 py-2.5">Nama</th>
              <th className="text-left px-4 py-2.5">Username</th>
              <th className="text-left px-4 py-2.5">Role</th>
              <th className="text-left px-4 py-2.5">Entitas</th>
              <th className="text-left px-4 py-2.5">Status</th>
              <th className="text-right px-4 py-2.5">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {profiles?.map((p) => (
              <AccountRow
                key={p.id}
                account={{
                  id: p.id,
                  namaLengkap: p.nama_lengkap,
                  username: p.username,
                  role: p.role,
                  roleLabel: ROLE_LABEL[p.role] ?? p.role,
                  entityName: entityName(p.entity_type, p.entity_id),
                  isActive: p.is_active,
                }}
              />
            ))}
            {!profiles?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Belum ada akun internal selain akun Anda sendiri.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
