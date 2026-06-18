import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTrip } from "../../../actions";
import { getTripDays } from "../../days/actions";
import { getLocations } from "../../locations/actions";
import { NoteForm, type NoteOption } from "../note-form";
import { formatTripDayDateShort } from "@/lib/trip-days";
import { categoryEmoji } from "@/lib/locations";

export const metadata: Metadata = {
  title: "Neue Notiz",
};

type NewNotePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tripDayId?: string; locationId?: string }>;
};

export default async function NewNotePage({
  params,
  searchParams,
}: NewNotePageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const [trip, days, locations] = await Promise.all([
    getTrip(id),
    getTripDays(id),
    getLocations(id),
  ]);

  if (!trip) {
    notFound();
  }

  const dayOptions: NoteOption[] = days.map((day) => ({
    id: day.id,
    label: `Tag ${day.dayNumber} – ${formatTripDayDateShort(day.date)}`,
  }));
  const locationOptions: NoteOption[] = locations.map((location) => ({
    id: location.id,
    label: `${categoryEmoji(location.category)} ${location.name}`,
  }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/trips/${trip.id}/notes`}
          className="text-sm text-[var(--color-muted)] transition-colors hover:text-foreground"
        >
          ← Zurück zu den Notizen
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Neue Notiz</h1>
      </div>

      <NoteForm
        tripId={trip.id}
        dayOptions={dayOptions}
        locationOptions={locationOptions}
        defaultTripDayId={sp.tripDayId}
        defaultLocationId={sp.locationId}
        submitLabel="Notiz speichern"
        cancelHref={`/trips/${trip.id}/notes`}
      />
    </div>
  );
}
