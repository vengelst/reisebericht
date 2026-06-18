import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getNote } from "../../actions";
import { NoteForm } from "../../note-form";
import { type NoteTypeValue, isNoteType } from "@/lib/notes";

type EditNotePageProps = {
  params: Promise<{ id: string; noteId: string }>;
};

export const metadata: Metadata = {
  title: "Notiz bearbeiten",
};

export default async function EditNotePage({ params }: EditNotePageProps) {
  const { id, noteId } = await params;
  const note = await getNote(id, noteId);

  if (!note) {
    notFound();
  }

  const type: NoteTypeValue = isNoteType(note.type) ? note.type : "QUICK";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/trips/${id}/notes/${note.id}`}
          className="text-sm text-[var(--color-muted)] transition-colors hover:text-foreground"
        >
          ← Zurück zur Notiz
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Notiz bearbeiten
        </h1>
      </div>

      <NoteForm
        tripId={id}
        noteId={note.id}
        dayOptions={[]}
        locationOptions={[]}
        submitLabel="Speichern"
        cancelHref={`/trips/${id}/notes/${note.id}`}
        initial={{
          type,
          content: note.content,
          tripDayId: note.tripDayId ?? "",
          locationId: note.locationId ?? "",
        }}
      />
    </div>
  );
}
