import Link from "next/link";
import { getSessionProfile, type UserRole } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";

type MenuItem = {
  href: string;
  label: string;
  description: string;
  roles: UserRole[];
  icon: string;
  color: string;
};

const MENU: MenuItem[] = [
  {
    href: "/internal/laporan",
    label: "Laporan Ringkas Pimpinan",
    description: "Ringkasan BUMD, BLUD, evaluasi, dan seleksi lintas entitas (lihat saja).",
    roles: ["eksekutif", "super_admin"],
    icon: "📊",
    color: "bg-violet-50 text-violet-700",
  },
  {
    href: "/internal/bumd/profil",
    label: "Profil BUMD",
    description: "Kelola data BUMD (admin_bumd: entitas sendiri) atau lihat saja (admin_bpsda).",
    roles: ["admin_bumd", "admin_bpsda", "super_admin"],
    icon: "🏢",
    color: "bg-primary-50 text-primary-700",
  },
  {
    href: "/internal/blud/profil",
    label: "Profil BLUD",
    description: "Kelola data BLUD (admin_blud: entitas sendiri) atau lihat saja (admin_bpsda).",
    roles: ["admin_blud", "admin_bpsda", "super_admin"],
    icon: "🏥",
    color: "bg-cyan-50 text-cyan-700",
  },
  {
    href: "/internal/bumd/perencanaan",
    label: "Perencanaan Kinerja BUMD",
    description: "Target RKAP dan KPI/IKU tahunan per BUMD.",
    roles: ["admin_bumd", "admin_bpsda", "eksekutif", "super_admin"],
    icon: "🎯",
    color: "bg-primary-50 text-primary-700",
  },
  {
    href: "/internal/bumd/monitoring",
    label: "Monitoring Realisasi",
    description: "Lapor & verifikasi realisasi terhadap target KPI.",
    roles: ["admin_bumd", "admin_bpsda", "eksekutif", "super_admin"],
    icon: "📈",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    href: "/internal/bumd/dashboard-kinerja",
    label: "Dashboard Kinerja BUMD",
    description: "Visualisasi capaian realisasi vs target.",
    roles: ["admin_bumd", "admin_bpsda", "eksekutif", "super_admin"],
    icon: "📊",
    color: "bg-teal-50 text-teal-700",
  },
  {
    href: "/internal/bumd/risiko",
    label: "Manajemen Risiko BUMD",
    description: "Registrasi risiko dan tindak lanjut mitigasi.",
    roles: ["admin_bumd", "admin_bpsda", "eksekutif", "super_admin"],
    icon: "⚠️",
    color: "bg-red-50 text-red-700",
  },
  {
    href: "/internal/blud/perencanaan",
    label: "Perencanaan Kinerja BLUD",
    description: "Renstra Bisnis, RBA, dan target KPI/IKU tahunan per BLUD.",
    roles: ["admin_blud", "admin_bpsda", "eksekutif", "super_admin"],
    icon: "🎯",
    color: "bg-cyan-50 text-cyan-700",
  },
  {
    href: "/internal/blud/monitoring",
    label: "Monitoring Realisasi BLUD",
    description: "Lapor & verifikasi realisasi terhadap target KPI (dengan analisis penyebab).",
    roles: ["admin_blud", "admin_bpsda", "eksekutif", "super_admin"],
    icon: "📈",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    href: "/internal/blud/dashboard-kinerja",
    label: "Dashboard Kinerja BLUD",
    description: "Visualisasi capaian realisasi terverifikasi vs target.",
    roles: ["admin_blud", "admin_bpsda", "eksekutif", "super_admin"],
    icon: "📊",
    color: "bg-teal-50 text-teal-700",
  },
  {
    href: "/internal/blud/risiko",
    label: "Manajemen Risiko BLUD",
    description: "Registrasi risiko pelayanan dan tindak lanjut mitigasi.",
    roles: ["admin_blud", "admin_bpsda", "eksekutif", "super_admin"],
    icon: "⚠️",
    color: "bg-red-50 text-red-700",
  },
  {
    href: "/internal/bobot-indikator",
    label: "Bobot Indikator Evaluasi",
    description: "Atur bobot indikator penilaian kinerja BUMD/BLUD.",
    roles: ["admin_bpsda", "super_admin"],
    icon: "⚖️",
    color: "bg-amber-50 text-amber-700",
  },
  {
    href: "/internal/seleksi",
    label: "Kelola Seleksi",
    description: "Verifikasi berkas administrasi & batalkan pendaftaran peserta.",
    roles: ["panitia_seleksi", "ketua_pansel", "super_admin"],
    icon: "📋",
    color: "bg-brand-50 text-brand-700",
  },
  {
    href: "/internal/dokumen",
    label: "Surat & Dokumen",
    description: "Buat draf surat (panitia) atau setujui/tanda tangani (ketua panitia).",
    roles: ["panitia_seleksi", "ketua_pansel", "super_admin"],
    icon: "✍️",
    color: "bg-indigo-50 text-indigo-700",
  },
  {
    href: "/internal/seleksi/dewas-komisaris/assisted-entry",
    label: "Pendaftaran Assisted-Entry",
    description: "Daftarkan peserta ASN eligible atas nama panitia.",
    roles: ["super_admin"],
    icon: "🧾",
    color: "bg-rose-50 text-rose-700",
  },
  {
    href: "/internal/seleksi/penilaian-ukk",
    label: "Penilaian UKK",
    description: "Input dan finalisasi nilai Uji Kompetensi Kerja peserta (nilai Anda sendiri).",
    roles: ["tim_ukk", "super_admin"],
    icon: "📝",
    color: "bg-accent-50 text-accent-700",
  },
  {
    href: "/internal/kelola-akun",
    label: "Kelola Akun Pengguna",
    description: "Buat akun baru, reset password, atau nonaktifkan akun internal.",
    roles: ["super_admin"],
    icon: "👥",
    color: "bg-fuchsia-50 text-fuchsia-700",
  },
  {
    href: "/internal/audit-log",
    label: "Audit Log",
    description: "Riwayat aksi sensitif seluruh pengguna sistem.",
    roles: ["super_admin"],
    icon: "🛡️",
    color: "bg-slate-100 text-slate-700",
  },
];

