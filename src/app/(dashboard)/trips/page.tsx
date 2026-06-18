import Link from "next/link";
import type { Metadata } from "next";
import { getTrips } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TripStatusBadge, VisibilityIcon } from "@/components/trip/trip-badges";
import {
  formatTripDateRange,
  type TripStatusValue,
  type TripVisibilityValue,
} from "@/lib/trips";

export const metadata: Metadata = {
  title: "Reisen",
};

export default async function TripsPage() {
  const trips = await getTrips();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Reisen</h1>
          <p className="text-sm text-[var(--color-muted)]">
            {trips.length > 0
              ? `${trips.length} ${trips.length === 1 ? "Reise" : "Reisen"}`
              : "Verwalten Sie hier alle Ihre Reisen."}
          </p>
        </div>
        <Link href="/trips/new">
          <Button>Neue Reise</Button>
        </Link>
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
              <Button>Erste Reise anlegen</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link href={`/trips/${trip.id}`} className="block h-full">
                <Card className="h-full transition-colors hover:border-[var(--color-accent)]/60">
                  <CardContent className="flex h-full flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="line-clamp-2 text-base font-semibold text-foreground">
                        {trip.title}
                      </h2>
                      <VisibilityIcon
                        visibility={trip.visibility as TripVisibilityValue}
                      />
                    </div>

                    <p className="text-sm text-[var(--color-muted)]">
                      {formatTripDateRange(trip.startDate, trip.endDate)}
                    </p>

                    {trip.description ? (
                      <p className="line-clamp-2 text-sm text-[var(--color-muted)]">
                        {trip.description}
                      </p>
                    ) : (
                      <p className="text-sm italic text-[var(--color-muted)]/70">
                        Keine Beschreibung
                      </p>
                    )}

                    <div className="mt-auto pt-1">
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
      )}
    </div>
  );
}
