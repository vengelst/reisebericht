import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTrip } from "../../../actions";
import { getTripDay } from "../actions";
import { DayDetailActions } from "./day-detail-actions";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatDistance,
  formatDrivingTime,
  formatTripDayDate,
} from "@/lib/trip-days";

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

const PLACEHOLDER_SECTIONS = [
  { title: "Orte an diesem Tag", hint: "Besuchte und geplante Orte." },
  { title: "Bilder an diesem Tag", hint: "Fotos zu diesem Tag." },
  { title: "Notizen", hint: "Weitere Notizen zu diesem Tag." },
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

export default async function DayDetailPage({ params }: DayDetailPageProps) {
  const { id, dayId } = await params;
  const [trip, day] = await Promise.all([getTrip(id), getTripDay(id, dayId)]);

  if (!trip || !day) {
    notFound();
  }

  const distance = formatDistance(day.distanceKm);
  const driving = formatDrivingTime(day.drivingMinutes);

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
            <DetailRow
              label="Startort"
              value={day.startLocation ?? "—"}
            />
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
