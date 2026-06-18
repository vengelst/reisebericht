import Link from "next/link";
import { getTrips } from "../trips/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TripStatusBadge, VisibilityIcon } from "@/components/trip/trip-badges";
import {
  formatTripDateRange,
  type TripStatusValue,
  type TripVisibilityValue,
} from "@/lib/trips";

export default async function DashboardPage() {
  const trips = await getTrips();
  const recentTrips = trips.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Übersicht</h1>
          <p className="text-sm text-[var(--color-muted)]">
            {trips.length > 0
              ? `Sie haben ${trips.length} ${
                  trips.length === 1 ? "Reise" : "Reisen"
                }.`
              : "Hier finden Sie alle Ihre Reisen."}
          </p>
        </div>
        {trips.length > 0 ? (
          <Link href="/trips/new">
            <Button>Neue Reise</Button>
          </Link>
        ) : null}
      </div>

      {trips.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-elevated)] text-[var(--color-muted)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-medium">
                Noch keine Reisen vorhanden
              </h2>
              <p className="max-w-md text-sm text-[var(--color-muted)]">
                Legen Sie Ihre erste Reise an, um Tage, Orte und Notizen zu
                erfassen.
              </p>
            </div>
            <Link href="/trips/new">
              <Button>Neue Reise</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">Zuletzt bearbeitet</h2>
            <Link
              href="/trips"
              className="text-sm text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]"
            >
              Alle Reisen anzeigen
            </Link>
          </div>

          <ul className="flex flex-col gap-3">
            {recentTrips.map((trip) => (
              <li key={trip.id}>
                <Link href={`/trips/${trip.id}`} className="block">
                  <Card className="transition-colors hover:border-[var(--color-accent)]/60">
                    <CardContent className="flex items-center justify-between gap-4 py-4">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="truncate text-sm font-medium text-foreground">
                          {trip.title}
                        </span>
                        <span className="text-xs text-[var(--color-muted)]">
                          {formatTripDateRange(trip.startDate, trip.endDate)}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <VisibilityIcon
                          visibility={trip.visibility as TripVisibilityValue}
                        />
                        <TripStatusBadge
                          status={trip.status as TripStatusValue}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
