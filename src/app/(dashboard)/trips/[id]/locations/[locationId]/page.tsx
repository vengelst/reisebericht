import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTrip } from "../../../actions";
import { getTripDay } from "../../days/actions";
import { getLocation } from "../actions";
import { getMediaByLocation } from "../../media/actions";
import { LocationDetailActions } from "./location-detail-actions";
import { TripMap } from "@/components/map/trip-map";
import { Gallery } from "@/components/media/gallery";
import { UploadZone } from "@/components/media/upload-zone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toGalleryImages } from "@/lib/media";
import {
  categoryEmoji,
  categoryLabel,
  formatCoordinates,
  formatRatingStars,
  googleMapsUrl,
  type LocationCategoryValue,
} from "@/lib/locations";
import { formatTripDayDateShort } from "@/lib/trip-days";

type LocationDetailPageProps = {
  params: Promise<{ id: string; locationId: string }>;
};

export async function generateMetadata({
  params,
}: LocationDetailPageProps): Promise<Metadata> {
  const { id, locationId } = await params;
  const location = await getLocation(id, locationId);
  return { title: location ? location.name : "Ort" };
}

const PLACEHOLDER_SECTIONS = [
  { title: "Notizen", hint: "Weitere Notizen zu diesem Ort." },
];

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

export default async function LocationDetailPage({
  params,
}: LocationDetailPageProps) {
  const { id, locationId } = await params;
  const [trip, location, media] = await Promise.all([
    getTrip(id),
    getLocation(id, locationId),
    getMediaByLocation(id, locationId),
  ]);

  if (!trip || !location) {
    notFound();
  }

  const day = location.tripDayId
    ? await getTripDay(id, location.tripDayId)
    : null;
  const stars = formatRatingStars(location.rating);
  const locationImages = toGalleryImages(media);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
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
        <span className="text-foreground">{location.name}</span>
      </nav>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            <span aria-hidden="true">{categoryEmoji(location.category)}</span>{" "}
            {location.name}
          </h1>
          {location.isHighlight ? (
            <Badge tone="neutral">★ Highlight</Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
          <Badge tone="muted">
            {categoryLabel(location.category as LocationCategoryValue)}
          </Badge>
          {stars ? (
            <span className="text-[var(--color-accent)]" title="Bewertung">
              {stars}
            </span>
          ) : null}
        </div>
      </div>

      <TripMap
        tripId={trip.id}
        markers={[
          {
            id: location.id,
            name: location.name,
            category: location.category as LocationCategoryValue,
            latitude: location.latitude,
            longitude: location.longitude,
            isHighlight: location.isHighlight,
            description: location.description,
            tripDayId: location.tripDayId,
            sortOrder: location.sortOrder,
          },
        ]}
        heightClassName="h-[260px] sm:h-[320px]"
      />

      <Card>
        <CardContent className="flex flex-col gap-5">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailRow
              label="Koordinaten"
              value={formatCoordinates(location.latitude, location.longitude)}
            />
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                Reisetag
              </dt>
              <dd className="text-sm text-foreground">
                {day ? (
                  <Link
                    href={`/trips/${trip.id}/days/${day.id}`}
                    className="text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]"
                  >
                    Tag {day.dayNumber} – {formatTripDayDateShort(day.date)}
                  </Link>
                ) : (
                  "Ohne Tageszuordnung"
                )}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
            <h3 className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
              Beschreibung
            </h3>
            {location.description ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {location.description}
              </p>
            ) : (
              <p className="text-sm italic text-[var(--color-muted)]">
                Keine Beschreibung hinterlegt.
              </p>
            )}
          </div>

          <div>
            <a
              href={googleMapsUrl(location.latitude, location.longitude)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary">In Google Maps öffnen</Button>
            </a>
          </div>
        </CardContent>
      </Card>

      <LocationDetailActions
        tripId={trip.id}
        locationId={location.id}
        name={location.name}
      />

      {/* Bilder an diesem Ort */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Bilder{locationImages.length > 0 ? ` (${locationImages.length})` : ""}
          </h2>
          <Link href={`/trips/${trip.id}/media?filter=location`}>
            <Button variant="secondary">Alle Bilder</Button>
          </Link>
        </div>
        <UploadZone tripId={trip.id} defaultLocationId={location.id} />
        {locationImages.length > 0 ? (
          <Gallery images={locationImages} />
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PLACEHOLDER_SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-foreground">
                  {section.title}
                </h3>
                <span className="shrink-0 rounded-full bg-[var(--color-surface-elevated)] px-2 py-0.5 text-xs text-[var(--color-muted)]">
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
