"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { TripDayActionResult } from "@/lib/trip-days";

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** Returns true when the trip exists, is not deleted and belongs to the user. */
async function ownsTrip(tripId: string, userId: string): Promise<boolean> {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId, deletedAt: null },
    select: { id: true },
  });
  return trip !== null;
}

const dateField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (value == null ? "" : String(value).trim()))
  .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Datum ist erforderlich.",
  })
  .transform((value) => new Date(`${value}T00:00:00.000Z`))
  .refine((date) => !Number.isNaN(date.getTime()), {
    message: "Ungültiges Datum.",
  });

function optionalText(max: number, label: string) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      const text = value == null ? "" : String(value).trim();
      return text === "" ? null : text;
    })
    .refine((value) => value === null || value.length <= max, {
      message: `${label} ist zu lang (max. ${max} Zeichen).`,
    });
}

const nonNegativeNumber = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) return null;
    const text = String(value).trim().replace(",", ".");
    return text === "" ? null : Number(text);
  })
  .refine((value) => value === null || (Number.isFinite(value) && value >= 0), {
    message: "Bitte eine Zahl ≥ 0 angeben.",
  });

const nonNegativeInteger = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) return null;
    const text = String(value).trim();
    return text === "" ? null : Number(text);
  })
  .refine(
    (value) =>
      value === null ||
      (Number.isFinite(value) && Number.isInteger(value) && value >= 0),
    { message: "Bitte eine ganze Zahl ≥ 0 angeben." },
  );

const tripDayInputSchema = z.object({
  date: dateField,
  title: optionalText(200, "Titel"),
  startLocation: optionalText(200, "Startort"),
  endLocation: optionalText(200, "Zielort"),
  distanceKm: nonNegativeNumber,
  drivingMinutes: nonNegativeInteger,
  dailyNote: optionalText(5000, "Tagesnotiz"),
});

function parseTripDayForm(formData: FormData) {
  return tripDayInputSchema.safeParse({
    date: formData.get("date"),
    title: formData.get("title"),
    startLocation: formData.get("startLocation"),
    endLocation: formData.get("endLocation"),
    distanceKm: formData.get("distanceKm"),
    drivingMinutes: formData.get("drivingMinutes"),
    dailyNote: formData.get("dailyNote"),
  });
}

function fieldErrorsFrom(error: z.ZodError): TripDayActionResult {
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

// Renumbers all days of a trip chronologically so "Tag N" matches the timeline
// order. Runs inside the given transaction client.
async function renumberDays(
  tx: Prisma.TransactionClient,
  tripId: string,
): Promise<void> {
  const days = await tx.tripDay.findMany({
    where: { tripId },
    orderBy: { date: "asc" },
    select: { id: true },
  });
  for (let i = 0; i < days.length; i += 1) {
    await tx.tripDay.update({
      where: { id: days[i].id },
      data: { dayNumber: i + 1, sortOrder: i + 1 },
    });
  }
}

function revalidateTrip(tripId: string): void {
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/trips");
  revalidatePath("/dashboard");
}

/** Lists a trip's days, chronologically ascending. */
export async function getTripDays(tripId: string) {
  const userId = await currentUserId();
  if (!userId || !(await ownsTrip(tripId, userId))) return [];
  return prisma.tripDay.findMany({
    where: { tripId },
    orderBy: { date: "asc" },
  });
}

/** Loads a single day, but only if its trip belongs to the current user. */
export async function getTripDay(tripId: string, dayId: string) {
  const userId = await currentUserId();
  if (!userId || !(await ownsTrip(tripId, userId))) return null;
  return prisma.tripDay.findFirst({ where: { id: dayId, tripId } });
}

export async function createTripDay(
  tripId: string,
  formData: FormData,
): Promise<TripDayActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const parsed = parseTripDayForm(formData);
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.tripDay.create({
        data: {
          tripId,
          date: data.date,
          title: data.title,
          startLocation: data.startLocation,
          endLocation: data.endLocation,
          distanceKm: data.distanceKm,
          drivingMinutes: data.drivingMinutes,
          dailyNote: data.dailyNote,
          dayNumber: 0,
          sortOrder: 0,
        },
      });
      await renumberDays(tx, tripId);
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error: "An diesem Datum existiert bereits ein Reisetag.",
        fieldErrors: { date: "An diesem Datum existiert bereits ein Reisetag." },
      };
    }
    throw error;
  }

  revalidateTrip(tripId);
  return { redirectTo: `/trips/${tripId}` };
}

export async function updateTripDay(
  tripId: string,
  dayId: string,
  formData: FormData,
): Promise<TripDayActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const existing = await prisma.tripDay.findFirst({
    where: { id: dayId, tripId },
    select: { id: true },
  });
  if (!existing) return { error: "Reisetag nicht gefunden." };

  const parsed = parseTripDayForm(formData);
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.tripDay.update({
        where: { id: dayId },
        data: {
          date: data.date,
          title: data.title,
          startLocation: data.startLocation,
          endLocation: data.endLocation,
          distanceKm: data.distanceKm,
          drivingMinutes: data.drivingMinutes,
          dailyNote: data.dailyNote,
        },
      });
      await renumberDays(tx, tripId);
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error: "An diesem Datum existiert bereits ein Reisetag.",
        fieldErrors: { date: "An diesem Datum existiert bereits ein Reisetag." },
      };
    }
    throw error;
  }

  revalidateTrip(tripId);
  revalidatePath(`/trips/${tripId}/days/${dayId}`);
  return { redirectTo: `/trips/${tripId}/days/${dayId}` };
}

export async function deleteTripDay(
  tripId: string,
  dayId: string,
): Promise<TripDayActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const existing = await prisma.tripDay.findFirst({
    where: { id: dayId, tripId },
    select: { id: true },
  });
  if (!existing) return { error: "Reisetag nicht gefunden." };

  await prisma.$transaction(async (tx) => {
    await tx.tripDay.delete({ where: { id: dayId } });
    await renumberDays(tx, tripId);
  });

  revalidateTrip(tripId);
  return { redirectTo: `/trips/${tripId}` };
}
