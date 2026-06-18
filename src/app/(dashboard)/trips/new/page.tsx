import Link from "next/link";
import type { Metadata } from "next";
import { TripForm } from "../trip-form";

export const metadata: Metadata = {
  title: "Neue Reise",
};

export default function NewTripPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/trips"
          className="text-sm text-[var(--color-muted)] transition-colors hover:text-foreground"
        >
          ← Zurück zu den Reisen
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Neue Reise</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Legen Sie eine neue Reise an. Nur der Titel ist erforderlich.
        </p>
      </div>

      <TripForm submitLabel="Reise anlegen" cancelHref="/trips" />
    </div>
  );
}
