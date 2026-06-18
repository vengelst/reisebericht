import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicStoryData, hasShareAccess } from "./actions";
import { SharePasswordForm } from "./share-password-form";
import { StoryDaySection } from "@/components/story/story-day-section";
import { TripMap, type TripMapMarker } from "@/components/map/trip-map";
import { Gallery } from "@/components/media/gallery";
import { Badge } from "@/components/ui/badge";
import { formatTripDateRange } from "@/lib/trips";
import { formatDistance, formatDrivingTime, toNumberOrNull } from "@/lib/trip-days";
import { mediaUrl, toGalleryImages } from "@/lib/media";
import { noteTypeEmoji, noteTypeLabel } from "@/lib/notes";
import type { LocationCategoryValue } from "@/lib/locations";

type SharePageProps = {
  params: Promise<{ token: string }>;
};

const publishedFormat = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "long",
});

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const data = await getPublicStoryData(token);
  return {
    title: data ? data.publication.title : "Reisebericht",
    robots: { index: false, follow: false },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const data = await getPublicStoryData(token);

  if (!data) {
    notFound();
  }

  // Password gate.
  if (data.publication.hasPassword && !(await hasShareAccess(token))) {
    return <SharePasswordForm token={token} />;
  }

  const {
    trip,
    coverMedia,
    days,
    unassignedMedia,
    unassignedNotes,
    allLocations,
    publication,
  } = data;
  const tokenOpts = { shareToken: token };

  const allMedia = [...days.flatMap((d) => d.media), ...unassignedMedia];
  const totalDistance = days.reduce(
    (sum, d) => sum + (toNumberOrNull(d.day.distanceKm) ?? 0),
    0,
  );
  const totalDriving = days.reduce(
    (sum, d) => sum + (d.day.drivingMinutes ?? 0),
    0,
  );

  const stats = [
    `${days.length} ${days.length === 1 ? "Tag" : "Tage"}`,
    formatDistance(totalDistance) || null,
    formatDrivingTime(totalDriving) || null,
    `${allLocations.length} ${allLocations.length === 1 ? "Ort" : "Orte"}`,
    `${allMedia.length} ${allMedia.length === 1 ? "Bild" : "Bilder"}`,
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
    <div className="flex w-full flex-col gap-8">
      {/* Hero */}
      <header className="flex flex-col gap-4">
        {coverMedia ? (
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl(
                coverMedia.thumbnailLg ?? coverMedia.originalPath,
                tokenOpts,
              )}
              alt={`Titelbild von ${trip.title}`}
              className="h-56 w-full object-cover sm:h-80"
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {trip.title}
          </h1>
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
              readOnly
              shareToken={token}
            />
          ))}
        </div>
      ) : null}

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
            <Gallery images={toGalleryImages(unassignedMedia, tokenOpts)} />
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
            readOnly
            heightClassName="h-[320px] sm:h-[460px]"
          />
        </section>
      ) : null}

      <footer className="border-t border-[var(--color-border)] pt-6 text-center text-sm text-[var(--color-muted)]">
        <p>Erstellt mit Reisebericht</p>
        {publication.publishedAt ? (
          <p className="mt-1">
            Veröffentlicht am {publishedFormat.format(publication.publishedAt)}
          </p>
        ) : null}
      </footer>
    </div>
  );
}
