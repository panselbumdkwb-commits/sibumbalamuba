import Link from "next/link";

const NAV_LINKS = [
  { href: "/#bumd", label: "BUMD" },
  { href: "/#blud", label: "BLUD" },
  { href: "/#evaluasi", label: "Evaluasi Kinerja" },
  { href: "/#seleksi", label: "Seleksi Direksi/Dewas" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-800 text-white font-bold text-sm">
            SB
          </span>
          <div className="leading-tight">
            <p className="font-semibold text-sm text-slate-900">SIBUMBALUMBA</p>
            <p className="text-[11px] text-slate-400">Pemerintah Kota Batu</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-primary-800 transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login/peserta" className="btn-ghost hidden sm:inline-flex">
            Peserta Seleksi
          </Link>
          <Link href="/login/internal" className="btn-primary">
            Login Internal
          </Link>
        </div>
      </div>
    </header>
  );
}
