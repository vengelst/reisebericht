import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTrip } from "../actions";
import { getTripDays } from "./days/actions";
import { getLocations } from "./locations/actions";
import { TripActions } from "./trip-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TripStatusBadge, VisibilityIcon } from "@/components/trip/trip-badges";
import { TripDaysTimeline } from "@/components/trip/trip-days-timeline";
import { TripLocations } from "@/components/trip/trip-locations";
import {
  formatTripDateRange,
  type TripStatusValue,
  type TripVisibilityValue,
} from "@/lib/trips";
import {
  formatDistance,
  formatDrivingTime,
  toNumberOrNull,
  toUtcDateKey,
} from "@/lib/trip-days";

type TripDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: TripDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const trip = await getTrip(id);
  return { title: trip ? trip.title : "Reise" };
}

const PLACEHOLDER_SECTIONS = [
  { title: "Bilder", hint: "Laden Sie Fotos zu dieser Reise hoch." },
  { title: "Notizen", hint: "Halten Sie Gedanken und Tipps fest." },
];

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const { id } = await params;
  const [trip, days, locations] = await Promise.all([
    getTrip(id),
    getTripDays(id),
    getLocations(id),
  ]);

  if (!trip) {
    notFound();
  }

  const totalDistance = days.reduce(
    (sum, day) => sum + (toNumberOrNull(day.distanceKm) ?? 0),
    0,
  );
  const totalDriving = days.reduce(
    (sum, day) => sum + (day.drivingMinutes ?? 0),
    0,
  );
  const totalDistanceLabel = formatDistance(totalDistance);
  const totalDrivingLabel = formatDrivingTime(totalDriving);
  const highlightCount = locations.filter((l) => l.isHighlight).length;

  const stats = [
    `${days.length} ${days.length === 1 ? "Tag" : "Tage"}`,
    totalDistanceLabel ? `Gesamtstrecke: ${totalDistanceLabel}` : null,
    totalDrivingLabel ? `Gesamtfahrzeit: ${totalDrivingLabel}` : null,
    `${locations.length} ${locations.length === 1 ? "Ort" : "Orte"}`,
    highlightCount > 0
      ? `${highlightCount} ${highlightCount === 1 ? "Highlight" : "Highlights"}`
      : null,
  ].filter((value): value is string => Boolean(value));

  // Highlight today's day only while the trip is active.
  const todayKey = toUtcDateKey(new Date());
  const currentDayId =
    trip.status === "ACTIVE"
      ? (days.find((day) => toUtcDateKey(day.date) === todayKey)?.id ?? null)
      : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/trips"
          className="text-sm text-[var(--color-muted)] transition-colors hover:text-foreground"
        >
          ← Zurück zu den Reisen
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {trip.title}
          </h1>
          <TripStatusBadge status={trip.status as TripStatusValue} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-muted)]">
          <span>{formatTripDateRange(trip.startDate, trip.endDate)}</span>
          <VisibilityIcon
            visibility={trip.visibility as TripVisibilityValue}
            withLabel
          />
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-[var(--color-muted)]">
          {stats.map((stat, index) => (
            <span key={stat} className="flex items-center gap-x-3">
              {index > 0 ? <span aria-hidden="true">·</span> : null}
              {stat}
            </span>
          ))}
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Beschreibung
          </h2>
          {trip.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {trip.description}
            </p>
          ) : (
            <p className="text-sm italic text-[var(--color-muted)]">
              Keine Beschreibung hinterlegt.
            </p>
          )}
        </CardContent>
      </Card>

      <TripActions
        tripId={trip.id}
        status={trip.status as TripStatusValue}
        title={trip.title}
      />

      {/* Reisetage */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Reisetage{days.length > 0 ? ` (${days.length})` : ""}
          </h2>
          <Link href={`/trips/${trip.id}/days/new`}>
            <Button>Tag hinzufügen</Button>
          </Link>
        </div>

        {days.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <p className="text-sm text-[var(--color-muted)]">
                Noch keine Reisetage. Fügen Sie den ersten Tag hinzu.
              </p>
              <Link href={`/trips/${trip.id}/days/new`}>
                <Button variant="secondary">Ersten Tag hinzufügen</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <TripDaysTimeline
            tripId={trip.id}
            days={days}
            currentDayId={currentDayId}
          />
        )}
      </section>

      {/* Orte */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Orte{locations.length > 0 ? ` (${locations.length})` : ""}
          </h2>
          <Link href={`/trips/${trip.id}/locations/new`}>
            <Button>Ort hinzufügen</Button>
          </Link>
        </div>

        {locations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <p className="text-sm text-[var(--color-muted)]">
                Noch keine Orte. Fügen Sie den ersten Ort hinzu.
              </p>
              <Link href={`/trips/${trip.id}/locations/new`}>
                <Button variant="secondary">Ersten Ort hinzufügen</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <TripLocations tripId={trip.id} locations={locations} days={days} />
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PLACEHOLDER_SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-foreground">
                  {section.title}
                </h3>
                <span className="rounded-full bg-[var(--color-surface-elevated)] px-2 py-0.5 text-xs text-[var(--color-muted)]">
                  Kommt bald
                </span>
              </div>
              <p className="text-sm text-[var(--color-muted)]">{section.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
