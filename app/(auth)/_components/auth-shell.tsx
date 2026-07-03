import Link from "next/link";

export default function AuthShell({
  title,
  subtitle,
  badge,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  badge: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary-950 to-primary-800 text-white p-12">
        <Link href="/" className="flex items-center gap-2.5 w-fit">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 font-bold text-sm">
            SB
          </span>
          <span className="font-semibold">SIBUMBALUMBA</span>
        </Link>
        <div>
          <h2 className="text-2xl font-semibold leading-snug max-w-sm">
            Tata kelola BUMD &amp; BLUD Kota Batu yang transparan dan aman.
          </h2>
          <p className="text-primary-100/70 text-sm mt-3 max-w-sm">
            Setiap akun memiliki hak akses yang jelas dan terpisah sesuai
            perannya. Semua aktivitas sensitif tercatat dalam audit log.
          </p>
        </div>
        <p className="text-xs text-primary-200/50">
          © {new Date().getFullYear()} Pemerintah Kota Batu
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm animate-fade-in">
          <span className="badge bg-primary-50 text-primary-700 mb-4">{badge}</span>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1 mb-6">{subtitle}</p>

          <div className="card p-6">{children}</div>

          {footer && <div className="mt-5 text-center text-sm">{footer}</div>}

          <p className="mt-6 text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-600">
              ← Kembali ke beranda
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
