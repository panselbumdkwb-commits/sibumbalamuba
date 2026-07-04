"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Turnstile from "@/components/turnstile";
import AuthShell from "../_components/auth-shell";

const USERNAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.]{2,30}[a-zA-Z0-9]$/;

export default function DaftarPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    namaLengkap: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!USERNAME_PATTERN.test(form.username)) {
      setError(
        "Username 5-32 karakter, hanya huruf/angka/underscore/titik, tidak boleh diawali/diakhiri simbol."
      );
      return;
    }
    if (form.password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    if (captchaRequired && !captchaToken) {
      setError("Selesaikan verifikasi keamanan terlebih dahulu.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          nama_lengkap: form.namaLengkap.trim(),
          username: form.username.trim(),
        },
        captchaToken: captchaToken ?? undefined,
      },
    });

    setLoading(false);

    if (signUpError) {
      const m = signUpError.message.toLowerCase();
      if (m.includes("already registered")) {
        setError("Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.");
      } else if (m.includes("username")) {
        setError("Username sudah digunakan orang lain. Coba username lain.");
      } else if (m.includes("captcha")) {
        setError(
          "Verifikasi keamanan (captcha) gagal diproses. Pastikan NEXT_PUBLIC_TURNSTILE_SITE_KEY dan secret key di Supabase sudah dikonfigurasi dengan benar."
        );
      } else {
        setError(`Pendaftaran gagal: ${signUpError.message}`);
      }
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <AuthShell
        badge="Portal Peserta Seleksi"
        title="Cek email Anda"
        subtitle="Kami mengirim tautan konfirmasi ke email yang Anda daftarkan."
      >
        <div className="text-sm text-slate-600 space-y-3">
          <p>
            Klik tautan pada email untuk mengaktifkan akun, lalu masuk
            menggunakan username <span className="font-medium">{form.username}</span> yang
            telah Anda buat.
          </p>
          <Link href="/login/peserta" className="btn-primary w-full">
            Ke halaman login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      badge="Portal Peserta Seleksi"
      title="Daftar Akun Peserta"
      subtitle="Gunakan username untuk login sehari-hari — email hanya dipakai untuk konfirmasi akun dan pemulihan kata sandi."
      footer={
        <span className="text-slate-500">
          Sudah punya akun?{" "}
          <Link href="/login/peserta" className="text-primary-700 font-medium hover:underline">
            Masuk
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="namaLengkap">Nama lengkap</label>
          <input
            id="namaLengkap"
            required
            className="input"
            value={form.namaLengkap}
            onChange={(e) => update("namaLengkap", e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="username">Username</label>
          <input
            id="username"
            required
            autoComplete="username"
            className="input"
            placeholder="mis. budi_santoso"
            value={form.username}
            onChange={(e) => update("username", e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1">Dipakai untuk login, tidak bisa mengandung spasi.</p>
        </div>

        <div>
          <label className="label" htmlFor="email">Email aktif</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1">
            Wajib email pribadi yang benar-benar aktif — dipakai untuk konfirmasi akun & pemulihan kata sandi.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="password">Kata sandi</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              className="input pr-16"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-500 hover:text-primary-700"
              tabIndex={-1}
            >
              {showPassword ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">Minimal 8 karakter.</p>
        </div>

        <div>
          <label className="label" htmlFor="confirmPassword">Konfirmasi kata sandi</label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            className="input"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
          />
        </div>

        <Turnstile onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Memproses…" : "Daftar"}
        </button>
      </form>
    </AuthShell>
  );
}
