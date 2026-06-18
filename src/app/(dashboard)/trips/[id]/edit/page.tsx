import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTrip } from "../../actions";
import { TripForm } from "../../trip-form";
import {
  toDateInputValue,
  type TripStatusValue,
  type TripVisibilityValue,
} from "@/lib/trips";

type EditTripPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Reise bearbeiten",
};

export default async function EditTripPage({ params }: EditTripPageProps) {
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
          ← Zurück zur Reise
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Reise bearbeiten
        </h1>
      </div>

      <TripForm
        tripId={trip.id}
        submitLabel="Speichern"
        cancelHref={`/trips/${trip.id}`}
        initial={{
          title: trip.title,
          description: trip.description ?? "",
          startDate: toDateInputValue(trip.startDate),
          endDate: toDateInputValue(trip.endDate),
          status: trip.status as TripStatusValue,
          visibility: trip.visibility as TripVisibilityValue,
        }}
      />
    </div>
  );
}
