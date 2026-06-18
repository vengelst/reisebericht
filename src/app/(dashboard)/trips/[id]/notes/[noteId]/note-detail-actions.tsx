"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteNote, toggleNoteHighlight } from "../actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function NoteDetailActions({
  tripId,
  noteId,
  isHighlight,
}: {
  tripId: string;
  noteId: string;
  isHighlight: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function toggleHighlight() {
    setError(null);
    startTransition(async () => {
      const result = await toggleNoteHighlight(tripId, noteId);
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
      const result = await deleteNote(tripId, noteId);
      if (result?.error) {
        setError(result.error);
        setConfirmOpen(false);
        return;
      }
      router.push(result?.redirectTo ?? `/trips/${tripId}/notes`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/trips/${tripId}/notes/${noteId}/edit`}>
          <Button variant="secondary" disabled={isPending}>
            Bearbeiten
          </Button>
        </Link>
        <Button variant="ghost" disabled={isPending} onClick={toggleHighlight}>
          {isHighlight ? "★ Highlight entfernen" : "☆ Als Highlight"}
        </Button>
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
        title="Notiz wirklich löschen?"
        description="Diese Notiz wird unwiderruflich entfernt."
        confirmLabel="Löschen"
        destructive
        pending={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
