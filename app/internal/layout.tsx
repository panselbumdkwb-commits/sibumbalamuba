import Link from "next/link";
import LogoutButton from "./logout-button";

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <Link href="/internal/dashboard" className="font-medium text-sm">
          SIBUMBALAMUBA
        </Link>
        <LogoutButton />
      </header>
      {children}
    </div>
  );
}
