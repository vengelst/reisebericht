"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { StoryData, StoryLocation } from "@/lib/story";

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

  const noteCountByLocation = new Map<string, number>();
  for (const note of notes) {
    if (note.locationId) {
      noteCountByLocation.set(
        note.locationId,
        (noteCountByLocation.get(note.locationId) ?? 0) + 1,
      );
    }
  }

  const storyDays = days.map((day) => {
    const dayLocations: StoryLocation[] = locations
      .filter((location) => location.tripDayId === day.id)
      .map((location) => ({
        ...location,
        noteCount: noteCountByLocation.get(location.id) ?? 0,
      }));
    return {
      day,
      locations: dayLocations,
      media: media.filter((m) => m.tripDayId === day.id),
      notes: notes.filter((n) => n.tripDayId === day.id),
    };
  });

  const coverMedia =
    media.find((m) => m.id === trip.coverImageId) ??
    media.find((m) => m.isCover) ??
    null;

  return {
    trip,
    coverMedia,
    days: storyDays,
    unassignedMedia: media.filter((m) => m.tripDayId === null),
    unassignedNotes: notes.filter((n) => n.tripDayId === null),
    allLocations: locations,
  };
}
