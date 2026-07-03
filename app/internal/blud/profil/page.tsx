import { getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EntityProfileForm from "../../_components/entity-profile-form";

export default async function BludProfilPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login/internal");
  if (!["admin_blud", "admin_bpsda", "super_admin"].includes(profile.role)) {
    redirect("/internal/dashboard");
  }

  const supabase = await createClient();

  const query = supabase.from("blud").select("id, nama, jenis_layanan, status, profil_singkat");
  const { data: bludList } =
    profile.role === "admin_blud" && profile.entityId
      ? await query.eq("id", profile.entityId)
      : await query.order("nama");

  return (
    <main className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Profil BLUD</h1>
        <p className="text-sm text-slate-500 mt-1">
          Perubahan di sini langsung tampil di halaman transparansi publik.
        </p>
      </div>

      {bludList?.map((blud) => (
        <EntityProfileForm key={blud.id} table="blud" entity={blud} subtitleField="jenis_layanan" />
      ))}

      {!bludList?.length && (
        <p className="text-sm text-slate-400">
          Belum ada entitas BLUD yang terhubung ke akun Anda. Hubungi Super Admin.
        </p>
      )}
    </main>
  );
}
