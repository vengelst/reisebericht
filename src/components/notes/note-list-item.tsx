import Link from "next/link";
import type { Note } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatNotePreview,
  noteTypeEmoji,
  noteTypeLabel,
} from "@/lib/notes";

const dateFormat = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function NoteListItem({
  tripId,
  note,
  assignment,
}: {
  tripId: string;
  note: Note;
  assignment?: string | null;
}) {
  return (
    <Link href={`/trips/${tripId}/notes/${note.id}`} className="block">
      <Card className="transition-colors hover:border-[var(--color-accent)]/60">
        <CardContent className="flex flex-col gap-2 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="muted">
              {noteTypeEmoji(note.type)} {noteTypeLabel(note.type)}
            </Badge>
            {note.isHighlight ? (
              <span className="text-[var(--color-accent)]" title="Highlight">
                ★
              </span>
            ) : null}
            {assignment ? (
              <span className="text-xs text-[var(--color-muted)]">
                {assignment}
              </span>
            ) : null}
            <span className="ml-auto text-xs text-[var(--color-muted)]">
              {dateFormat.format(note.createdAt)}
            </span>
          </div>
          <p className="text-sm text-foreground">
            {formatNotePreview(note.content)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
