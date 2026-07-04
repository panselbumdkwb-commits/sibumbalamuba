import { getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EntityProfileForm from "../../_components/entity-profile-form";
import EntityViewCard from "../../_components/entity-view-card";
import PageHeader from "../../_components/page-header";

export default async function BumdProfilPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login/internal");
  if (!["admin_bumd", "admin_bpsda", "super_admin", "eksekutif"].includes(profile.role)) {
    redirect("/internal/dashboard");
  }

  // admin_bpsda dan eksekutif kini LIHAT SAJA (read-only) — perubahan data
  // BUMD hanya boleh dilakukan admin_bumd (entitasnya sendiri) atau
  // super_admin, sesuai RLS "bumd_write_authorized" di migration 0007.
  const canEdit = profile.role === "admin_bumd" || profile.role === "super_admin";

  const supabase = await createClient();

  const query = supabase.from("bumd").select("id, nama, jenis_usaha, status, profil_singkat");
  const { data: bumdList } =
    profile.role === "admin_bumd" && profile.entityId
      ? await query.eq("id", profile.entityId)
      : await query.order("nama");

  return (
    <main className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="🏢"
        color="bg-primary-50 text-primary-700"
        title="Profil BUMD"
        description={
          canEdit
            ? "Perubahan di sini langsung tampil di halaman transparansi publik."
            : "Anda memiliki akses lihat-saja untuk data ini."
        }
      />

      {bumdList?.map((bumd) =>
        canEdit ? (
          <EntityProfileForm key={bumd.id} table="bumd" entity={bumd} subtitleField="jenis_usaha" />
        ) : (
          <EntityViewCard key={bumd.id} entity={bumd} subtitleField="jenis_usaha" />
        )
      )}

      {!bumdList?.length && (
        <p className="text-sm text-slate-400">
          Belum ada entitas BUMD yang terhubung ke akun Anda. Hubungi Super Admin.
        </p>
      )}
    </main>
  );
}
