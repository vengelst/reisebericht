"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteLocation } from "../actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function LocationDetailActions({
  tripId,
  locationId,
  name,
}: {
  tripId: string;
  locationId: string;
  name: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteLocation(tripId, locationId);
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
        <Link href={`/trips/${tripId}/locations/${locationId}/edit`}>
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
        title={`„${name}“ wirklich löschen?`}
        description="Dieser Ort wird unwiderruflich entfernt."
        confirmLabel="Löschen"
        destructive
        pending={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
