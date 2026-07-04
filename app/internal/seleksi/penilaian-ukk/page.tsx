import { requireRole } from "@/lib/auth/rbac";
import PageHeader from "../../_components/page-header";

/**
 * Halaman ini SENGAJA tidak pernah menerima role selain tim_ukk/super_admin.
 * requireRole() akan melempar error yang ditangkap Next.js error boundary
 * jika role tidak sesuai — halaman ini tidak pernah "dirender lalu
 * disembunyikan", tapi memang tidak pernah selesai dirender untuk
 * role yang tidak berwenang (lihat Tahap 8 §4).
 */
export default async function PenilaianUkkPage() {
  await requireRole(["tim_ukk", "super_admin"]);

  return (
    <main className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="📝"
        color="bg-accent-50 text-accent-700"
        title="Penilaian UKK"
        description="Nilai yang Anda input di sini hanya terlihat oleh Anda sendiri dan super_admin, sampai direkap rata-rata dengan 4 penilai lain."
      />
      <div className="card p-6 text-sm text-slate-500">
        Daftar peserta yang ditugaskan ke sesi Anda akan tampil di sini.
      </div>
    </main>
  );
}
