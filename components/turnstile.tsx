"use client";

import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

const SCRIPT_ID = "cf-turnstile-script";

/**
 * Widget verifikasi "saya bukan robot" menggunakan Cloudflare Turnstile
 * (gratis, tanpa perlu akun Google seperti reCAPTCHA). Token yang
 * dihasilkan wajib dikirim sebagai `captchaToken` ke
 * supabase.auth.signInWithPassword() / signUp() — Supabase akan
 * memverifikasi token tsb ke Cloudflare di sisi server sebelum
 * memproses login/registrasi.
 *
 * Wajib diaktifkan dulu di Supabase Dashboard:
 * Authentication > Attack Protection > Enable Captcha protection,
 * pilih provider "Turnstile", isi secret key. Site key (public) diisi
 * lewat env NEXT_PUBLIC_TURNSTILE_SITE_KEY di aplikasi ini.
 */
export default function Turnstile({
  onVerify,
  onExpire,
}: {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useId();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    function render() {
      if (window.turnstile && containerRef.current) {
        window.turnstile.render(containerRef.current, {
          sitekey: siteKey!,
          callback: onVerify,
          "expired-callback": onExpire,
          theme: "light",
        });
      }
    }

    if (window.turnstile) {
      render();
      return;
    }

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
    window.onloadTurnstileCallback = render;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) {
    return (
      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        Verifikasi keamanan belum dikonfigurasi (NEXT_PUBLIC_TURNSTILE_SITE_KEY
        kosong). Login/registrasi tetap berfungsi tanpa verifikasi ini di
        environment development.
      </p>
    );
  }

  return <div ref={containerRef} id={`turnstile-${widgetId}`} />;
}
