import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SIBUMBALAMUBA — Kota Batu",
    template: "%s · SIBUMBALAMUBA",
  },
  description:
    "Sistem Informasi BUMD dan BLUD Kota Batu — manajemen, monitoring, evaluasi kinerja, dan seleksi Direksi/Dewan Pengawas/Komisaris secara transparan dan akuntabel.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
