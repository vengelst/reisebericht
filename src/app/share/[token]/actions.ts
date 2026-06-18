"use server";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { buildStoryData, type PublicStoryData } from "@/lib/story";
import {
  shareCookieName,
  signShareAccess,
  verifyShareAccess,
} from "@/lib/share-access";

/**
 * Loads the public story for a published share token. No session/ownership
 * check — the token (and, if set, the password cookie) is the authorisation.
 * Returns null for unknown or DRAFT publications.
 */
export async function getPublicStoryData(
  token: string,
): Promise<PublicStoryData | null> {
  const publication = await prisma.publication.findUnique({
    where: { shareToken: token },
  });
  if (!publication || publication.status !== "PUBLISHED") return null;

  const trip = await prisma.trip.findFirst({
    where: { id: publication.tripId, deletedAt: null },
  });
  if (!trip) return null;

  const tripId = trip.id;
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

  const story = buildStoryData(trip, days, locations, media, notes);

  return {
    ...story,
    shareToken: token,
    publication: {
      title: publication.title,
      status: "PUBLISHED",
      hasPassword: publication.passwordHash !== null,
      publishedAt: publication.publishedAt,
    },
  };
}

/**
 * Whether the current visitor may view a (published) report: true when it has
 * no password, or when the signed access cookie is present and valid.
 */
export async function hasShareAccess(token: string): Promise<boolean> {
  const publication = await prisma.publication.findUnique({
    where: { shareToken: token },
    select: { status: true, passwordHash: true },
  });
  if (!publication || publication.status !== "PUBLISHED") return false;
  if (!publication.passwordHash) return true;

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(shareCookieName(token))?.value;
  return verifyShareAccess(token, publication.passwordHash, cookieValue);
}

/**
 * Verifies a publication password and, on success, sets a signed access cookie
 * (httpOnly, 7 days) so the visitor can view the report and its images.
 */
export async function checkPublicationPassword(
  token: string,
  password: string,
): Promise<{ valid: boolean }> {
  const publication = await prisma.publication.findUnique({
    where: { shareToken: token },
    select: { status: true, passwordHash: true },
  });
  if (!publication || publication.status !== "PUBLISHED") {
    return { valid: false };
  }
  if (!publication.passwordHash) return { valid: true };

  const valid = await bcrypt.compare(password, publication.passwordHash);
  if (!valid) return { valid: false };

  const cookieStore = await cookies();
  cookieStore.set(
    shareCookieName(token),
    signShareAccess(token, publication.passwordHash),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  );
  return { valid: true };
}
