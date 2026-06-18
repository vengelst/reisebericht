"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { buildStoryData, type StoryData } from "@/lib/story";

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** Loads everything needed to render a trip's chronological story view. */
export async function getStoryData(tripId: string): Promise<StoryData | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId, deletedAt: null },
  });
  if (!trip) return null;

  const [days, locations, media, notes] = await Promise.all([
    prisma.tripDay.findMany({ where: { tripId }, orderBy: { sortOrder: "asc" } }),
    prisma.location.findMany({
      where: { tripId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.media.findMany({
      where: { tripId },
      orderBy: [
        { takenAt: { sort: "asc", nulls: "last" } },
        { createdAt: "asc" },
      ],
    }),
    prisma.note.findMany({ where: { tripId }, orderBy: { sortOrder: "asc" } }),
  ]);

  return buildStoryData(trip, days, locations, media, notes);
}
