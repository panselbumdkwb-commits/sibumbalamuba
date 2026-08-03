import Link from "next/link";
import AuthShell from "../../_components/auth-shell";
import LoginForm from "../../_components/login-form";

export const metadata = { title: "Login Internal" };

export default function InternalLoginPage() {
  return (
    <AuthShell
      badge="Portal Internal Pemda"
      title="Masuk sebagai Pegawai / Panitia"
      subtitle="Untuk Super Admin, Admin BPSDA, Admin BUMD, Admin BLUD, Panitia Seleksi, dan Tim Penilai UKK."
      footer={
        <span className="text-slate-500">
          Bukan pegawai internal?{" "}
          <Link href="/login/peserta" className="text-primary-700 font-medium hover:underline">
            Login sebagai peserta seleksi
          </Link>
        </span>
      }
    >
      <LoginForm mode="internal" />
    </AuthShell>
  );
}
