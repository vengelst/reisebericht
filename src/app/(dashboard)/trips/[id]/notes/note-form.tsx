"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createNote, updateNote } from "./actions";
import { useDictation } from "@/components/notes/use-dictation";
import { MicButton } from "@/components/notes/mic-button";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  NOTE_TYPES,
  NOTE_TYPE_EMOJI,
  NOTE_TYPE_LABELS,
  type NoteTypeValue,
} from "@/lib/notes";

export type NoteOption = { id: string; label: string };

type NoteFormProps = {
  tripId: string;
  noteId?: string;
  initial?: {
    type: NoteTypeValue;
    content: string;
    tripDayId: string;
    locationId: string;
  };
  dayOptions: NoteOption[];
  locationOptions: NoteOption[];
  defaultTripDayId?: string;
  defaultLocationId?: string;
  submitLabel: string;
  cancelHref: string;
};

export function NoteForm({
  tripId,
  noteId,
  initial,
  dayOptions,
  locationOptions,
  defaultTripDayId,
  defaultLocationId,
  submitLabel,
  cancelHref,
}: NoteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<NoteTypeValue>(initial?.type ?? "QUICK");
  const [content, setContent] = useState(initial?.content ?? "");

  const dictation = useDictation((text) => {
    setContent((prev) => (prev ? `${prev} ${text}` : text));
    setType("DICTATION");
  });

  const isEdit = Boolean(noteId);
  const rows = type === "REPORT" ? 8 : 3;

  function onSubmit(formData: FormData) {
    setError(null);
    formData.set("type", type);
    formData.set("content", content);
    startTransition(async () => {
      const result = isEdit
        ? await updateNote(tripId, noteId!, formData)
        : await createNote(tripId, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push(result?.redirectTo ?? `/trips/${tripId}/notes`);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent>
        <form action={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {NOTE_TYPES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={[
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  type === value
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-foreground"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-foreground",
                ].join(" ")}
              >
                {NOTE_TYPE_EMOJI[value]} {NOTE_TYPE_LABELS[value]}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="note-content"
              className="text-sm font-medium text-foreground"
            >
              Inhalt
            </label>
            <div className="flex items-start gap-2">
              <textarea
                id="note-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={rows}
                placeholder={
                  type === "REPORT"
                    ? "Verfassen Sie Ihren Bericht…"
                    : "Notiz eingeben oder Spracheingabe verwenden…"
                }
                className="w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-foreground placeholder:text-[var(--color-muted)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
              <MicButton
                supported={dictation.supported}
                listening={dictation.listening}
                onToggle={dictation.toggle}
              />
            </div>
            {dictation.listening ? (
              <span className="text-xs text-red-300">Spracheingabe läuft…</span>
            ) : null}
          </div>

          {!isEdit ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Select
                label="Reisetag (optional)"
                name="tripDayId"
                defaultValue={initial?.tripDayId || defaultTripDayId || ""}
              >
                <option value="">Keinem Tag zugeordnet</option>
                {dayOptions.map((day) => (
                  <option key={day.id} value={day.id}>
                    {day.label}
                  </option>
                ))}
              </Select>
              <Select
                label="Ort (optional)"
                name="locationId"
                defaultValue={initial?.locationId || defaultLocationId || ""}
              >
                <option value="">Keinem Ort zugeordnet</option>
                {locationOptions.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.label}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <div className="mt-1 flex items-center justify-end gap-3">
            <Link href={cancelHref}>
              <Button type="button" variant="secondary" disabled={isPending}>
                Abbrechen
              </Button>
            </Link>
            <Button type="submit" disabled={isPending || content.trim() === ""}>
              {isPending ? "Speichern…" : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
