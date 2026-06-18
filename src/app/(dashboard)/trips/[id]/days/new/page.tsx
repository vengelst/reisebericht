import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTrip } from "../../../actions";
import { DayForm } from "../day-form";

type NewDayPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Tag hinzufügen",
};

export default async function NewDayPage({ params }: NewDayPageProps) {
  const { id } = await params;
  const trip = await getTrip(id);

  if (!trip) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/trips/${trip.id}`}
          className="text-sm text-[var(--color-muted)] transition-colors hover:text-foreground"
        >
          ← Zurück zu „{trip.title}“
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tag hinzufügen
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Nur das Datum ist erforderlich.
        </p>
      </div>

      <DayForm
        tripId={trip.id}
        submitLabel="Tag anlegen"
        cancelHref={`/trips/${trip.id}`}
      />
    </div>
  );
}
