// Shared, framework-agnostic helpers for media (safe to import in client
// components — must not import Prisma, sharp, or other server-only modules).

export type MediaActionResult = {
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
  uploaded?: number;
};

// Upload constraints (also enforced server-side).
export const MEDIA_MAX_BYTES = 20 * 1024 * 1024; // 20 MB
export const MEDIA_ACCEPTED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
export const MEDIA_ACCEPT_ATTR =
  ".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif";

export type MediaFilter = "all" | "day" | "location" | "inbox";
export type MediaSort = "takenAt" | "createdAt";

// Serialisable image shape passed to the (client) gallery/lightbox.
export type GalleryImage = {
  id: string;
  smUrl: string;
  mdUrl: string;
  lgUrl: string;
  originalUrl: string;
  caption: string | null;
  isHighlight: boolean;
  isCover: boolean;
  width: number | null;
  height: number | null;
};

/** Builds the app-internal URL that serves a stored object via the API route. */
export function mediaUrl(key: string): string {
  return `/api/media/${key}`;
}

// Minimal shape needed to build a GalleryImage (matches the Prisma Media row).
type MediaLike = {
  id: string;
  originalPath: string;
  thumbnailSm: string | null;
  thumbnailMd: string | null;
  thumbnailLg: string | null;
  caption: string | null;
  isHighlight: boolean;
  isCover: boolean;
  width: number | null;
  height: number | null;
};

/** Maps media rows to serialisable gallery images (URLs via the API route). */
export function toGalleryImages(media: MediaLike[]): GalleryImage[] {
  return media.map((item) => ({
    id: item.id,
    smUrl: mediaUrl(item.thumbnailSm ?? item.originalPath),
    mdUrl: mediaUrl(item.thumbnailMd ?? item.originalPath),
    lgUrl: mediaUrl(item.thumbnailLg ?? item.originalPath),
    originalUrl: mediaUrl(item.originalPath),
    caption: item.caption,
    isHighlight: item.isHighlight,
    isCover: item.isCover,
    width: item.width,
    height: item.height,
  }));
}

const sizeFormatter = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 1,
});

/** Formats a byte count, e.g. "2,4 MB" or "812 KB". */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${sizeFormatter.format(kb)} KB`;
  const mb = kb / 1024;
  return `${sizeFormatter.format(mb)} MB`;
}

/** Formats image dimensions, e.g. "4032 × 3024". */
export function formatDimensions(
  width: number | null | undefined,
  height: number | null | undefined,
): string {
  if (!width || !height) return "";
  return `${width} × ${height}`;
}

const dateTimeFormat = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

/** Formats a capture time, e.g. "12. Juni 2026, 14:30". */
export function formatTakenAt(
  value: Date | string | null | undefined,
): string {
  if (value == null) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateTimeFormat.format(date);
}

/** Great-circle distance between two coordinates in kilometres. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
