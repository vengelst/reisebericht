import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTrip } from "../../../actions";
import { getTripDay } from "../actions";
import { getLocationsByDay } from "../../locations/actions";
import { getMediaByDay } from "../../media/actions";
import { getNotesByDay } from "../../notes/actions";
import { QuickNote } from "@/components/notes/quick-note";
import { NoteListItem } from "@/components/notes/note-list-item";
import { DayDetailActions } from "./day-detail-actions";
import { TripMap } from "@/components/map/trip-map";
import { LocationListItem } from "@/components/trip/location-list-item";
import { Gallery } from "@/components/media/gallery";
import { UploadZone } from "@/components/media/upload-zone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatDistance,
  formatDrivingTime,
  formatTripDayDate,
} from "@/lib/trip-days";
import { toGalleryImages } from "@/lib/media";
import type { LocationCategoryValue } from "@/lib/locations";

type DayDetailPageProps = {
  params: Promise<{ id: string; dayId: string }>;
};

export async function generateMetadata({
  params,
}: DayDetailPageProps): Promise<Metadata> {
  const { id, dayId } = await params;
  const day = await getTripDay(id, dayId);
  return { title: day ? `Tag ${day.dayNumber}` : "Reisetag" };
}

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

export default async function DayDetailPage({ params }: DayDetailPageProps) {
  const { id, dayId } = await params;
  const [trip, day, locations, media, notes] = await Promise.all([
    getTrip(id),
    getTripDay(id, dayId),
    getLocationsByDay(id, dayId),
    getMediaByDay(id, dayId),
    getNotesByDay(id, dayId),
  ]);

  if (!trip || !day) {
    notFound();
  }

  const distance = formatDistance(day.distanceKm);
  const driving = formatDrivingTime(day.drivingMinutes);
  const dayImages = toGalleryImages(media);

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
        <span className="text-foreground">Tag {day.dayNumber}</span>
      </nav>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Tag {day.dayNumber}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          {formatTripDayDate(day.date)}
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5">
          {day.title ? (
            <h2 className="text-lg font-medium text-foreground">{day.title}</h2>
          ) : null}

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailRow label="Startort" value={day.startLocation ?? "—"} />
            <DetailRow label="Zielort" value={day.endLocation ?? "—"} />
            <DetailRow label="Strecke" value={distance || "—"} />
            <DetailRow label="Fahrzeit" value={driving || "—"} />
          </dl>

          <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
            <h3 className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
              Tagesnotiz
            </h3>
            {day.dailyNote ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {day.dailyNote}
              </p>
            ) : (
              <p className="text-sm italic text-[var(--color-muted)]">
                Keine Tagesnotiz hinterlegt.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <DayDetailActions
        tripId={trip.id}
        dayId={day.id}
        dayNumber={day.dayNumber}
      />

      {/* Orte an diesem Tag */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Orte an diesem Tag{locations.length > 0 ? ` (${locations.length})` : ""}
          </h2>
          <Link href={`/trips/${trip.id}/locations/new?dayId=${day.id}`}>
            <Button>Ort zu diesem Tag hinzufügen</Button>
          </Link>
        </div>

        {locations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-[var(--color-muted)]">
              Noch keine Orte für diesen Tag.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            <TripMap
              tripId={trip.id}
              markers={locations.map((location) => ({
                id: location.id,
                name: location.name,
                category: location.category as LocationCategoryValue,
                latitude: location.latitude,
                longitude: location.longitude,
                isHighlight: location.isHighlight,
                description: location.description,
                tripDayId: location.tripDayId,
                sortOrder: location.sortOrder,
              }))}
              heightClassName="h-[260px] sm:h-[320px]"
            />
            <ul className="flex flex-col gap-2">
              {locations.map((location) => (
                <li key={location.id}>
                  <LocationListItem tripId={trip.id} location={location} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Bilder an diesem Tag */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Bilder{dayImages.length > 0 ? ` (${dayImages.length})` : ""}
          </h2>
          <Link href={`/trips/${trip.id}/media?filter=day`}>
            <Button variant="secondary">Alle Bilder</Button>
          </Link>
        </div>
        <UploadZone tripId={trip.id} defaultTripDayId={day.id} />
        {dayImages.length > 0 ? <Gallery images={dayImages} /> : null}
      </section>

      {/* Notizen */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Notizen{notes.length > 0 ? ` (${notes.length})` : ""}
          </h2>
          <Link href={`/trips/${trip.id}/notes`}>
            <Button variant="secondary">Alle Notizen</Button>
          </Link>
        </div>
        <QuickNote tripId={trip.id} tripDayId={day.id} />
        {notes.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {notes.map((note) => (
              <li key={note.id}>
                <NoteListItem tripId={trip.id} note={note} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
