"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteTrip, setTripStatus } from "../actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { TripStatusValue } from "@/lib/trips";

type StatusTransition = {
  to: TripStatusValue;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
};

// Contextual status transitions offered for the current status.
const TRANSITIONS: Record<TripStatusValue, StatusTransition[]> = {
  PLANNING: [{ to: "ACTIVE", label: "Reise starten" }],
  ACTIVE: [{ to: "COMPLETED", label: "Reise abschließen" }],
  COMPLETED: [
    { to: "ACTIVE", label: "Wieder aktivieren", variant: "secondary" },
  ],
  ARCHIVED: [
    { to: "PLANNING", label: "Wiederherstellen", variant: "secondary" },
  ],
};

export function TripActions({
  tripId,
  status,
  title,
}: {
  tripId: string;
  status: TripStatusValue;
  title: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function changeStatus(to: TripStatusValue) {
    setError(null);
    startTransition(async () => {
      const result = await setTripStatus(tripId, to);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteTrip(tripId);
      if (result?.error) {
        setError(result.error);
        setConfirmOpen(false);
        return;
      }
      router.push(result?.redirectTo ?? "/trips");
      router.refresh();
    });
  }

  const transitions = TRANSITIONS[status] ?? [];
  const canArchive = status !== "ARCHIVED";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {transitions.map((transition) => (
          <Button
            key={transition.to}
            variant={transition.variant ?? "primary"}
            disabled={isPending}
            onClick={() => changeStatus(transition.to)}
          >
            {transition.label}
          </Button>
        ))}

        {canArchive ? (
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={() => changeStatus("ARCHIVED")}
          >
            Archivieren
          </Button>
        ) : null}

        <Link href={`/trips/${tripId}/edit`}>
          <Button variant="secondary" disabled={isPending}>
            Bearbeiten
          </Button>
        </Link>

        <Button
          variant="ghost"
          disabled={isPending}
          className="text-red-300 hover:bg-red-500/10"
          onClick={() => setConfirmOpen(true)}
        >
          Löschen
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title="Reise wirklich löschen?"
        description={`„${title}“ wird in den Papierkorb verschoben und aus der Übersicht entfernt.`}
        confirmLabel="Löschen"
        destructive
        pending={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
