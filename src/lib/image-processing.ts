import { createHash } from "node:crypto";
import sharp from "sharp";
import exifReader from "exif-reader";
import { uploadFile, deleteFile } from "@/lib/storage";

export type ProcessedImage = {
  originalPath: string;
  originalExt: string;
  thumbnailSm: string;
  thumbnailMd: string;
  thumbnailLg: string;
  width: number | null;
  height: number | null;
  fileHash: string;
  fileSizeBytes: number;
  takenAt: Date | null;
  latitude: number | null;
  longitude: number | null;
  camera: string | null;
  exifData: Record<string, unknown> | null;
};

const FORMAT_EXT: Record<string, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  heif: "heic",
  gif: "gif",
  tiff: "tiff",
  avif: "avif",
};

const FORMAT_CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  gif: "image/gif",
  tiff: "image/tiff",
  avif: "image/avif",
};

export function mediaStorageKeys(
  tripId: string,
  mediaId: string,
  ext: string,
) {
  const base = `trips/${tripId}`;
  return {
    original: `${base}/originals/${mediaId}.${ext}`,
    sm: `${base}/thumbnails/${mediaId}-sm.webp`,
    md: `${base}/thumbnails/${mediaId}-md.webp`,
    lg: `${base}/thumbnails/${mediaId}-lg.webp`,
  };
}

// Converts an EXIF GPS DMS array + hemisphere ref into a signed decimal degree.
function dmsToDecimal(
  dms: number[] | undefined,
  ref: string | undefined,
): number | null {
  if (!dms || dms.length < 3) return null;
  const [deg, min, sec] = dms;
  if (![deg, min, sec].every((n) => Number.isFinite(n))) return null;
  let value = deg + min / 60 + sec / 3600;
  if (ref === "S" || ref === "W") value = -value;
  return Number.isFinite(value) ? value : null;
}

type ExtractedExif = {
  takenAt: Date | null;
  latitude: number | null;
  longitude: number | null;
  camera: string | null;
  exifData: Record<string, unknown> | null;
};

function extractExif(exifBuffer: Buffer | undefined): ExtractedExif {
  const empty: ExtractedExif = {
    takenAt: null,
    latitude: null,
    longitude: null,
    camera: null,
    exifData: null,
  };
  if (!exifBuffer) return empty;

  try {
    const tags = exifReader(exifBuffer);
    const taken = tags.Photo?.DateTimeOriginal ?? tags.Image?.DateTime;
    const takenAt =
      taken instanceof Date && !Number.isNaN(taken.getTime()) ? taken : null;

    const make = (tags.Image?.Make ?? "").toString().trim();
    const model = (tags.Image?.Model ?? "").toString().trim();
    const camera = `${make} ${model}`.trim() || null;

    const latitude = dmsToDecimal(
      tags.GPSInfo?.GPSLatitude,
      tags.GPSInfo?.GPSLatitudeRef,
    );
    const longitude = dmsToDecimal(
      tags.GPSInfo?.GPSLongitude,
      tags.GPSInfo?.GPSLongitudeRef,
    );

    // Store a compact, JSON-safe subset (the raw EXIF may contain Buffers).
    const exifData: Record<string, unknown> = {};
    if (camera) exifData.camera = camera;
    if (make) exifData.make = make;
    if (model) exifData.model = model;
    if (takenAt) exifData.takenAt = takenAt.toISOString();
    if (latitude != null && longitude != null) {
      exifData.gps = { latitude, longitude };
    }
    if (typeof tags.Photo?.FNumber === "number")
      exifData.fNumber = tags.Photo.FNumber;
    if (typeof tags.Photo?.ExposureTime === "number")
      exifData.exposureTime = tags.Photo.ExposureTime;
    if (typeof tags.Photo?.ISOSpeedRatings === "number")
      exifData.iso = tags.Photo.ISOSpeedRatings;
    if (typeof tags.Photo?.FocalLength === "number")
      exifData.focalLength = tags.Photo.FocalLength;

    return {
      takenAt,
      latitude,
      longitude,
      camera,
      exifData: Object.keys(exifData).length > 0 ? exifData : null,
    };
  } catch {
    return empty;
  }
}

/**
 * Processes an uploaded image: reads EXIF, stores the original, generates three
 * WebP thumbnails, and uploads everything to MinIO. Returns paths + metadata.
 */
export async function processImage(
  buffer: Buffer,
  mediaId: string,
  tripId: string,
): Promise<ProcessedImage> {
  const metadata = await sharp(buffer).metadata();
  const format = metadata.format ?? "jpeg";
  const ext = FORMAT_EXT[format] ?? "jpg";
  const contentType = FORMAT_CONTENT_TYPE[ext] ?? "application/octet-stream";
  const keys = mediaStorageKeys(tripId, mediaId, ext);

  // Original dimensions, accounting for EXIF orientation.
  const orientation = metadata.orientation ?? 1;
  const swap = orientation >= 5 && orientation <= 8;
  const width = swap ? metadata.height ?? null : metadata.width ?? null;
  const height = swap ? metadata.width ?? null : metadata.height ?? null;

  const exif = extractExif(metadata.exif as Buffer | undefined);
  const fileHash = createHash("sha256").update(buffer).digest("hex");

  // Auto-orient then build each thumbnail from a fresh pipeline.
  const [sm, md, lg] = await Promise.all([
    sharp(buffer)
      .rotate()
      .resize(150, 150, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer(),
    sharp(buffer)
      .rotate()
      .resize(600, 400, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer(),
    sharp(buffer)
      .rotate()
      .resize(1200, 800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer(),
  ]);

  await Promise.all([
    uploadFile(keys.original, buffer, contentType),
    uploadFile(keys.sm, sm, "image/webp"),
    uploadFile(keys.md, md, "image/webp"),
    uploadFile(keys.lg, lg, "image/webp"),
  ]);

  return {
    originalPath: keys.original,
    originalExt: ext,
    thumbnailSm: keys.sm,
    thumbnailMd: keys.md,
    thumbnailLg: keys.lg,
    width,
    height,
    fileHash,
    fileSizeBytes: buffer.length,
    takenAt: exif.takenAt,
    latitude: exif.latitude,
    longitude: exif.longitude,
    camera: exif.camera,
    exifData: exif.exifData,
  };
}

/** Removes a media item's original and all thumbnails from MinIO. */
export async function deleteMediaFiles(
  tripId: string,
  mediaId: string,
  originalExt: string,
): Promise<void> {
  const keys = mediaStorageKeys(tripId, mediaId, originalExt);
  await Promise.allSettled([
    deleteFile(keys.original),
    deleteFile(keys.sm),
    deleteFile(keys.md),
    deleteFile(keys.lg),
  ]);
}
