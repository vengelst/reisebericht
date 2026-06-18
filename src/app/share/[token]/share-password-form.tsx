"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkPublicationPassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function SharePasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    const password = (formData.get("password") as string | null) ?? "";
    startTransition(async () => {
      const result = await checkPublicationPassword(token, password);
      if (!result.valid) {
        setError("Falsches Passwort.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-elevated)] text-[var(--color-muted)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <h1 className="text-lg font-semibold">
              Passwortgeschützter Reisebericht
            </h1>
            <p className="text-sm text-[var(--color-muted)]">
              Bitte geben Sie das Passwort ein, um den Bericht anzusehen.
            </p>
          </div>

          <form action={onSubmit} className="flex flex-col gap-4">
            <Input
              label="Passwort"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
              errorMessage={error ?? undefined}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? "Wird geprüft…" : "Bericht ansehen"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
