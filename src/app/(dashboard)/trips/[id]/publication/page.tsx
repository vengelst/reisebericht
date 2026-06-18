import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTrip } from "../../actions";
import { getPublication } from "./actions";
import { PublicationCreateForm } from "./publication-create-form";
import { PublicationManager } from "./publication-manager";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicationStatusValue } from "@/lib/publications";

export const metadata: Metadata = {
  title: "Freigabe",
};

type PublicationPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PublicationPage({
  params,
}: PublicationPageProps) {
  const { id } = await params;
  const [trip, publication] = await Promise.all([
    getTrip(id),
    getPublication(id),
  ]);

  if (!trip) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/trips/${trip.id}`}
          className="text-sm text-[var(--color-muted)] transition-colors hover:text-foreground"
        >
          ← Zurück zu „{trip.title}“
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Freigabe verwalten
        </h1>
      </div>

      <Card>
        <CardContent>
          {publication ? (
            <PublicationManager
              tripId={trip.id}
              publication={{
                id: publication.id,
                title: publication.title,
                status: publication.status as PublicationStatusValue,
                hasPassword: publication.passwordHash !== null,
                shareToken: publication.shareToken,
              }}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-[var(--color-muted)]">
                Teilen Sie Ihren Reisebericht mit anderen. Ein nicht gelisteter
                Link wird erzeugt, den nur Personen mit dem Link öffnen können.
              </p>
              <PublicationCreateForm tripId={trip.id} defaultTitle={trip.title} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
