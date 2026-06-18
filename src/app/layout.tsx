import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reisebericht",
  description: "Reiseplanung und Reiseberichte",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
