import Link from "next/link";
import LogoutButton from "./logout-button";
import JamWib from "@/components/jam-wib";
import { getSessionProfile } from "@/lib/auth/rbac";
import NotifBell from "./notif-bell";

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();

  return (
    <div className="min-h-screen">
      <header
        className="no-print flex items-center justify-between gap-4 px-6 py-3 border-b bg-white"
        style={{ borderColor: "var(--color-border)" }}
      >
        <Link href="/internal/dashboard" className="font-medium text-sm shrink-0">
          SIBUMBALAMUBA
        </Link>
        <div className="hidden md:block">
          <JamWib />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {profile?.role === "super_admin" && <NotifBell />}
          <LogoutButton />
        </div>
      </header>
      <div className="no-print md:hidden px-6 py-2 border-b" style={{ borderColor: "var(--color-border)" }}>
        <JamWib />
      </div>
      {children}
    </div>
  );
}
