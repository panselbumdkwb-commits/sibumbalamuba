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

    // 1) Resolve username -> email lewat RPC (satu-satunya kolom yang
    //    dikembalikan adalah email; tidak membedakan pesan error supaya
    //    tidak membocorkan username mana yang terdaftar).
    const { data: email, error: rpcError } = await supabase.rpc(
      "get_email_by_username",
      { p_username: username.trim() }
    );

    if (rpcError || !email) {
      setLoading(false);
      setError("Username atau kata sandi salah.");
      return;
    }

    // 2) Login dengan email hasil resolusi + password + token captcha.
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });

    if (authError || !authData.user) {
      setLoading(false);
      setError("Username atau kata sandi salah.");
      return;
    }

    // 3) Pastikan role akun cocok dengan portal yang dipakai — mencegah
    //    peserta login lewat portal internal atau sebaliknya.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", authData.user.id)
      .single();

    if (!profile || !profile.is_active) {
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
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
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
