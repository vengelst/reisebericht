import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTrip } from "../../../actions";
import { getTripDays } from "../../days/actions";
import { LocationForm, type DayOption } from "../location-form";
import { formatTripDayDateShort } from "@/lib/trip-days";

type NewLocationPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ dayId?: string }>;
};

export const metadata: Metadata = {
  title: "Ort hinzufügen",
};

export default async function NewLocationPage({
  params,
  searchParams,
}: NewLocationPageProps) {
  const { id } = await params;
  const { dayId } = await searchParams;
  const [trip, days] = await Promise.all([getTrip(id), getTripDays(id)]);

  if (!trip) {
    notFound();
  }

  const dayOptions: DayOption[] = days.map((day) => ({
    id: day.id,
    label: `Tag ${day.dayNumber} – ${formatTripDayDateShort(day.date)}${
      day.title ? ` · ${day.title}` : ""
    }`,
  }));

  const defaultDayId =
    dayId && days.some((day) => day.id === dayId) ? dayId : undefined;

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
          Ort hinzufügen
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Klicken Sie auf die Karte, um die Position zu setzen, oder geben Sie
          die Koordinaten direkt ein.
        </p>
      </div>

      <LocationForm
        tripId={trip.id}
        dayOptions={dayOptions}
        defaultDayId={defaultDayId}
        submitLabel="Ort anlegen"
        cancelHref={`/trips/${trip.id}`}
      />
    </div>
  );
}