const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin_bpsda: "Admin BPSDA",
  admin_bumd: "Admin BUMD",
  admin_blud: "Admin BLUD",
  panitia_seleksi: "Panitia Seleksi",
  ketua_pansel: "Ketua Panitia Seleksi",
  tim_ukk: "Tim Penilai UKK",
  peserta: "Peserta",
  eksekutif: "Pimpinan (Eksekutif)",
};

function sapaan() {
  const jam = new Date().getHours();
  if (jam < 11) return "Selamat pagi";
  if (jam < 15) return "Selamat siang";
  if (jam < 18) return "Selamat sore";
  return "Selamat malam";
}

export default async function InternalDashboardPage() {
  const profile = await getSessionProfile();

  if (!profile) {
    redirect("/login/internal");
  }

  const visibleMenu = MENU.filter((item) => item.roles.includes(profile.role));

  return (
    <div className="flex flex-col">
      {/* Banner sambutan */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/kota-batu-aerial.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-950/95 via-primary-900/90 to-primary-800/80" />
        </div>
        <div className="relative px-6 py-10 sm:py-12 text-white">
          <p className="text-sm text-primary-100/80">{sapaan()},</p>
          <h1 className="text-2xl font-semibold mt-0.5">{profile.namaLengkap}</h1>
          <span className="badge bg-white/15 text-white border border-white/20 mt-3">
            {ROLE_LABEL[profile.role]}
          </span>
        </div>
      </div>

      <main className="p-6 max-w-5xl mx-auto w-full flex flex-col gap-6">
        {visibleMenu.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleMenu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="card p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-150"
              >
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl mb-3 ${item.color}`}>
                  {item.icon}
                </div>
                <p className="font-medium text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Belum ada menu khusus untuk role Anda pada modul ini. Hubungi
            administrator jika Anda merasa ini keliru.
          </p>
        )}
      </main>
    </div>
  );
}
