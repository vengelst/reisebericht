import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTrip } from "../../../actions";
import { getTripDay } from "../../days/actions";
import { getLocation } from "../../locations/actions";
import { getNote } from "../actions";
import { NoteDetailActions } from "./note-detail-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { noteTypeEmoji, noteTypeLabel } from "@/lib/notes";
import { formatTripDayDateShort } from "@/lib/trip-days";
import { categoryEmoji } from "@/lib/locations";

type NoteDetailPageProps = {
  params: Promise<{ id: string; noteId: string }>;
};

export async function generateMetadata({
  params,
}: NoteDetailPageProps): Promise<Metadata> {
  const { id, noteId } = await params;
  const note = await getNote(id, noteId);
  return { title: note ? noteTypeLabel(note.type) : "Notiz" };
}

const dateFormat = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { id, noteId } = await params;
  const [trip, note] = await Promise.all([getTrip(id), getNote(id, noteId)]);

  if (!trip || !note) {
    notFound();
  }

  const [day, location] = await Promise.all([
    note.tripDayId ? getTripDay(id, note.tripDayId) : Promise.resolve(null),
    note.locationId ? getLocation(id, note.locationId) : Promise.resolve(null),
  ]);

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
          href={`/trips/${trip.id}/notes`}
          className="transition-colors hover:text-foreground"
        >
          Notizen
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">{noteTypeLabel(note.type)}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="muted">
          {noteTypeEmoji(note.type)} {noteTypeLabel(note.type)}
        </Badge>
        {note.isHighlight ? (
          <Badge tone="neutral">★ Highlight</Badge>
        ) : null}
        <span className="text-sm text-[var(--color-muted)]">
          {dateFormat.format(note.createdAt)}
        </span>
      </div>

      <Card>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {note.content}
          </p>
        </CardContent>
      </Card>

      {day || location ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="text-[var(--color-muted)]">Zuordnung:</span>
          {day ? (
            <Link
              href={`/trips/${trip.id}/days/${day.id}`}
              className="text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]"
            >
              Tag {day.dayNumber} – {formatTripDayDateShort(day.date)}
            </Link>
          ) : null}
          {location ? (
            <Link
              href={`/trips/${trip.id}/locations/${location.id}`}
              className="text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]"
            >
              {categoryEmoji(location.category)} {location.name}
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="text-xs text-[var(--color-muted)]">
        Aktualisiert: {dateFormat.format(note.updatedAt)}
      </div>

      <NoteDetailActions
        tripId={trip.id}
        noteId={note.id}
        isHighlight={note.isHighlight}
      />
    </div>
  );
}
