"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteTripDay } from "../actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DayDetailActions({
  tripId,
  dayId,
  dayNumber,
}: {
  tripId: string;
  dayId: string;
  dayNumber: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteTripDay(tripId, dayId);
      if (result?.error) {
        setError(result.error);
        setConfirmOpen(false);
        return;
      }
      router.push(result?.redirectTo ?? `/trips/${tripId}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/trips/${tripId}/days/${dayId}/edit`}>
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
        title={`Tag ${dayNumber} wirklich löschen?`}
        description="Dieser Tag und alle zugehörigen Daten werden unwiderruflich entfernt."
        confirmLabel="Löschen"
        destructive
        pending={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
