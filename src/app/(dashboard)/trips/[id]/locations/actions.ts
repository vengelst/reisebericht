"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LocationCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { LOCATION_CATEGORIES, type LocationActionResult } from "@/lib/locations";

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

const coordinate = (min: number, max: number, label: string) =>
  z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => (value == null ? "" : String(value).trim().replace(",", ".")))
    .refine((value) => value !== "", { message: `${label} ist erforderlich.` })
    .transform((value) => Number(value))
    .refine((value) => Number.isFinite(value), {
      message: `${label} muss eine Zahl sein.`,
    })
    .refine((value) => value >= min && value <= max, {
      message: `${label} muss zwischen ${min} und ${max} liegen.`,
    });

const optionalText = (max: number, label: string) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      const text = value == null ? "" : String(value).trim();
      return text === "" ? null : text;
    })
    .refine((value) => value === null || value.length <= max, {
      message: `${label} ist zu lang (max. ${max} Zeichen).`,
    });

const optionalRating = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) return null;
    const text = String(value).trim();
    return text === "" ? null : Number(text);
  })
  .refine(
    (value) =>
      value === null ||
      (Number.isInteger(value) && value >= 1 && value <= 5),
    { message: "Bewertung muss zwischen 1 und 5 liegen." },
  );

const optionalDateTime = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    const text = value == null ? "" : String(value).trim();
    return text === "" ? null : new Date(text);
  })
  .refine((value) => value === null || !Number.isNaN(value.getTime()), {
    message: "Ungültiger Zeitpunkt.",
  });

const optionalTripDayId = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    const text = value == null ? "" : String(value).trim();
    return text === "" ? null : text;
  });

const locationInputSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich.").max(200, "Name ist zu lang (max. 200 Zeichen)."),
  category: z.enum(LOCATION_CATEGORIES),
  latitude: coordinate(-90, 90, "Breitengrad"),
  longitude: coordinate(-180, 180, "Längengrad"),
  tripDayId: optionalTripDayId,
  rating: optionalRating,
  description: optionalText(5000, "Beschreibung"),
  isHighlight: z
    .union([z.string(), z.boolean(), z.null(), z.undefined()])
    .transform((value) => value === true || value === "on" || value === "true"),
  arrivalAt: optionalDateTime,
  departureAt: optionalDateTime,
});

function parseLocationForm(formData: FormData) {
  return locationInputSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    tripDayId: formData.get("tripDayId"),
    rating: formData.get("rating"),
    description: formData.get("description"),
    isHighlight: formData.get("isHighlight"),
    arrivalAt: formData.get("arrivalAt"),
    departureAt: formData.get("departureAt"),
  });
}

function fieldErrorsFrom(error: z.ZodError): LocationActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return {
    error: error.issues[0]?.message ?? "Eingabe ist ungültig.",
    fieldErrors,
  };
}

// Ensures a referenced day belongs to the trip; returns its id or null.
async function resolveTripDayId(
  tripId: string,
  tripDayId: string | null,
): Promise<{ ok: true; value: string | null } | { ok: false }> {
  if (!tripDayId) return { ok: true, value: null };
  const day = await prisma.tripDay.findFirst({
    where: { id: tripDayId, tripId },
    select: { id: true },
  });
  return day ? { ok: true, value: day.id } : { ok: false };
}

function revalidateTrip(tripId: string): void {
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/trips");
  revalidatePath("/dashboard");
}

/** Lists a trip's locations, ordered by sortOrder. */
export async function getLocations(tripId: string) {
  const userId = await currentUserId();
  if (!userId || !(await ownsTrip(tripId, userId))) return [];
  return prisma.location.findMany({
    where: { tripId },
    orderBy: { sortOrder: "asc" },
  });
}

