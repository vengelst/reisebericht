import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTrip } from "../../actions";
import { getTripDays } from "../days/actions";
import { getLocations } from "../locations/actions";
import { getMedia } from "./actions";
import { UploadZone } from "@/components/media/upload-zone";
import { Gallery } from "@/components/media/gallery";
import {
  MediaInbox,
  type InboxItem,
  type InboxOption,
} from "@/components/media/media-inbox";
import { haversineKm, mediaUrl, toGalleryImages } from "@/lib/media";
import { formatTripDayDateShort, toUtcDateKey } from "@/lib/trip-days";
import { categoryEmoji } from "@/lib/locations";

export const metadata: Metadata = {
  title: "Bilder",
};

type MediaPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    filter?: string;
    sort?: string;
    tripDayId?: string;
    locationId?: string;
  }>;
};

const FILTERS = [
  { key: "all", label: "Alle" },
  { key: "day", label: "Tagen zugeordnet" },
  { key: "location", label: "Orten zugeordnet" },
  { key: "inbox", label: "Eingang" },
] as const;

export default async function MediaPage({
  params,
  searchParams,
}: MediaPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const filter = ["all", "day", "location", "inbox"].includes(sp.filter ?? "")
    ? (sp.filter as "all" | "day" | "location" | "inbox")
    : "all";
  const sort = sp.sort === "createdAt" ? "createdAt" : "takenAt";

  const [trip, media, days, locations] = await Promise.all([
    getTrip(id),
    getMedia(id),
    getTripDays(id),
    getLocations(id),
  ]);

  if (!trip) {
    notFound();
  }

  const sorted =
    sort === "createdAt"
      ? [...media].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        )
      : media;

  const inboxMedia = sorted.filter((m) => !m.assigned);

  const filtered = sorted.filter((m) => {
    if (filter === "day") return m.tripDayId !== null;
    if (filter === "location") return m.locationId !== null;
    if (filter === "inbox") return !m.assigned;
    return true;
  });

  const dayOptions: InboxOption[] = days.map((day) => ({
    id: day.id,
    label: `Tag ${day.dayNumber} – ${formatTripDayDateShort(day.date)}`,
  }));
  const locationOptions: InboxOption[] = locations.map((location) => ({
    id: location.id,
    label: `${categoryEmoji(location.category)} ${location.name}`,
  }));

  // EXIF-based assignment suggestions for the inbox.
  const dayLabelById = new Map(dayOptions.map((d) => [d.id, d.label]));
  const locationLabelById = new Map(
    locationOptions.map((l) => [l.id, l.label]),
  );

  const inboxItems: InboxItem[] = inboxMedia.map((m) => {
    const takenKey = toUtcDateKey(m.takenAt);
    const suggestedDayId =
      takenKey != null
        ? (days.find((d) => toUtcDateKey(d.date) === takenKey)?.id ?? null)
        : null;

    let suggestedLocationId: string | null = null;
    if (m.latitude != null && m.longitude != null && locations.length > 0) {
      let best: { id: string; dist: number } | null = null;
      for (const loc of locations) {
        const dist = haversineKm(m.latitude, m.longitude, loc.latitude, loc.longitude);
        if (!best || dist < best.dist) best = { id: loc.id, dist };
      }
      if (best && best.dist <= 50) suggestedLocationId = best.id;
    }

    const parts = [
      suggestedDayId ? dayLabelById.get(suggestedDayId) : null,
      suggestedLocationId ? locationLabelById.get(suggestedLocationId) : null,
    ].filter(Boolean);

    return {
      id: m.id,
      thumbUrl: mediaUrl(m.thumbnailSm ?? m.originalPath),
      caption: m.caption,
      suggestedDayId,
      suggestedLocationId,
      suggestionLabel: parts.length > 0 ? parts.join(" · ") : null,
    };
  });

  const images = toGalleryImages(filtered);

  const buildQuery = (next: Partial<{ filter: string; sort: string }>) => {
    const query = new URLSearchParams();
    query.set("filter", next.filter ?? filter);
    query.set("sort", next.sort ?? sort);
    return `/trips/${trip.id}/media?${query.toString()}`;
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/trips/${trip.id}`}
          className="text-sm text-[var(--color-muted)] transition-colors hover:text-foreground"
        >
          ← Zurück zu „{trip.title}“
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bilder{media.length > 0 ? ` (${media.length})` : ""}
        </h1>
      </div>

      <UploadZone
        tripId={trip.id}
        defaultTripDayId={sp.tripDayId}
        defaultLocationId={sp.locationId}
      />

      {inboxMedia.length > 0 ? (
        <section className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="text-base font-medium">
            Eingang: {inboxMedia.length}{" "}
            {inboxMedia.length === 1 ? "Bild" : "Bilder"} ohne Zuordnung
          </h2>
          <MediaInbox
            tripId={trip.id}
            items={inboxItems}
            dayOptions={dayOptions}
            locationOptions={locationOptions}
          />
        </section>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={buildQuery({ filter: f.key })}
                className={[
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  filter === f.key
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-foreground"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-foreground",
                ].join(" ")}
              >
                {f.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--color-muted)]">Sortierung:</span>
            <Link
              href={buildQuery({ sort: "takenAt" })}
              className={
                sort === "takenAt"
                  ? "text-foreground"
                  : "text-[var(--color-muted)] hover:text-foreground"
              }
            >
              Aufnahmezeit
            </Link>
            <span className="text-[var(--color-muted)]">·</span>
            <Link
              href={buildQuery({ sort: "createdAt" })}
              className={
                sort === "createdAt"
                  ? "text-foreground"
                  : "text-[var(--color-muted)] hover:text-foreground"
              }
            >
              Upload-Datum
            </Link>
          </div>
        </div>

        <Gallery images={images} />
      </div>
    </div>
  );
}
