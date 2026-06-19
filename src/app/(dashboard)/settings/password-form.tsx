"use client";

import { useRef, useState, useTransition } from "react";
import { changePassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function onSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await changePassword(formData);
      if (result?.fieldErrors) setFieldErrors(result.fieldErrors);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.success) {
        setSuccess(result.success);
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} action={onSubmit} className="flex flex-col gap-4">
      <Input
        label="Aktuelles Passwort"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        errorMessage={fieldErrors.currentPassword}
        required
      />
      <Input
        label="Neues Passwort"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        hint="Mindestens 8 Zeichen."
        errorMessage={fieldErrors.newPassword}
        required
      />
      <Input
        label="Neues Passwort bestätigen"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        errorMessage={fieldErrors.confirmPassword}
        required
      />

      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {success}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Wird geändert…" : "Passwort ändern"}
        </Button>
      </div>
    </form>
  );
}
