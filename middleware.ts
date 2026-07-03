import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Middleware ini adalah LAPISAN UX (mencegah render halaman yang tidak
 * relevan untuk role tertentu, dan memisahkan portal internal vs peserta).
 * Ini BUKAN satu-satunya penjaga keamanan — RLS di Supabase tetap
 * lapisan pertahanan utama untuk data, dan requireRole() di server
 * action/page adalah lapisan kedua. Lihat lib/auth/rbac.ts.
 */

const INTERNAL_ROLES = [
  "super_admin",
  "admin_bpsda",
  "admin_bumd",
  "admin_blud",
  "panitia_seleksi",
  "tim_ukk",
];
const PESERTA_ROLES = ["peserta"];

const ROLE_ROUTE_PREFIX: Record<string, string[]> = {
  "/internal/seleksi/penilaian-ukk": ["tim_ukk", "super_admin"],
  "/internal/seleksi/dewas-komisaris/assisted-entry": ["super_admin"],
  "/internal/seleksi": ["panitia_seleksi", "super_admin"],
  "/internal/audit-log": ["super_admin"],
  "/internal/bobot-indikator": ["admin_bpsda", "super_admin"],
  "/internal/bumd": ["admin_bumd", "admin_bpsda", "super_admin"],
  "/internal/blud": ["admin_blud", "admin_bpsda", "super_admin"],
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isInternalRoute = path.startsWith("/internal");
  const isPesertaRoute = path.startsWith("/peserta");

  if ((isInternalRoute || isPesertaRoute) && !user) {
    const loginUrl = new URL(isInternalRoute ? "/login/internal" : "/login/peserta", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user && (isInternalRoute || isPesertaRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // Cegah akun peserta masuk ke portal internal, dan sebaliknya.
    if (isInternalRoute && (!role || !INTERNAL_ROLES.includes(role))) {
      return NextResponse.redirect(new URL("/peserta/dashboard", request.url));
    }
    if (isPesertaRoute && (!role || !PESERTA_ROLES.includes(role))) {
      return NextResponse.redirect(new URL("/internal/dashboard", request.url));
    }

    // Batasi sub-halaman internal sesuai role spesifik.
    if (isInternalRoute && role) {
      const restrictedPrefix = Object.keys(ROLE_ROUTE_PREFIX).find((prefix) =>
        path.startsWith(prefix)
      );
      if (restrictedPrefix && !ROLE_ROUTE_PREFIX[restrictedPrefix].includes(role)) {
        return NextResponse.redirect(new URL("/internal/dashboard", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/internal/:path*", "/peserta/:path*"],
};
