import { requireRole } from "@/lib/auth/rbac";

/**
 * Halaman ini hanya pernah selesai dirender untuk super_admin —
 * requireRole() melempar error untuk role lain sebelum konten
 * apa pun disusun (lihat Tahap 8 §6 untuk desain banner peringatan).
 */
export default async function AssistedEntryPage() {
  await requireRole(["super_admin"]);

  return (
    <main className="p-6 flex flex-col gap-4 max-w-xl">
      <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
        Anda akan mengisi data pendaftaran atas nama peserta lain. Aksi ini
        tercatat secara permanen di Audit Log atas nama akun Anda.
      </div>
      <h1 className="text-xl font-medium">Pendaftaran Assisted-Entry</h1>
      <p className="text-sm text-gray-500">
        Form pemilihan peserta ASN eligible dan pengisian data akan tampil di
        sini.
      </p>
    </main>
  );
}
