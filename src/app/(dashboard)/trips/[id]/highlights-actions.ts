"use server";

import type { Location, Media, Note } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

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

export type TripHighlights = {
  locations: Location[];
  media: Media[];
  notes: Note[];
};

/** Loads all highlighted locations, media and notes of a trip. */
export async function getHighlights(
  tripId: string,
): Promise<TripHighlights | null> {
  const userId = await currentUserId();
  if (!userId || !(await ownsTrip(tripId, userId))) return null;

  const [locations, media, notes] = await Promise.all([
    prisma.location.findMany({
      where: { tripId, isHighlight: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.media.findMany({
      where: { tripId, isHighlight: true },
      orderBy: [
        { takenAt: { sort: "asc", nulls: "last" } },
        { createdAt: "asc" },
      ],
    }),
    prisma.note.findMany({
      where: { tripId, isHighlight: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return { locations, media, notes };
}
