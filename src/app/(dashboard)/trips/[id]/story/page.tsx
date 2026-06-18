import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStoryData } from "./actions";
import { StoryDaySection } from "@/components/story/story-day-section";
import { TripMap, type TripMapMarker } from "@/components/map/trip-map";
import { Gallery } from "@/components/media/gallery";
import { Badge } from "@/components/ui/badge";
import {
  formatTripDateRange,
  TRIP_STATUS_LABELS,
  type TripStatusValue,
} from "@/lib/trips";
import { formatDistance, formatDrivingTime, toNumberOrNull } from "@/lib/trip-days";
import { mediaUrl, toGalleryImages } from "@/lib/media";
import { noteTypeEmoji, noteTypeLabel } from "@/lib/notes";
import type { LocationCategoryValue } from "@/lib/locations";

type StoryPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: StoryPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getStoryData(id);
  return {
    title: data ? `Reisegeschichte — ${data.trip.title}` : "Reisegeschichte",
  };
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { id } = await params;
  const data = await getStoryData(id);

  if (!data) {
    notFound();
  }

  const { trip, coverMedia, days, unassignedMedia, unassignedNotes, allLocations } =
    data;

  const allMedia = [...days.flatMap((d) => d.media), ...unassignedMedia];
  const allNotes = [...days.flatMap((d) => d.notes), ...unassignedNotes];
  const totalDistance = days.reduce(
    (sum, d) => sum + (toNumberOrNull(d.day.distanceKm) ?? 0),
    0,
  );
  const totalDriving = days.reduce(
    (sum, d) => sum + (d.day.drivingMinutes ?? 0),
    0,
  );
  const highlightCount =
    allLocations.filter((l) => l.isHighlight).length +
    allMedia.filter((m) => m.isHighlight).length +
    allNotes.filter((n) => n.isHighlight).length;

  const stats = [
    `${days.length} ${days.length === 1 ? "Tag" : "Tage"}`,
    formatDistance(totalDistance) || null,
    formatDrivingTime(totalDriving) || null,
    `${allLocations.length} ${allLocations.length === 1 ? "Ort" : "Orte"}`,
    `${allMedia.length} ${allMedia.length === 1 ? "Bild" : "Bilder"}`,
    highlightCount > 0
      ? `${highlightCount} ${highlightCount === 1 ? "Highlight" : "Highlights"}`
      : null,
  ].filter((value): value is string => Boolean(value));

  const markers: TripMapMarker[] = allLocations.map((location) => ({
    id: location.id,
    name: location.name,
    category: location.category as LocationCategoryValue,
    latitude: location.latitude,
    longitude: location.longitude,
    isHighlight: location.isHighlight,
    description: location.description,
    tripDayId: location.tripDayId,
    sortOrder: location.sortOrder,
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-muted)]">
        <Link href="/trips" className="transition-colors hover:text-foreground">
          Reisen
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/trips/${trip.id}`}
          className="transition-colors hover:text-foreground"
        >
          {trip.title}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">Reisegeschichte</span>
      </nav>

      {/* Hero */}
      <header className="flex flex-col gap-4">
        {coverMedia ? (
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl(coverMedia.thumbnailLg ?? coverMedia.originalPath)}
              alt={`Titelbild von ${trip.title}`}
              className="h-56 w-full object-cover sm:h-80"
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {trip.title}
            </h1>
            <Badge tone="muted">
              {TRIP_STATUS_LABELS[trip.status as TripStatusValue]}
            </Badge>
          </div>
          <p className="text-[var(--color-muted)]">
            {formatTripDateRange(trip.startDate, trip.endDate)}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-[var(--color-muted)]">
            {stats.map((stat, index) => (
              <span key={stat} className="flex items-center gap-x-3">
                {index > 0 ? <span aria-hidden="true">·</span> : null}
                {stat}
              </span>
            ))}
          </p>
          {trip.description ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {trip.description}
            </p>
          ) : null}
        </div>
      </header>

      {/* Days */}
      {days.length > 0 ? (
        <div className="flex flex-col gap-10">
          {days.map((storyDay) => (
            <StoryDaySection
              key={storyDay.day.id}
              tripId={trip.id}
              storyDay={storyDay}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">
          Diese Reise hat noch keine Reisetage.
        </p>
      )}

      {/* Weitere Eindrücke */}
      {unassignedMedia.length > 0 || unassignedNotes.length > 0 ? (
        <section className="flex flex-col gap-4 border-t border-[var(--color-border)] pt-6">
          <h2 className="text-xl font-semibold tracking-tight">
            Weitere Eindrücke
          </h2>
          {unassignedNotes.length > 0 ? (
            <div className="flex flex-col gap-3">
              {unassignedNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                >
                  <div className="mb-1.5">
                    <Badge tone="muted">
                      {noteTypeEmoji(note.type)} {noteTypeLabel(note.type)}
                    </Badge>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
          {unassignedMedia.length > 0 ? (
            <Gallery images={toGalleryImages(unassignedMedia)} />
          ) : null}
        </section>
      ) : null}

      {/* Karte */}
      {markers.length > 0 ? (
        <section className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-6">
          <h2 className="text-xl font-semibold tracking-tight">
            Karte der Reise
          </h2>
          <TripMap
            tripId={trip.id}
            markers={markers}
            heightClassName="h-[320px] sm:h-[460px]"
          />
        </section>
      ) : null}
    </div>
  );
}
