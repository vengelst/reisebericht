// Shared types for the story (Reisegeschichte) view. Type-only Prisma imports
// keep this module free of server-only runtime code.
import type { Trip, TripDay, Location, Media, Note } from "@prisma/client";
import type { PublicationStatusValue } from "@/lib/publications";

export type StoryLocation = Location & { noteCount: number };

export type StoryDay = {
  day: TripDay;
  locations: StoryLocation[];
  media: Media[];
  notes: Note[];
};

export type StoryData = {
  trip: Trip;
  coverMedia: Media | null;
  days: StoryDay[];
  unassignedMedia: Media[];
  unassignedNotes: Note[];
  allLocations: Location[];
};

export type PublicationSummary = {
  title: string;
  status: PublicationStatusValue;
  hasPassword: boolean;
  publishedAt: Date | null;
};

export type PublicStoryData = StoryData & {
  shareToken: string;
  publication: PublicationSummary;
};

/**
 * Groups already-loaded trip rows into the StoryData shape. Pure (no DB), so it
 * can be reused by both the authenticated and the public (token) loaders.
 */
export function buildStoryData(
  trip: Trip,
  days: TripDay[],
  locations: Location[],
  media: Media[],
  notes: Note[],
): StoryData {
  const noteCountByLocation = new Map<string, number>();
  for (const note of notes) {
    if (note.locationId) {
      noteCountByLocation.set(
        note.locationId,
        (noteCountByLocation.get(note.locationId) ?? 0) + 1,
      );
    }
  }

  const storyDays: StoryDay[] = days.map((day) => ({
    day,
    locations: locations
      .filter((location) => location.tripDayId === day.id)
      .map((location) => ({
        ...location,
        noteCount: noteCountByLocation.get(location.id) ?? 0,
      })),
    media: media.filter((m) => m.tripDayId === day.id),
    notes: notes.filter((n) => n.tripDayId === day.id),
  }));

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
