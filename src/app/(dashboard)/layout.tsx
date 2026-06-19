import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { navItems } from "./nav-items";
import { signOutAction } from "./auth-actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-[var(--color-border)] px-6">
          <span className="inline-block h-3 w-3 rounded-full bg-[var(--color-accent)]" />
          <span className="text-base font-semibold tracking-tight">Reisebericht</span>
        </div>
        <nav className="flex-1 px-3 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-[var(--color-surface-elevated)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-[var(--color-border)] p-4">
          <ThemeToggle className="w-full justify-center" />
        </div>
        <div className="border-t border-[var(--color-border)] p-4">
          <div className="mb-3 text-sm">
            <p className="font-medium text-foreground">{session.user.displayName}</p>
            <p className="truncate text-xs text-[var(--color-muted)]">
              {session.user.email}
            </p>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" size="sm" className="w-full">
              Abmelden
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 md:hidden">
          <MobileNav
            navItems={navItems}
            displayName={session.user.displayName}
            email={session.user.email}
          />
          <span className="flex items-center gap-2 text-base font-semibold">
            <span className="inline-block h-3 w-3 rounded-full bg-[var(--color-accent)]" />
            Reisebericht
          </span>
          <span className="w-10" aria-hidden="true" />
        </header>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
