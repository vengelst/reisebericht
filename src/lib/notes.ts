// Shared, framework-agnostic helpers for notes (safe to import in client
// components — must not import Prisma or other server-only modules).

export const NOTE_TYPES = ["QUICK", "DICTATION", "REPORT"] as const;

export type NoteTypeValue = (typeof NOTE_TYPES)[number];

export type NoteActionResult = {
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
};

export const NOTE_TYPE_LABELS: Record<NoteTypeValue, string> = {
  QUICK: "Schnellnotiz",
  DICTATION: "Diktat",
  REPORT: "Bericht",
};

export const NOTE_TYPE_EMOJI: Record<NoteTypeValue, string> = {
  QUICK: "📝",
  DICTATION: "🎙️",
  REPORT: "📄",
};

export function isNoteType(value: unknown): value is NoteTypeValue {
  return (
    typeof value === "string" &&
    (NOTE_TYPES as readonly string[]).includes(value)
  );
}

export function noteTypeLabel(type: string): string {
  return isNoteType(type) ? NOTE_TYPE_LABELS[type] : NOTE_TYPE_LABELS.QUICK;
}

export function noteTypeEmoji(type: string): string {
  return isNoteType(type) ? NOTE_TYPE_EMOJI[type] : NOTE_TYPE_EMOJI.QUICK;
}

/** First `maxLength` characters of a note, with newlines collapsed to spaces. */
export function formatNotePreview(content: string, maxLength = 150): string {
  const collapsed = content.replace(/\s+/g, " ").trim();
  if (collapsed.length <= maxLength) return collapsed;
  return `${collapsed.slice(0, maxLength).trimEnd()}…`;
}
