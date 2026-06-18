// Shared, framework-agnostic helpers for trip days (safe to import in client
// components — must not import Prisma or other server-only modules).

// Result shape returned by the trip-day server actions (mirrors TripActionResult).
export type TripDayActionResult = {
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
};

// Initial values for the (client) day form.
export type TripDayFormInitial = {
  date: string;
  title: string;
  startLocation: string;
  endLocation: string;
  distanceKm: string;
  drivingMinutes: string;
  dailyNote: string;
};

const numberFormat = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 1,
});

const weekdayLong = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const weekdayShort = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Coerces a Prisma Decimal / number / string into a plain number (or null). */
export function toNumberOrNull(
  value: number | string | { toString(): string } | null | undefined,
): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(n) ? n : null;
}

/** Formats a driving time, e.g. "2 Std. 30 Min." or "45 Min.". Empty when none. */
export function formatDrivingTime(
  minutes: number | null | undefined,
): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return "";
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours > 0 && mins > 0) return `${hours} Std. ${mins} Min.`;
  if (hours > 0) return `${hours} Std.`;
  return `${mins} Min.`;
}

/** Formats a distance, e.g. "234 km" or "12,5 km". Empty when none. */
export function formatDistance(
  km: number | string | { toString(): string } | null | undefined,
): string {
  const value = toNumberOrNull(km);
  if (value == null) return "";
  return `${numberFormat.format(value)} km`;
}

/** German long date, e.g. "Donnerstag, 12. Juni 2026". */
export function formatTripDayDate(
  value: Date | string | null | undefined,
): string {
  const date = toDate(value);
  return date ? weekdayLong.format(date) : "";
}

/** German short-weekday date, e.g. "Do., 12. Juni 2026". */
export function formatTripDayDateShort(
  value: Date | string | null | undefined,
): string {
  const date = toDate(value);
  return date ? weekdayShort.format(date) : "";
}

/** "YYYY-MM-DD" in UTC, used to compare a day's date against "today". */
export function toUtcDateKey(
  value: Date | string | null | undefined,
): string | null {
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 10) : null;
}
