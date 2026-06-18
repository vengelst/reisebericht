import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTrip } from "../../../actions";
import { getTripDays } from "../../days/actions";
import { getLocations } from "../../locations/actions";
import { getMediaItem } from "../actions";
import { MediaEditForm } from "../media-edit-form";
import { MediaDetailActions } from "./media-detail-actions";
import { PointMap } from "@/components/map/point-map";
import { Card, CardContent } from "@/components/ui/card";
import type { InboxOption } from "@/components/media/media-inbox";
import {
  formatDimensions,
  formatFileSize,
  formatTakenAt,
  mediaUrl,
} from "@/lib/media";
import { formatTripDayDateShort } from "@/lib/trip-days";
import { categoryEmoji, formatCoordinates } from "@/lib/locations";

type MediaDetailPageProps = {
  params: Promise<{ id: string; mediaId: string }>;
};

export const metadata: Metadata = {
  title: "Bild",
};

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

export default async function MediaDetailPage({
  params,
}: MediaDetailPageProps) {
  const { id, mediaId } = await params;
  const [trip, media, days, locations] = await Promise.all([
    getTrip(id),
    getMediaItem(id, mediaId),
    getTripDays(id),
    getLocations(id),
  ]);

  if (!trip || !media) {
    notFound();
  }

  const dayOptions: InboxOption[] = days.map((day) => ({
    id: day.id,
    label: `Tag ${day.dayNumber} – ${formatTripDayDateShort(day.date)}`,
  }));
  const locationOptions: InboxOption[] = locations.map((location) => ({
    id: location.id,
    label: `${categoryEmoji(location.category)} ${location.name}`,
  }));

  const camera = (media.exifData as { camera?: string } | null)?.camera ?? null;
  const takenAt = formatTakenAt(media.takenAt);
  const size = formatFileSize(
    media.fileSizeBytes != null ? Number(media.fileSizeBytes) : null,
  );
  const dimensions = formatDimensions(media.width, media.height);
  const hasGps = media.latitude != null && media.longitude != null;

  const metaRows = [
    takenAt ? { label: "Aufnahmezeit", value: takenAt } : null,
    camera ? { label: "Kamera", value: camera } : null,
    size ? { label: "Dateigröße", value: size } : null,
    dimensions ? { label: "Abmessungen", value: dimensions } : null,
    hasGps
      ? {
          label: "GPS-Koordinaten",
          value: formatCoordinates(media.latitude!, media.longitude!),
        }
      : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

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
        <Link
          href={`/trips/${trip.id}/media`}
          className="transition-colors hover:text-foreground"
        >
          Bilder
        </Link>
      </nav>

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-black/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl(media.thumbnailLg ?? media.originalPath)}
          alt={media.caption ?? "Bild"}
          className="mx-auto max-h-[70vh] w-auto object-contain"
        />
      </div>

      {metaRows.length > 0 ? (
        <Card>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {metaRows.map((row) => (
                <MetaRow key={row.label} label={row.label} value={row.value} />
              ))}
            </dl>
          </CardContent>
        </Card>
      ) : null}

      {hasGps ? (
        <PointMap latitude={media.latitude!} longitude={media.longitude!} />
      ) : null}

      <Card>
        <CardContent>
          <MediaEditForm
            tripId={trip.id}
            mediaId={media.id}
            dayOptions={dayOptions}
            locationOptions={locationOptions}
            initial={{
              caption: media.caption ?? "",
              tripDayId: media.tripDayId ?? "",
              locationId: media.locationId ?? "",
              isHighlight: media.isHighlight,
              isCover: media.isCover,
            }}
          />
        </CardContent>
      </Card>

      <MediaDetailActions tripId={trip.id} mediaId={media.id} />
    </div>
  );
}
