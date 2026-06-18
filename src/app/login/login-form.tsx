"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signInWithCredentials } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type LoginFormProps = {
  callbackUrl: string;
  initialError: boolean;
};

export function LoginForm({ callbackUrl, initialError }: LoginFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(
    initialError ? "Anmeldung fehlgeschlagen." : null,
  );

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signInWithCredentials(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.replace(result?.redirectTo ?? callbackUrl);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent>
        <form action={onSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <Input
            label="E-Mail"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="ihre.email@beispiel.de"
            required
          />
          <Input
            label="Passwort"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Ihr Passwort"
            required
          />
          {error ? (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          ) : null}
          <Button type="submit" disabled={isPending} className="mt-2">
            {isPending ? "Anmelden..." : "Anmelden"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
