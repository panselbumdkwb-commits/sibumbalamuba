import { requireRole } from "@/lib/auth/rbac";
import PageHeader from "../../../_components/page-header";

/**
 * Halaman ini hanya pernah selesai dirender untuk super_admin —
 * requireRole() melempar error untuk role lain sebelum konten
 * apa pun disusun (lihat Tahap 8 §6 untuk desain banner peringatan).
 */
export default async function AssistedEntryPage() {
  await requireRole(["super_admin"]);

  return (
    <main className="p-6 max-w-xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon="🧾"
        color="bg-rose-50 text-rose-700"
        title="Pendaftaran Assisted-Entry"
        description="Form pemilihan peserta ASN eligible dan pengisian data akan tampil di sini."
      />
      <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
        Anda akan mengisi data pendaftaran atas nama peserta lain. Aksi ini
        tercatat secara permanen di Audit Log atas nama akun Anda.
      </div>
    </main>
  );
}
