import Link from "next/link";
import type { TripDay } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatDistance,
  formatDrivingTime,
  formatTripDayDateShort,
} from "@/lib/trip-days";

function routeLabel(
  start: string | null,
  end: string | null,
): string | null {
  if (start && end) return `${start} → ${end}`;
  if (start) return `ab ${start}`;
  if (end) return `bis ${end}`;
  return null;
}

export function TripDaysTimeline({
  tripId,
  days,
  currentDayId,
}: {
  tripId: string;
  days: TripDay[];
  currentDayId: string | null;
}) {
  return (
    <ol className="flex flex-col gap-4">
      {days.map((day) => {
        const isCurrent = day.id === currentDayId;
        const route = routeLabel(day.startLocation, day.endLocation);
        const distance = formatDistance(day.distanceKm);
        const driving = formatDrivingTime(day.drivingMinutes);
        const meta = [distance, driving].filter(Boolean);

        return (
          <li key={day.id} className="flex gap-4">
            {/* Timeline rail — hidden on mobile (cards only). */}
            <div
              className="relative hidden w-4 shrink-0 sm:block"
              aria-hidden="true"
            >
              <div className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-[var(--color-border)]" />
              <div
                className={[
                  "absolute left-1/2 top-6 h-3 w-3 -translate-x-1/2 rounded-full border-2",
                  isCurrent
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)]",
                ].join(" ")}
              />
            </div>

            <Link
              href={`/trips/${tripId}/days/${day.id}`}
              className="block flex-1"
            >
              <Card
                className={[
                  "transition-colors hover:border-[var(--color-accent)]/60",
                  isCurrent ? "border-[var(--color-accent)]/70" : "",
                ].join(" ")}
              >
                <CardContent className="flex flex-col gap-2 py-4">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-foreground">
                      Tag {day.dayNumber}
                    </span>
                    <span className="text-sm text-[var(--color-muted)]">
                      · {formatTripDayDateShort(day.date)}
                    </span>
                    {isCurrent ? (
                      <span className="rounded-full bg-[var(--color-accent)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-accent)]">
                        Heute
                      </span>
                    ) : null}
                  </div>

                  {day.title ? (
                    <p className="text-sm font-medium text-foreground">
                      {day.title}
                    </p>
                  ) : null}

                  {route ? (
                    <p className="text-sm text-[var(--color-muted)]">{route}</p>
                  ) : null}

                  {meta.length > 0 ? (
                    <p className="text-xs text-[var(--color-muted)]">
                      {meta.join(" · ")}
                    </p>
                  ) : null}

                  {day.dailyNote ? (
                    <p className="line-clamp-2 whitespace-pre-wrap text-sm text-[var(--color-muted)]">
                      {day.dailyNote}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
