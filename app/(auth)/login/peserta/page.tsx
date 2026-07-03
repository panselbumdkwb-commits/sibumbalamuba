import Link from "next/link";
import AuthShell from "../../_components/auth-shell";
import LoginForm from "../../_components/login-form";

export const metadata = { title: "Login Peserta Seleksi" };

export default function PesertaLoginPage() {
  return (
    <AuthShell
      badge="Portal Peserta Seleksi"
      title="Masuk sebagai Peserta"
      subtitle="Pantau status pendaftaran, unggah berkas administrasi, dan lihat progres tahapan seleksi Anda."
      footer={
        <span className="text-slate-500">
          Belum punya akun?{" "}
          <Link href="/daftar" className="text-primary-700 font-medium hover:underline">
            Daftar sekarang
          </Link>
          {" · "}
          <Link href="/login/internal" className="text-slate-400 hover:underline">
            Login internal
          </Link>
        </span>
      }
    >
      <LoginForm mode="peserta" />
    </AuthShell>
  );
}
