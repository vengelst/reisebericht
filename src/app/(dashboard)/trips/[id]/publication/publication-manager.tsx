"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deletePublication,
  publishPublication,
  unpublishPublication,
  updatePublication,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/ui/copy-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  PUBLICATION_STATUS_LABELS,
  shareUrl,
  type PublicationStatusValue,
} from "@/lib/publications";

type PublicationManagerProps = {
  tripId: string;
  publication: {
    id: string;
    title: string;
    status: PublicationStatusValue;
    hasPassword: boolean;
    shareToken: string;
  };
};

export function PublicationManager({
  tripId,
  publication,
}: PublicationManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Client-only origin for the absolute share URL (SSR-safe, no hydration flash).
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );

  const path = shareUrl(publication.shareToken);
  const fullUrl = origin ? `${origin}${path}` : path;
  const isPublished = publication.status === "PUBLISHED";

  function run(action: () => Promise<{ error?: string } | void>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function saveEdit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updatePublication(tripId, publication.id, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deletePublication(tripId, publication.id);
      if (result?.error) {
        setError(result.error);
        setConfirmOpen(false);
        return;
      }
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={isPublished ? "success" : "muted"}>
          {PUBLICATION_STATUS_LABELS[publication.status]}
        </Badge>
        {publication.hasPassword ? (
          <Badge tone="neutral">🔒 Passwortgeschützt</Badge>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Share-Link</span>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-accent)]"
          >
            {fullUrl}
          </a>
          <CopyButton text={fullUrl} label="Link kopieren" />
        </div>
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--color-muted)] transition-colors hover:text-foreground"
        >
          Vorschau öffnen →
        </a>
      </div>

      {!isPublished ? (
        <p className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-muted)]">
          Im Entwurfsmodus ist der Bericht nur für Sie sichtbar.
        </p>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {editing ? (
        <form
          action={saveEdit}
          className="flex flex-col gap-4 rounded-md border border-[var(--color-border)] p-4"
        >
          <Input
            label="Titel"
            name="title"
            defaultValue={publication.title}
            maxLength={200}
            required
          />
          <Input
            label="Passwort"
            name="password"
            type="password"
            autoComplete="new-password"
            hint={
              publication.hasPassword
                ? "Leer lassen entfernt den Passwortschutz."
                : "Optional. Leer lassen = kein Passwort."
            }
          />
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() => setEditing(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isPending}>
              Speichern
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {isPublished ? (
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() => run(() => unpublishPublication(tripId, publication.id))}
            >
              Zurückziehen
            </Button>
          ) : (
            <Button
              disabled={isPending}
              onClick={() => run(() => publishPublication(tripId, publication.id))}
            >
              Veröffentlichen
            </Button>
          )}
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() => setEditing(true)}
          >
            Bearbeiten
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
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Freigabe wirklich löschen?"
        description="Der Share-Link wird ungültig und der Bericht ist nicht mehr öffentlich erreichbar."
        confirmLabel="Löschen"
        destructive
        pending={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