/** Lists the locations assigned to a specific day. */
export async function getLocationsByDay(tripId: string, dayId: string) {
  const userId = await currentUserId();
  if (!userId || !(await ownsTrip(tripId, userId))) return [];
  return prisma.location.findMany({
    where: { tripId, tripDayId: dayId },
    orderBy: { sortOrder: "asc" },
  });
}

/** Loads a single location, but only if its trip belongs to the current user. */
export async function getLocation(tripId: string, locationId: string) {
  const userId = await currentUserId();
  if (!userId || !(await ownsTrip(tripId, userId))) return null;
  return prisma.location.findFirst({ where: { id: locationId, tripId } });
}

export async function toggleLocationHighlight(
  tripId: string,
  locationId: string,
): Promise<LocationActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const location = await prisma.location.findFirst({
    where: { id: locationId, tripId },
    select: { id: true, isHighlight: true },
  });
  if (!location) return { error: "Ort nicht gefunden." };

  await prisma.location.update({
    where: { id: locationId },
    data: { isHighlight: !location.isHighlight },
  });

  revalidateTrip(tripId);
  revalidatePath(`/trips/${tripId}/locations/${locationId}`);
  return {};
}

export async function createLocation(
  tripId: string,
  formData: FormData,
): Promise<LocationActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const parsed = parseLocationForm(formData);
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const data = parsed.data;

  const day = await resolveTripDayId(tripId, data.tripDayId);
  if (!day.ok) {
    return {
      error: "Der gewählte Reisetag gehört nicht zu dieser Reise.",
      fieldErrors: { tripDayId: "Ungültiger Reisetag." },
    };
  }

  const aggregate = await prisma.location.aggregate({
    where: { tripId },
    _max: { sortOrder: true },
  });
  const nextSortOrder = (aggregate._max.sortOrder ?? 0) + 1;

  const location = await prisma.location.create({
    data: {
      tripId,
      tripDayId: day.value,
      name: data.name,
      category: data.category as LocationCategory,
      latitude: data.latitude,
      longitude: data.longitude,
      rating: data.rating,
      description: data.description,
      isHighlight: data.isHighlight,
      arrivalAt: data.arrivalAt,
      departureAt: data.departureAt,
      sortOrder: nextSortOrder,
    },
  });

  revalidateTrip(tripId);
  return { redirectTo: `/trips/${tripId}/locations/${location.id}` };
}

export async function updateLocation(
  tripId: string,
  locationId: string,
  formData: FormData,
): Promise<LocationActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const existing = await prisma.location.findFirst({
    where: { id: locationId, tripId },
    select: { id: true },
  });
  if (!existing) return { error: "Ort nicht gefunden." };

  const parsed = parseLocationForm(formData);
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const data = parsed.data;

  const day = await resolveTripDayId(tripId, data.tripDayId);
  if (!day.ok) {
    return {
      error: "Der gewählte Reisetag gehört nicht zu dieser Reise.",
      fieldErrors: { tripDayId: "Ungültiger Reisetag." },
    };
  }

  await prisma.location.update({
    where: { id: locationId },
    data: {
      tripDayId: day.value,
      name: data.name,
      category: data.category as LocationCategory,
      latitude: data.latitude,
      longitude: data.longitude,
      rating: data.rating,
      description: data.description,
      isHighlight: data.isHighlight,
      arrivalAt: data.arrivalAt,
      departureAt: data.departureAt,
    },
  });

  revalidateTrip(tripId);
  revalidatePath(`/trips/${tripId}/locations/${locationId}`);
  return { redirectTo: `/trips/${tripId}/locations/${locationId}` };
}

export async function deleteLocation(
  tripId: string,
  locationId: string,
): Promise<LocationActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const existing = await prisma.location.findFirst({
    where: { id: locationId, tripId },
    select: { id: true },
  });
  if (!existing) return { error: "Ort nicht gefunden." };

  await prisma.location.delete({ where: { id: locationId } });

  revalidateTrip(tripId);
  return { redirectTo: `/trips/${tripId}` };
}
