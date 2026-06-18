"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMedia, toggleMediaHighlight } from "../actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function MediaDetailActions({
  tripId,
  mediaId,
  isHighlight,
}: {
  tripId: string;
  mediaId: string;
  isHighlight: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function toggleHighlight() {
    setError(null);
    startTransition(async () => {
      const result = await toggleMediaHighlight(tripId, mediaId);
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
      const result = await deleteMedia(tripId, mediaId);
      if (result?.error) {
        setError(result.error);
        setConfirmOpen(false);
        return;
      }
      router.push(result?.redirectTo ?? `/trips/${tripId}/media`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" disabled={isPending} onClick={toggleHighlight}>
          {isHighlight ? "★ Highlight entfernen" : "☆ Als Highlight"}
        </Button>
        <Button
          variant="ghost"
          disabled={isPending}
          className="text-red-300 hover:bg-red-500/10"
          onClick={() => setConfirmOpen(true)}
        >
          Bild löschen
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title="Bild wirklich löschen?"
        description="Das Bild und alle Vorschaubilder werden unwiderruflich entfernt."
        confirmLabel="Löschen"
        destructive
        pending={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
