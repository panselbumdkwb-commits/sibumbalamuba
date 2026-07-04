"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Turnstile from "@/components/turnstile";
import type { UserRole } from "@/types/database.types";

type Mode = "internal" | "peserta";

const ALLOWED_ROLES: Record<Mode, UserRole[]> = {
  internal: [
    "super_admin",
    "admin_bpsda",
    "admin_bumd",
    "admin_blud",
    "panitia_seleksi",
    "tim_ukk",
  ],
  peserta: ["peserta"],
};

const REDIRECT_TARGET: Record<Mode, string> = {
  internal: "/internal/dashboard",
  peserta: "/peserta/dashboard",
};

const WRONG_PORTAL_MESSAGE: Record<Mode, string> = {
  internal:
    "Akun ini terdaftar sebagai peserta seleksi. Silakan masuk lewat halaman login peserta.",
  peserta:
    "Akun ini terdaftar sebagai akun internal pemda. Silakan masuk lewat halaman login internal.",
};

export default function LoginForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (captchaRequired && !captchaToken) {
      setError("Selesaikan verifikasi keamanan terlebih dahulu.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // 1) Resolve username -> email lewat RPC.
    const { data: email, error: rpcError } = await supabase.rpc(
      "get_email_by_username",
      { p_username: username.trim() }
    );

    if (rpcError) {
      // RPC gagal total (bukan sekadar "username tidak ada") — biasanya
      // berarti migration 0003_username_login.sql belum dijalankan di
      // project Supabase, sehingga fungsi get_email_by_username belum ada.
      setLoading(false);
      setError(
        `Gagal memproses login (${rpcError.message}). Kemungkinan migration database belum lengkap dijalankan — cek supabase/migrations/0003_username_login.sql.`
      );
      return;
    }

    if (!email) {
      setLoading(false);
      setError(
        "Username tidak ditemukan. Periksa kembali penulisan username (huruf besar/kecil tidak masalah, tapi pastikan tidak ada spasi tersembunyi), atau pastikan kolom username pada baris profil akun ini sudah terisi di tabel profiles."
      );
      return;
    }

    // 2) Login dengan email hasil resolusi + password + token captcha.
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });

    if (authError) {
      setLoading(false);
      setError(describeAuthError(authError.message));
      return;
    }

    if (!authData.user) {
      setLoading(false);
      setError("Login gagal karena sebab tidak diketahui. Coba lagi.");
      return;
    }

    // 3) Pastikan role akun cocok dengan portal yang dipakai.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setLoading(false);
      setError(
        "Akun berhasil diautentikasi tetapi profil tidak ditemukan di tabel profiles. Ini biasanya berarti trigger handle_new_user belum aktif saat akun ini dibuat — tambahkan baris profil secara manual di Table Editor, atau buat ulang user setelah migration 0002/0003 dijalankan."
      );
      return;
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Akun tidak aktif. Hubungi administrator.");
      return;
    }

    if (!ALLOWED_ROLES[mode].includes(profile.role)) {
      await supabase.auth.signOut();
      setLoading(false);
      setError(WRONG_PORTAL_MESSAGE[mode]);
      return;
    }

    router.push(REDIRECT_TARGET[mode]);
    router.refresh();
  }

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
      <div>
        <label className="label" htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          required
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input"
          placeholder="mis. budi_santoso"
        />
      </div>

      <div>
        <label className="label" htmlFor="password">Kata sandi</label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input pr-16"
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
      </div>

      <Turnstile onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}

/** Menerjemahkan pesan error Supabase Auth ke Bahasa Indonesia yang lebih jelas. */
function describeAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "Kata sandi salah untuk username tersebut. Periksa kembali penulisan kata sandi (gunakan tombol \"Tampilkan\" untuk memastikan).";
  }
  if (m.includes("email not confirmed")) {
    return "Akun ini belum dikonfirmasi. Jika dibuat lewat Supabase Dashboard, pastikan opsi \"Auto Confirm User\" dicentang saat membuat user, atau konfirmasi manual lewat Authentication > Users.";
  }
  if (m.includes("captcha")) {
    return "Verifikasi keamanan (captcha) gagal diproses. Pastikan NEXT_PUBLIC_TURNSTILE_SITE_KEY di Vercel dan secret key di Supabase Authentication > Attack Protection sudah cocok dan project sudah di-redeploy.";
  }
  return `Login gagal: ${message}`;
}
