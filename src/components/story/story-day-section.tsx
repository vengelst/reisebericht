import Link from "next/link";
import type { Media, Note } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { LocationListItem } from "@/components/trip/location-list-item";
import { Gallery } from "@/components/media/gallery";
import type { StoryDay } from "@/lib/story";
import {
  formatDistance,
  formatDrivingTime,
  formatTripDayDate,
} from "@/lib/trip-days";
import { mediaUrl, toGalleryImages } from "@/lib/media";
import { noteTypeEmoji, noteTypeLabel } from "@/lib/notes";

function routeLabel(start: string | null, end: string | null): string | null {
  if (start && end) return `${start} → ${end}`;
  if (start) return `ab ${start}`;
  if (end) return `bis ${end}`;
  return null;
}

function NoteBlock({ note, highlight }: { note: Note; highlight?: boolean }) {
  return (
    <div
      className={[
        "rounded-md p-3",
        highlight
          ? "border-l-4 border-amber-400 bg-amber-400/5"
          : "border border-[var(--color-border)] bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <Badge tone="muted">
          {noteTypeEmoji(note.type)} {noteTypeLabel(note.type)}
        </Badge>
        {highlight ? (
          <span className="text-amber-300" title="Highlight">
            ★
          </span>
        ) : null}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {note.content}
      </p>
    </div>
  );
}

function HighlightImage({ tripId, media }: { tripId: string; media: Media }) {
  return (
    <figure className="overflow-hidden rounded-lg border-l-4 border-amber-400 bg-amber-400/5">
      <Link href={`/trips/${tripId}/media/${media.id}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl(media.thumbnailLg ?? media.originalPath)}
          alt={media.caption ?? "Highlight-Bild"}
          className="max-h-[70vh] w-full object-cover"
        />
      </Link>
      {media.caption ? (
        <figcaption className="px-3 py-2 text-sm text-[var(--color-muted)]">
          ★ {media.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function StoryDaySection({
  tripId,
  storyDay,
}: {
  tripId: string;
  storyDay: StoryDay;
}) {
  const { day, locations, media, notes } = storyDay;

  const highlightLocations = locations.filter((l) => l.isHighlight);
  const normalLocations = locations.filter((l) => !l.isHighlight);
  const highlightMedia = media.filter((m) => m.isHighlight);
  const normalMedia = media.filter((m) => !m.isHighlight);
  const highlightNotes = notes.filter((n) => n.isHighlight);
  const normalNotes = notes.filter((n) => !n.isHighlight);

  const route = routeLabel(day.startLocation, day.endLocation);
  const distance = formatDistance(day.distanceKm);
  const driving = formatDrivingTime(day.drivingMinutes);
  const meta = [distance, driving].filter(Boolean);

  const isEmpty =
    locations.length === 0 && media.length === 0 && notes.length === 0;
  const hasHighlights =
    highlightLocations.length > 0 ||
    highlightMedia.length > 0 ||
    highlightNotes.length > 0;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 border-b border-[var(--color-border)] pb-3">
        <Link
          href={`/trips/${tripId}/days/${day.id}`}
          className="text-xl font-semibold tracking-tight transition-colors hover:text-[var(--color-accent)]"
        >
          Tag {day.dayNumber} — {formatTripDayDate(day.date)}
        </Link>
        {day.title ? (
          <p className="text-base text-foreground">{day.title}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-[var(--color-muted)]">
          {route ? <span>{route}</span> : null}
          {meta.length > 0 ? <span>{meta.join(" · ")}</span> : null}
        </div>
      </div>

      {day.dailyNote ? (
        <blockquote className="border-l-4 border-[var(--color-accent)] bg-[var(--color-surface)] px-4 py-3 text-sm italic leading-relaxed text-foreground">
          {day.dailyNote}
        </blockquote>
      ) : null}

      {hasHighlights ? (
        <div className="flex flex-col gap-3 rounded-lg border-l-4 border-amber-400 bg-amber-400/5 p-4">
          <h3 className="text-sm font-semibold text-amber-300">
            ★ Highlights
          </h3>
          {highlightLocations.length > 0 ? (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {highlightLocations.map((location) => (
                <li key={location.id}>
                  <LocationListItem tripId={tripId} location={location} />
                </li>
              ))}
            </ul>
          ) : null}
          {highlightMedia.map((item) => (
            <HighlightImage key={item.id} tripId={tripId} media={item} />
          ))}
          {highlightNotes.map((note) => (
            <NoteBlock key={note.id} note={note} highlight />
          ))}
        </div>
      ) : null}

      {normalLocations.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-[var(--color-muted)]">
            Besuchte Orte
          </h3>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {normalLocations.map((location) => (
              <li key={location.id}>
                <LocationListItem tripId={tripId} location={location} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {normalNotes.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-[var(--color-muted)]">
            Notizen
          </h3>
          {normalNotes.map((note) => (
            <NoteBlock key={note.id} note={note} />
          ))}
        </div>
      ) : null}

      {normalMedia.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-[var(--color-muted)]">
            Bilder
          </h3>
          <Gallery images={toGalleryImages(normalMedia)} />
        </div>
      ) : null}

      {isEmpty ? (
        <p className="text-sm text-[var(--color-muted)]">
          Reisetag ohne Einträge.{" "}
          <Link
            href={`/trips/${tripId}/days/${day.id}`}
            className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
          >
            Inhalte hinzufügen
          </Link>
        </p>
      ) : null}
    </section>
  );
}
