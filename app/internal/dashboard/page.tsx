import Link from "next/link";
import { getSessionProfile, type UserRole } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";

type MenuItem = {
  href: string;
  label: string;
  description: string;
  roles: UserRole[];
};

const MENU: MenuItem[] = [
  {
    href: "/internal/laporan",
    label: "Laporan Ringkas Pimpinan",
    description: "Ringkasan BUMD, BLUD, evaluasi, dan seleksi lintas entitas (lihat saja).",
    roles: ["eksekutif", "super_admin"],
  },
  {
    href: "/internal/bumd/profil",
    label: "Profil BUMD",
    description: "Kelola data BUMD (admin_bumd: entitas sendiri) atau lihat saja (admin_bpsda).",
    roles: ["admin_bumd", "admin_bpsda", "super_admin"],
  },
  {
    href: "/internal/blud/profil",
    label: "Profil BLUD",
    description: "Kelola data BLUD (admin_blud: entitas sendiri) atau lihat saja (admin_bpsda).",
    roles: ["admin_blud", "admin_bpsda", "super_admin"],
  },
  {
    href: "/internal/bobot-indikator",
    label: "Bobot Indikator Evaluasi",
    description: "Atur bobot indikator penilaian kinerja BUMD/BLUD.",
    roles: ["admin_bpsda", "super_admin"],
  },
  {
    href: "/internal/seleksi",
    label: "Kelola Seleksi",
    description: "Verifikasi berkas administrasi & batalkan pendaftaran peserta.",
    roles: ["panitia_seleksi", "super_admin"],
  },
  {
    href: "/internal/seleksi/dewas-komisaris/assisted-entry",
    label: "Pendaftaran Assisted-Entry",
    description: "Daftarkan peserta ASN eligible atas nama panitia.",
    roles: ["super_admin"],
  },
  {
    href: "/internal/seleksi/penilaian-ukk",
    label: "Penilaian UKK",
    description: "Input dan finalisasi nilai Uji Kompetensi Kerja peserta (nilai Anda sendiri).",
    roles: ["tim_ukk", "super_admin"],
  },
  {
    href: "/internal/kelola-akun",
    label: "Kelola Akun Pengguna",
    description: "Buat akun baru, reset password, atau nonaktifkan akun internal.",
    roles: ["super_admin"],
  },
  {
    href: "/internal/audit-log",
    label: "Audit Log",
    description: "Riwayat aksi sensitif seluruh pengguna sistem.",
    roles: ["super_admin"],
  },
];

const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin_bpsda: "Admin BPSDA",
  admin_bumd: "Admin BUMD",
  admin_blud: "Admin BLUD",
  panitia_seleksi: "Panitia Seleksi",
  tim_ukk: "Tim Penilai UKK",
  peserta: "Peserta",
  eksekutif: "Pimpinan (Eksekutif)",
};

export default async function InternalDashboardPage() {
  const profile = await getSessionProfile();

  if (!profile) {
    redirect("/login/internal");
  }

  const visibleMenu = MENU.filter((item) => item.roles.includes(profile.role));

  return (
    <main className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium">Dashboard Internal</h1>
        <p className="text-sm text-gray-500 mt-1">
          Masuk sebagai{" "}
          <span className="font-medium">{ROLE_LABEL[profile.role]}</span>
        </p>
      </div>

      {visibleMenu.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleMenu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
              style={{ borderColor: "var(--color-border)" }}
            >
              <p className="font-medium">{item.label}</p>
              <p className="text-xs text-gray-500 mt-1">{item.description}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Belum ada menu khusus untuk role Anda pada modul ini. Hubungi
          administrator jika Anda merasa ini keliru.
        </p>
      )}
    </main>
  );
}
