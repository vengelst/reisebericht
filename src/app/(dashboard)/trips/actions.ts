"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, TripStatus, TripVisibility } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  TRIP_STATUSES,
  TRIP_VISIBILITIES,
  type TripActionResult,
} from "@/lib/trips";

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

// Parses a "YYYY-MM-DD" form value into a UTC-midnight Date, or null when empty.
const dateField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (value == null ? "" : String(value).trim()))
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Ungültiges Datum.",
  })
  .transform((value) => (value === "" ? null : new Date(`${value}T00:00:00.000Z`)))
  .refine((date) => date === null || !Number.isNaN(date.getTime()), {
    message: "Ungültiges Datum.",
  });

const tripInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Titel ist erforderlich.")
      .max(200, "Titel ist zu lang (max. 200 Zeichen)."),
    description: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) => {
        const text = value == null ? "" : String(value).trim();
        return text === "" ? null : text;
      })
      .refine((value) => value === null || value.length <= 5000, {
        message: "Beschreibung ist zu lang (max. 5000 Zeichen).",
      }),
    startDate: dateField,
    endDate: dateField,
    status: z.enum(TRIP_STATUSES),
    visibility: z.enum(TRIP_VISIBILITIES),
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      data.endDate.getTime() >= data.startDate.getTime(),
    {
      message: "Das Enddatum darf nicht vor dem Startdatum liegen.",
      path: ["endDate"],
    },
  );

function parseTripForm(formData: FormData) {
  return tripInputSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
    visibility: formData.get("visibility"),
  });
}

function fieldErrorsFrom(error: z.ZodError): TripActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  const first = error.issues[0]?.message ?? "Eingabe ist ungültig.";
  return { error: first, fieldErrors };
}

/** Lists the current user's non-deleted trips, newest activity first. */
export async function getTrips() {
  const userId = await currentUserId();
  if (!userId) return [];
  return prisma.trip.findMany({
    where: { userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });
}

/** Loads a single trip, but only if it belongs to the current user. */
export async function getTrip(id: string) {
  const userId = await currentUserId();
  if (!userId) return null;
  return prisma.trip.findFirst({
    where: { id, userId, deletedAt: null },
  });
}

export async function createTrip(
  formData: FormData,
): Promise<TripActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };

  const parsed = parseTripForm(formData);
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  const data = parsed.data;
  const trip = await prisma.trip.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status as TripStatus,
      visibility: data.visibility as TripVisibility,
    },
  });

  revalidatePath("/trips");
  revalidatePath("/dashboard");
  return { redirectTo: `/trips/${trip.id}` };
}

export async function updateTrip(
  id: string,
  formData: FormData,
): Promise<TripActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };

  const existing = await prisma.trip.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) return { error: "Reise nicht gefunden." };

  const parsed = parseTripForm(formData);
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  const data = parsed.data;
  await prisma.trip.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status as TripStatus,
      visibility: data.visibility as TripVisibility,
    },
  });

  revalidatePath("/trips");
  revalidatePath(`/trips/${id}`);
  revalidatePath("/dashboard");
  return { redirectTo: `/trips/${id}` };
}

export async function setTripStatus(
  id: string,
  status: string,
): Promise<TripActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };

  const parsedStatus = z.enum(TRIP_STATUSES).safeParse(status);
  if (!parsedStatus.success) return { error: "Ungültiger Status." };

  const existing = await prisma.trip.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) return { error: "Reise nicht gefunden." };

  await prisma.trip.update({
    where: { id },
    data: { status: parsedStatus.data as TripStatus },
  });

  revalidatePath("/trips");
  revalidatePath(`/trips/${id}`);
  revalidatePath("/dashboard");
  return {};
}

export async function deleteTrip(id: string): Promise<TripActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };

  const existing = await prisma.trip.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) return { error: "Reise nicht gefunden." };

  try {
    await prisma.trip.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { error: "Reise nicht gefunden." };
    }
    throw error;
  }

  revalidatePath("/trips");
  revalidatePath("/dashboard");
  return { redirectTo: "/trips" };
}
