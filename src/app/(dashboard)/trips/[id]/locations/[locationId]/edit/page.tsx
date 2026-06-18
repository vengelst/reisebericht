import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocation } from "../../actions";
import { getTripDays } from "../../../days/actions";
import { LocationForm, type DayOption } from "../../location-form";
import { formatTripDayDateShort } from "@/lib/trip-days";
import type { LocationCategoryValue } from "@/lib/locations";

type EditLocationPageProps = {
  params: Promise<{ id: string; locationId: string }>;
};

export const metadata: Metadata = {
  title: "Ort bearbeiten",
};

export default async function EditLocationPage({
  params,
}: EditLocationPageProps) {
  const { id, locationId } = await params;
  const [location, days] = await Promise.all([
    getLocation(id, locationId),
    getTripDays(id),
  ]);

  if (!location) {
    notFound();
  }

  const dayOptions: DayOption[] = days.map((day) => ({
    id: day.id,
    label: `Tag ${day.dayNumber} – ${formatTripDayDateShort(day.date)}${
      day.title ? ` · ${day.title}` : ""
    }`,
  }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/trips/${id}/locations/${location.id}`}
          className="text-sm text-[var(--color-muted)] transition-colors hover:text-foreground"
        >
          ← Zurück zu „{location.name}“
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Ort bearbeiten
        </h1>
      </div>

      <LocationForm
        tripId={id}
        locationId={location.id}
        dayOptions={dayOptions}
        submitLabel="Speichern"
        cancelHref={`/trips/${id}/locations/${location.id}`}
        initial={{
          name: location.name,
          category: location.category as LocationCategoryValue,
          latitude: String(location.latitude),
          longitude: String(location.longitude),
          tripDayId: location.tripDayId ?? "",
          rating: location.rating === null ? "" : String(location.rating),
          description: location.description ?? "",
          isHighlight: location.isHighlight,
        }}
      />
    </div>
  );
}
