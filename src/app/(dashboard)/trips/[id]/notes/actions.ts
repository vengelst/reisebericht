"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { NoteType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NOTE_TYPES, type NoteActionResult } from "@/lib/notes";

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

const noteInputSchema = z.object({
  type: z.enum(NOTE_TYPES),
  content: z
    .string()
    .trim()
    .min(1, "Inhalt darf nicht leer sein.")
    .max(20000, "Inhalt ist zu lang (max. 20000 Zeichen)."),
});

function optionalId(formData: FormData, key: string): string | null {
  return (formData.get(key) as string | null)?.trim() || null;
}

function fieldErrorsFrom(error: z.ZodError): NoteActionResult {
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

function revalidateTrip(tripId: string): void {
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/notes`);
  revalidatePath("/dashboard");
}

/** Lists a trip's notes, ordered by sortOrder. */
export async function getNotes(tripId: string) {
  const userId = await currentUserId();
  if (!userId || !(await ownsTrip(tripId, userId))) return [];
  return prisma.note.findMany({
    where: { tripId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getNotesByDay(tripId: string, dayId: string) {
  const userId = await currentUserId();
  if (!userId || !(await ownsTrip(tripId, userId))) return [];
  return prisma.note.findMany({
    where: { tripId, tripDayId: dayId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getNotesByLocation(tripId: string, locationId: string) {
  const userId = await currentUserId();
  if (!userId || !(await ownsTrip(tripId, userId))) return [];
  return prisma.note.findMany({
    where: { tripId, locationId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getNote(tripId: string, noteId: string) {
  const userId = await currentUserId();
  if (!userId || !(await ownsTrip(tripId, userId))) return null;
  return prisma.note.findFirst({ where: { id: noteId, tripId } });
}

export async function createNote(
  tripId: string,
  formData: FormData,
): Promise<NoteActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const parsed = noteInputSchema.safeParse({
    type: formData.get("type"),
    content: formData.get("content"),
  });
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  const tripDayId = optionalId(formData, "tripDayId");
  const locationId = optionalId(formData, "locationId");
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

  const aggregate = await prisma.note.aggregate({
    where: { tripId },
    _max: { sortOrder: true },
  });

  await prisma.note.create({
    data: {
      tripId,
      tripDayId,
      locationId,
      type: parsed.data.type as NoteType,
      content: parsed.data.content,
      sortOrder: (aggregate._max.sortOrder ?? 0) + 1,
    },
  });

  revalidateTrip(tripId);
  return {};
}

export async function updateNote(
  tripId: string,
  noteId: string,
  formData: FormData,
): Promise<NoteActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const existing = await prisma.note.findFirst({
    where: { id: noteId, tripId },
    select: { id: true },
  });
  if (!existing) return { error: "Notiz nicht gefunden." };

  const parsed = noteInputSchema.safeParse({
    type: formData.get("type"),
    content: formData.get("content"),
  });
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  await prisma.note.update({
    where: { id: noteId },
    data: { type: parsed.data.type as NoteType, content: parsed.data.content },
  });

  revalidateTrip(tripId);
  revalidatePath(`/trips/${tripId}/notes/${noteId}`);
  return { redirectTo: `/trips/${tripId}/notes/${noteId}` };
}

export async function deleteNote(
  tripId: string,
  noteId: string,
): Promise<NoteActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const existing = await prisma.note.findFirst({
    where: { id: noteId, tripId },
    select: { id: true },
  });
  if (!existing) return { error: "Notiz nicht gefunden." };

  await prisma.note.delete({ where: { id: noteId } });

  revalidateTrip(tripId);
  return { redirectTo: `/trips/${tripId}/notes` };
}

export async function toggleNoteHighlight(
  tripId: string,
  noteId: string,
): Promise<NoteActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const note = await prisma.note.findFirst({
    where: { id: noteId, tripId },
    select: { id: true, isHighlight: true },
  });
  if (!note) return { error: "Notiz nicht gefunden." };

  await prisma.note.update({
    where: { id: noteId },
    data: { isHighlight: !note.isHighlight },
  });

  revalidateTrip(tripId);
  revalidatePath(`/trips/${tripId}/notes/${noteId}`);
  return {};
}

export async function assignNoteToDay(
  tripId: string,
  noteId: string,
  tripDayId: string | null,
): Promise<NoteActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const existing = await prisma.note.findFirst({
    where: { id: noteId, tripId },
    select: { id: true },
  });
  if (!existing) return { error: "Notiz nicht gefunden." };

  if (tripDayId && !(await dayBelongsToTrip(tripId, tripDayId)))
    return { error: "Der gewählte Reisetag gehört nicht zu dieser Reise." };

  await prisma.note.update({
    where: { id: noteId },
    data: { tripDayId },
  });

  revalidateTrip(tripId);
  return {};
}

export async function assignNoteToLocation(
  tripId: string,
  noteId: string,
  locationId: string | null,
): Promise<NoteActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const existing = await prisma.note.findFirst({
    where: { id: noteId, tripId },
    select: { id: true },
  });
  if (!existing) return { error: "Notiz nicht gefunden." };

  if (locationId && !(await locationBelongsToTrip(tripId, locationId)))
    return { error: "Der gewählte Ort gehört nicht zu dieser Reise." };

  await prisma.note.update({
    where: { id: noteId },
    data: { locationId },
  });

  revalidateTrip(tripId);
  return {};
}
