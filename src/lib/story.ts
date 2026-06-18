// Shared types for the story (Reisegeschichte) view. Type-only Prisma imports
// keep this module free of server-only runtime code.
import type { Trip, TripDay, Location, Media, Note } from "@prisma/client";

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
