import { getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EntityProfileForm from "../../_components/entity-profile-form";
import EntityViewCard from "../../_components/entity-view-card";

export default async function BludProfilPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login/internal");
  if (!["admin_blud", "admin_bpsda", "super_admin", "eksekutif"].includes(profile.role)) {
    redirect("/internal/dashboard");
  }

  // admin_bpsda dan eksekutif kini LIHAT SAJA (read-only) — perubahan data
  // BLUD hanya boleh dilakukan admin_blud (entitasnya sendiri) atau
  // super_admin, sesuai RLS "blud_write_authorized" di migration 0007.
  const canEdit = profile.role === "admin_blud" || profile.role === "super_admin";

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
          {canEdit
            ? "Perubahan di sini langsung tampil di halaman transparansi publik."
            : "Anda memiliki akses lihat-saja untuk data ini."}
        </p>
      </div>

      {bludList?.map((blud) =>
        canEdit ? (
          <EntityProfileForm key={blud.id} table="blud" entity={blud} subtitleField="jenis_layanan" />
        ) : (
          <EntityViewCard key={blud.id} entity={blud} subtitleField="jenis_layanan" />
        )
      )}

      {!bludList?.length && (
        <p className="text-sm text-slate-400">
          Belum ada entitas BLUD yang terhubung ke akun Anda. Hubungi Super Admin.
        </p>
      )}
    </main>
  );
}
