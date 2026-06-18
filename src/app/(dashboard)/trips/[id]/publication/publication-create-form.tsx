"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPublication } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PublicationCreateForm({
  tripId,
  defaultTitle,
}: {
  tripId: string;
  defaultTitle: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createPublication(tripId, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <Input
        label="Titel"
        name="title"
        defaultValue={defaultTitle}
        maxLength={200}
        required
      />
      <Input
        label="Passwort (optional)"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="Wenn gesetzt, müssen Besucher das Passwort eingeben."
      />
      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Wird erstellt…" : "Freigabe erstellen"}
        </Button>
      </div>
    </form>
  );
}
