// Shared, framework-agnostic helpers for locations (safe to import in client
// components — must not import Prisma or other server-only modules).

export const LOCATION_CATEGORIES = [
  "CITY",
  "VILLAGE",
  "NATURE",
  "MONASTERY",
  "BEACH",
  "CAMPSITE",
  "PARKING",
  "ATTRACTION",
  "ACTIVITY",
  "OTHER",
] as const;

export type LocationCategoryValue = (typeof LOCATION_CATEGORIES)[number];

export const LOCATION_CATEGORY_LABELS: Record<LocationCategoryValue, string> = {
  CITY: "Stadt",
  VILLAGE: "Dorf",
  NATURE: "Natur",
  MONASTERY: "Kloster",
  BEACH: "Strand/Badeplatz",
  CAMPSITE: "Stellplatz",
  PARKING: "Parkplatz",
  ATTRACTION: "Sehenswürdigkeit",
  ACTIVITY: "Aktivität",
  OTHER: "Sonstiges",
};

export const LOCATION_CATEGORY_EMOJI: Record<LocationCategoryValue, string> = {
  CITY: "🏙️",
  VILLAGE: "🏘️",
  NATURE: "🌲",
  MONASTERY: "⛪",
  BEACH: "🏖️",
  CAMPSITE: "🚐",
  PARKING: "🅿️",
  ATTRACTION: "🏛️",
  ACTIVITY: "🥾",
  OTHER: "📍",
};

// Marker colors per category (used by the MapLibre markers).
export const LOCATION_CATEGORY_COLORS: Record<LocationCategoryValue, string> = {
  CITY: "#6366f1",
  VILLAGE: "#8b5cf6",
  NATURE: "#10b981",
  MONASTERY: "#a855f7",
  BEACH: "#06b6d4",
  CAMPSITE: "#f59e0b",
  PARKING: "#64748b",
  ATTRACTION: "#ec4899",
  ACTIVITY: "#22c55e",
  OTHER: "#94a3b8",
};

// Highlight markers get this color regardless of category, plus a larger scale.
export const LOCATION_HIGHLIGHT_COLOR = "#fbbf24";

export type LocationActionResult = {
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
};

export type LocationFormInitial = {
  name: string;
  category: LocationCategoryValue;
  latitude: string;
  longitude: string;
  tripDayId: string;
  rating: string;
  description: string;
  isHighlight: boolean;
};

export function isLocationCategory(value: unknown): value is LocationCategoryValue {
  return (
    typeof value === "string" &&
    (LOCATION_CATEGORIES as readonly string[]).includes(value)
  );
}

export function categoryLabel(value: string): string {
  return isLocationCategory(value)
    ? LOCATION_CATEGORY_LABELS[value]
    : LOCATION_CATEGORY_LABELS.OTHER;
}

export function categoryEmoji(value: string): string {
  return isLocationCategory(value)
    ? LOCATION_CATEGORY_EMOJI[value]
    : LOCATION_CATEGORY_EMOJI.OTHER;
}

export function categoryColor(value: string): string {
  return isLocationCategory(value)
    ? LOCATION_CATEGORY_COLORS[value]
    : LOCATION_CATEGORY_COLORS.OTHER;
}

/** Renders a 1–5 rating as filled/empty stars, e.g. "★★★☆☆". Empty when none. */
export function formatRatingStars(rating: number | null | undefined): string {
  if (rating == null || !Number.isFinite(rating)) return "";
  const value = Math.max(0, Math.min(5, Math.round(rating)));
  if (value === 0) return "";
  return "★".repeat(value) + "☆".repeat(5 - value);
}

/** Link that opens the coordinates in Google Maps. */
export function googleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

/** Formats coordinates for display, e.g. "55.6761, 12.5683". */
export function formatCoordinates(
  latitude: number,
  longitude: number,
): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}
