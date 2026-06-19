"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/(dashboard)/auth-actions";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string };

type MobileNavProps = {
  navItems: NavItem[];
  displayName: string;
  email: string;
};

export function MobileNav({ navItems, displayName, email }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Navigation öffnen"
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-[var(--color-surface-elevated)]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="3" x2="21" y1="6" y2="6" />
          <line x1="3" x2="21" y1="12" y2="12" />
          <line x1="3" x2="21" y1="18" y2="18" />
        </svg>
      </button>

      {/* Backdrop */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--color-border)] px-4">
          <span className="flex items-center gap-2 text-base font-semibold">
            <span className="inline-block h-3 w-3 rounded-full bg-[var(--color-accent)]" />
            Reisebericht
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Navigation schließen"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "block rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-[var(--color-accent)]/15 text-foreground"
                        : "text-foreground hover:bg-[var(--color-surface-elevated)]",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-[var(--color-border)] p-4">
          <ThemeToggle className="w-full justify-center" />
        </div>

        <div className="border-t border-[var(--color-border)] p-4">
          <div className="mb-3 text-sm">
            <p className="font-medium text-foreground">{displayName}</p>
            <p className="truncate text-xs text-[var(--color-muted)]">{email}</p>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" size="sm" className="w-full">
              Abmelden
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
