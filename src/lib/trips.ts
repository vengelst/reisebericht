// Shared, framework-agnostic helpers for trips (safe to import in client
// components — must not import Prisma or other server-only modules).

// Result shape returned by the trip server actions. Lives here (not in the
// "use server" module) because such files may only export async functions.
export type TripActionResult = {
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
};

export const TRIP_STATUSES = [
  "PLANNING",
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
] as const;

export type TripStatusValue = (typeof TRIP_STATUSES)[number];

export const TRIP_VISIBILITIES = ["PRIVATE", "UNLISTED", "PUBLIC"] as const;

export type TripVisibilityValue = (typeof TRIP_VISIBILITIES)[number];

export const TRIP_STATUS_LABELS: Record<TripStatusValue, string> = {
  PLANNING: "Planung",
  ACTIVE: "Aktiv",
  COMPLETED: "Abgeschlossen",
  ARCHIVED: "Archiviert",
};

export const TRIP_VISIBILITY_LABELS: Record<TripVisibilityValue, string> = {
  PRIVATE: "Privat",
  UNLISTED: "Nicht gelistet",
  PUBLIC: "Öffentlich",
};

// Tone used by the status badge — keys match the Badge component variants.
export const TRIP_STATUS_TONES: Record<
  TripStatusValue,
  "neutral" | "info" | "success" | "muted"
> = {
  PLANNING: "info",
  ACTIVE: "success",
  COMPLETED: "neutral",
  ARCHIVED: "muted",
};

// Status options offered in the create/edit form (Archiviert is reached via the
// status actions on the detail page, not the form — per the spec).
export const TRIP_STATUS_FORM_OPTIONS: TripStatusValue[] = [
  "PLANNING",
  "ACTIVE",
  "COMPLETED",
];

export const TRIP_VISIBILITY_FORM_OPTIONS: TripVisibilityValue[] = [
  "PRIVATE",
  "UNLISTED",
  "PUBLIC",
];

// Dates are stored at UTC midnight, so format them in UTC to avoid the day
// shifting depending on the server's timezone.
const dayMonth = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const dayMonthYear = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a trip's date range in German, e.g. "12. Juni – 28. Juni 2026".
 * Handles open-ended and missing ranges gracefully.
 */
export function formatTripDateRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
): string {
  const startDate = toDate(start);
  const endDate = toDate(end);

  if (!startDate && !endDate) return "Kein Zeitraum";
  if (startDate && !endDate) return `ab ${dayMonthYear.format(startDate)}`;
  if (!startDate && endDate) return `bis ${dayMonthYear.format(endDate)}`;

  // Both present.
  const sameYear =
    startDate!.getUTCFullYear() === endDate!.getUTCFullYear();
  const startLabel = sameYear
    ? dayMonth.format(startDate!)
    : dayMonthYear.format(startDate!);
  return `${startLabel} – ${dayMonthYear.format(endDate!)}`;
}

/** Converts a stored Date to the "YYYY-MM-DD" value a <input type="date"> wants. */
export function toDateInputValue(
  value: Date | string | null | undefined,
): string {
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 10) : "";
}
