import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTrip } from "../../actions";
import { getTripDays } from "../days/actions";
import { getLocations } from "../locations/actions";
import { getNotes } from "./actions";
import { Button } from "@/components/ui/button";
import { NoteListItem } from "@/components/notes/note-list-item";
import { isNoteType } from "@/lib/notes";
import { categoryEmoji } from "@/lib/locations";

export const metadata: Metadata = {
  title: "Notizen",
};

type NotesPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
};

const FILTERS = [
  { key: "all", label: "Alle" },
  { key: "QUICK", label: "Schnellnotizen" },
  { key: "DICTATION", label: "Diktate" },
  { key: "REPORT", label: "Berichte" },
] as const;

export default async function NotesPage({
  params,
  searchParams,
}: NotesPageProps) {
  const { id } = await params;
  const { filter: rawFilter } = await searchParams;
  const filter =
    rawFilter && isNoteType(rawFilter) ? rawFilter : "all";

  const [trip, notes, days, locations] = await Promise.all([
    getTrip(id),
    getNotes(id),
    getTripDays(id),
    getLocations(id),
  ]);

  if (!trip) {
    notFound();
  }

  const dayLabel = new Map(days.map((d) => [d.id, `Tag ${d.dayNumber}`]));
  const locationLabel = new Map(
    locations.map((l) => [l.id, `${categoryEmoji(l.category)} ${l.name}`]),
  );

  function assignmentFor(note: (typeof notes)[number]): string | null {
    const parts: string[] = [];
    if (note.tripDayId && dayLabel.has(note.tripDayId))
      parts.push(dayLabel.get(note.tripDayId)!);
    if (note.locationId && locationLabel.has(note.locationId))
      parts.push(locationLabel.get(note.locationId)!);
    return parts.length > 0 ? parts.join(" · ") : null;
  }

  const filtered =
    filter === "all" ? notes : notes.filter((n) => n.type === filter);

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
        <span className="text-foreground">Notizen</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Notizen{notes.length > 0 ? ` (${notes.length})` : ""}
        </h1>
        <Link href={`/trips/${trip.id}/notes/new`}>
          <Button>Neue Notiz</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/trips/${trip.id}/notes?filter=${f.key}`}
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

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-12 text-center text-sm text-[var(--color-muted)]">
          {notes.length === 0
            ? "Noch keine Notizen. Halten Sie Ihre Gedanken fest."
            : "Keine Notizen in dieser Kategorie."}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((note) => (
            <li key={note.id}>
              <NoteListItem
                tripId={trip.id}
                note={note}
                assignment={assignmentFor(note)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
