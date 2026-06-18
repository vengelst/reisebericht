"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createNote } from "@/app/(dashboard)/trips/[id]/notes/actions";
import { Button } from "@/components/ui/button";
import { MicButton } from "@/components/notes/mic-button";
import { useDictation } from "@/components/notes/use-dictation";
import type { NoteTypeValue } from "@/lib/notes";

type QuickNoteProps = {
  tripId: string;
  tripDayId?: string;
  locationId?: string;
};

export function QuickNote({ tripId, tripDayId, locationId }: QuickNoteProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState("");
  const [type, setType] = useState<NoteTypeValue>("QUICK");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dictation = useDictation((text) => {
    setContent((prev) => (prev ? `${prev} ${text}` : text));
    setType("DICTATION");
  });

  function save() {
    if (content.trim() === "") return;
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("type", type);
      formData.set("content", content);
      if (tripDayId) formData.set("tripDayId", tripDayId);
      if (locationId) formData.set("locationId", locationId);
      const result = await createNote(tripId, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setContent("");
      setType("QUICK");
      router.refresh();
    });
  }

  const showSave = content.trim() !== "";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex items-start gap-2">
        <textarea
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            if (type === "DICTATION" && event.target.value === "") {
              setType("QUICK");
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={focused || showSave ? 4 : 2}
          placeholder="Schnelle Notiz festhalten oder Spracheingabe verwenden…"
          className="w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-foreground placeholder:text-[var(--color-muted)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
        <MicButton
          supported={dictation.supported}
          listening={dictation.listening}
          onToggle={dictation.toggle}
        />
      </div>

      {error ? (
        <span className="text-xs text-red-300">{error}</span>
      ) : null}

      {showSave ? (
        <div className="flex items-center justify-end gap-2">
          {dictation.listening ? (
            <span className="mr-auto text-xs text-red-300">
              Spracheingabe läuft…
            </span>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setContent("")}
            disabled={isPending}
          >
            Verwerfen
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={isPending}>
            {isPending ? "Speichern…" : "Speichern"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
