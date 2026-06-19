import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reisebericht",
  description: "Reiseplanung und Reiseberichte",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Default to "dark" so existing users see no flash / visual break.
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value === "light" ? "light" : "dark";

  return (
    <html lang="de" className={theme}>
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
