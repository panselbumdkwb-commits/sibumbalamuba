import { getSessionProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "../../_components/page-header";
import TataKelolaTabs from "./tata-kelola-tabs";

const TAHUN_INI = new Date().getFullYear();

export default async function TataKelolaBludPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login/internal");
  if (!["admin_blud", "admin_bpsda", "eksekutif", "super_admin"].includes(profile.role)) {
    redirect("/internal/dashboard");
  }

  const canManage = profile.role !== "eksekutif";

  const supabase = await createClient();
  const bludQuery = supabase.from("blud").select("id, nama");
  const { data: bludList } =
    profile.role === "admin_blud" && profile.entityId
      ? await bludQuery.eq("id", profile.entityId)
      : await bludQuery.order("nama");

  const bludIds = bludList?.map((b) => b.id) ?? [];

  const [{ data: kepatuhanList }, { data: inovasiList }, { data: tindakLanjutList }] = await Promise.all([
    bludIds.length
      ? supabase.from("blud_kepatuhan").select("*").in("blud_id", bludIds).eq("tahun", TAHUN_INI)
      : Promise.resolve({ data: [] }),
    bludIds.length
      ? supabase.from("blud_inovasi").select("*").in("blud_id", bludIds).eq("tahun", TAHUN_INI).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    bludIds.length
      ? supabase.from("blud_tindak_lanjut").select("*").in("blud_id", bludIds).eq("tahun", TAHUN_INI).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="🏛️"
        color="bg-cyan-50 text-cyan-700"
        title="Tata Kelola BLUD"
        description={`Kepatuhan PPK-BLUD, inovasi pelayanan, dan tindak lanjut rekomendasi audit/evaluasi tahun ${TAHUN_INI}.`}
      />

      <TataKelolaTabs
        bludList={bludList ?? []}
        kepatuhanList={kepatuhanList ?? []}
        inovasiList={inovasiList ?? []}
        tindakLanjutList={tindakLanjutList ?? []}
        canManage={canManage}
        tahun={TAHUN_INI}
      />
    </main>
  );
}
