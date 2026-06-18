"use server";

import { randomUUID, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Prisma, MediaType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ensureBucket } from "@/lib/storage";
import { processImage, deleteMediaFiles } from "@/lib/image-processing";
import {
  MEDIA_ACCEPTED_MIME,
  MEDIA_MAX_BYTES,
  type MediaActionResult,
} from "@/lib/media";

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function ownsTrip(tripId: string, userId: string): Promise<boolean> {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId, deletedAt: null },
    select: { id: true },
  });
  return trip !== null;
}

async function dayBelongsToTrip(tripId: string, dayId: string): Promise<boolean> {
  const day = await prisma.tripDay.findFirst({
    where: { id: dayId, tripId },
    select: { id: true },
  });
  return day !== null;
}

async function locationBelongsToTrip(
  tripId: string,
  locationId: string,
): Promise<boolean> {
  const location = await prisma.location.findFirst({
    where: { id: locationId, tripId },
    select: { id: true },
  });
  return location !== null;
}

function extFromPath(path: string): string {
  const dot = path.lastIndexOf(".");
  return dot >= 0 ? path.slice(dot + 1) : "jpg";
}

function revalidateTrip(tripId: string): void {
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/media`);
  revalidatePath("/trips");
  revalidatePath("/dashboard");
}

/** Lists a trip's media, ordered by capture time (falling back to upload time). */
export async function getMedia(tripId: string) {
  const userId = await currentUserId();
  if (!userId || !(await ownsTrip(tripId, userId))) return [];
  return prisma.media.findMany({
    where: { tripId },
    orderBy: [{ takenAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
  });
}

export async function getMediaByDay(tripId: string, dayId: string) {
  const userId = await currentUserId();
  if (!userId || !(await ownsTrip(tripId, userId))) return [];
  return prisma.media.findMany({
    where: { tripId, tripDayId: dayId },
    orderBy: [{ takenAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
  });
}

export async function getMediaByLocation(tripId: string, locationId: string) {
  const userId = await currentUserId();
  if (!userId || !(await ownsTrip(tripId, userId))) return [];
  return prisma.media.findMany({
    where: { tripId, locationId },
    orderBy: [{ takenAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
  });
}

/** Resolves cover image ids to their preview keys (for the trips overview). */
export async function getCoverThumbs(
  coverImageIds: string[],
): Promise<Record<string, string>> {
  const userId = await currentUserId();
  const ids = coverImageIds.filter(Boolean);
  if (!userId || ids.length === 0) return {};
  const rows = await prisma.media.findMany({
    where: { id: { in: ids }, trip: { userId, deletedAt: null } },
    select: { id: true, thumbnailMd: true, originalPath: true },
  });
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.id] = row.thumbnailMd ?? row.originalPath;
  }
  return map;
}

export async function getMediaItem(tripId: string, mediaId: string) {
  const userId = await currentUserId();
  if (!userId || !(await ownsTrip(tripId, userId))) return null;
  return prisma.media.findFirst({ where: { id: mediaId, tripId } });
}

export async function uploadMedia(
  tripId: string,
  formData: FormData,
): Promise<MediaActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const rawDayId = (formData.get("tripDayId") as string | null)?.trim() || null;
  const rawLocationId =
    (formData.get("locationId") as string | null)?.trim() || null;

  if (rawDayId && !(await dayBelongsToTrip(tripId, rawDayId)))
    return { error: "Der gewählte Reisetag gehört nicht zu dieser Reise." };
  if (rawLocationId && !(await locationBelongsToTrip(tripId, rawLocationId)))
    return { error: "Der gewählte Ort gehört nicht zu dieser Reise." };

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) return { error: "Keine Datei ausgewählt." };

  await ensureBucket();

  const assigned = Boolean(rawDayId || rawLocationId);
  let uploaded = 0;

  const aggregate = await prisma.media.aggregate({
    where: { tripId },
    _max: { sortOrder: true },
  });
  let nextSortOrder = (aggregate._max.sortOrder ?? 0) + 1;

  for (const file of files) {
    if (file.size > MEDIA_MAX_BYTES) {
      return {
        error: `„${file.name}“ ist größer als 20 MB.`,
        uploaded,
      };
    }
    if (file.type && !MEDIA_ACCEPTED_MIME.includes(file.type)) {
      return {
        error: `„${file.name}“ hat ein nicht unterstütztes Format.`,
        uploaded,
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Skip duplicates within this trip (same SHA-256).
    const hash = createHash("sha256").update(buffer).digest("hex");
    const duplicate = await prisma.media.findFirst({
      where: { tripId, fileHash: hash },
      select: { id: true },
    });
    if (duplicate) continue;

    const mediaId = randomUUID();
    const processed = await processImage(buffer, mediaId, tripId);

    await prisma.media.create({
      data: {
        id: mediaId,
        tripId,
        tripDayId: rawDayId,
        locationId: rawLocationId,
        type: MediaType.PHOTO,
        originalPath: processed.originalPath,
        thumbnailSm: processed.thumbnailSm,
        thumbnailMd: processed.thumbnailMd,
        thumbnailLg: processed.thumbnailLg,
        takenAt: processed.takenAt,
        latitude: processed.latitude,
        longitude: processed.longitude,
        exifData:
          processed.exifData === null
            ? Prisma.DbNull
            : (processed.exifData as Prisma.InputJsonValue),
        fileHash: processed.fileHash,
        fileSizeBytes: BigInt(processed.fileSizeBytes),
        width: processed.width,
        height: processed.height,
        assigned,
        sortOrder: nextSortOrder,
      },
    });
    nextSortOrder += 1;
    uploaded += 1;
  }

  revalidateTrip(tripId);
  return { uploaded };
}

export async function updateMedia(
  tripId: string,
  mediaId: string,
  formData: FormData,
): Promise<MediaActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const existing = await prisma.media.findFirst({
    where: { id: mediaId, tripId },
    select: { id: true },
  });
  if (!existing) return { error: "Bild nicht gefunden." };

  const caption = (formData.get("caption") as string | null)?.trim() || null;
  const tripDayId = (formData.get("tripDayId") as string | null)?.trim() || null;
  const locationId =
    (formData.get("locationId") as string | null)?.trim() || null;
  const isHighlight = formData.get("isHighlight") === "on";
  const isCover = formData.get("isCover") === "on";

  if (tripDayId && !(await dayBelongsToTrip(tripId, tripDayId)))
    return {
      error: "Der gewählte Reisetag gehört nicht zu dieser Reise.",
      fieldErrors: { tripDayId: "Ungültiger Reisetag." },
    };
  if (locationId && !(await locationBelongsToTrip(tripId, locationId)))
    return {
      error: "Der gewählte Ort gehört nicht zu dieser Reise.",
      fieldErrors: { locationId: "Ungültiger Ort." },
    };

  await prisma.$transaction(async (tx) => {
    await tx.media.update({
      where: { id: mediaId },
      data: {
        caption,
        tripDayId,
        locationId,
        isHighlight,
        isCover,
        assigned: Boolean(tripDayId || locationId),
      },
    });
    if (isCover) {
      await tx.media.updateMany({
        where: { tripId, id: { not: mediaId }, isCover: true },
        data: { isCover: false },
      });
      await tx.trip.update({
        where: { id: tripId },
        data: { coverImageId: mediaId },
      });
    } else {
      // If this image was the cover and is no longer, detach it.
      await tx.trip.updateMany({
        where: { id: tripId, coverImageId: mediaId },
        data: { coverImageId: null },
      });
    }
  });

  revalidateTrip(tripId);
  revalidatePath(`/trips/${tripId}/media/${mediaId}`);
  return { redirectTo: `/trips/${tripId}/media/${mediaId}` };
}

export async function assignMedia(
  tripId: string,
  mediaId: string,
  formData: FormData,
): Promise<MediaActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const existing = await prisma.media.findFirst({
    where: { id: mediaId, tripId },
    select: { id: true },
  });
  if (!existing) return { error: "Bild nicht gefunden." };

  const tripDayId = (formData.get("tripDayId") as string | null)?.trim() || null;
  const locationId =
    (formData.get("locationId") as string | null)?.trim() || null;

  if (tripDayId && !(await dayBelongsToTrip(tripId, tripDayId)))
    return { error: "Der gewählte Reisetag gehört nicht zu dieser Reise." };
  if (locationId && !(await locationBelongsToTrip(tripId, locationId)))
    return { error: "Der gewählte Ort gehört nicht zu dieser Reise." };

  await prisma.media.update({
    where: { id: mediaId },
    data: {
      tripDayId,
      locationId,
      assigned: Boolean(tripDayId || locationId),
    },
  });

  revalidateTrip(tripId);
  return {};
}

export async function setTripCover(
  tripId: string,
  mediaId: string,
): Promise<MediaActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const existing = await prisma.media.findFirst({
    where: { id: mediaId, tripId },
    select: { id: true },
  });
  if (!existing) return { error: "Bild nicht gefunden." };

  await prisma.$transaction([
    prisma.media.updateMany({
      where: { tripId, isCover: true },
      data: { isCover: false },
    }),
    prisma.media.update({ where: { id: mediaId }, data: { isCover: true } }),
    prisma.trip.update({
      where: { id: tripId },
      data: { coverImageId: mediaId },
    }),
  ]);

  revalidateTrip(tripId);
  return {};
}

export async function deleteMedia(
  tripId: string,
  mediaId: string,
): Promise<MediaActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const media = await prisma.media.findFirst({
    where: { id: mediaId, tripId },
    select: { id: true, originalPath: true, isCover: true },
  });
  if (!media) return { error: "Bild nicht gefunden." };

  await prisma.$transaction(async (tx) => {
    await tx.trip.updateMany({
      where: { id: tripId, coverImageId: mediaId },
      data: { coverImageId: null },
    });
    await tx.media.delete({ where: { id: mediaId } });
  });

  await deleteMediaFiles(tripId, mediaId, extFromPath(media.originalPath));

  revalidateTrip(tripId);
  return { redirectTo: `/trips/${tripId}/media` };
}
