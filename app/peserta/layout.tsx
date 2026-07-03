import Link from "next/link";
import LogoutButton from "../internal/logout-button";

export default function PesertaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-white">
        <Link href="/peserta/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-800 text-white font-bold text-xs">
            SB
          </span>
          <span className="font-medium text-sm text-slate-900">Portal Peserta Seleksi</span>
        </Link>
        <LogoutButton />
      </header>
      {children}
    </div>
  );
}
