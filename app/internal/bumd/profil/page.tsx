import { getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EntityProfileForm from "../../_components/entity-profile-form";

export default async function BumdProfilPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login/internal");
  if (!["admin_bumd", "admin_bpsda", "super_admin"].includes(profile.role)) {
    redirect("/internal/dashboard");
  }

  const supabase = await createClient();

  // admin_bumd hanya boleh mengelola entitasnya sendiri (RLS
  // "bumd_write_authorized" memaksa ini juga di level database).
  const query = supabase.from("bumd").select("id, nama, jenis_usaha, status, profil_singkat");
  const { data: bumdList } =
    profile.role === "admin_bumd" && profile.entityId
      ? await query.eq("id", profile.entityId)
      : await query.order("nama");

  return (
    <main className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Profil BUMD</h1>
        <p className="text-sm text-slate-500 mt-1">
          Perubahan di sini langsung tampil di halaman transparansi publik.
        </p>
      </div>

      {bumdList?.map((bumd) => (
        <EntityProfileForm key={bumd.id} table="bumd" entity={bumd} subtitleField="jenis_usaha" />
      ))}

      {!bumdList?.length && (
        <p className="text-sm text-slate-400">
          Belum ada entitas BUMD yang terhubung ke akun Anda. Hubungi Super Admin.
        </p>
      )}
    </main>
  );
}
