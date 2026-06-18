"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { PublicationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { PublicationActionResult } from "@/lib/publications";

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function ownsTrip(tripId: string, userId: string) {
  return prisma.trip.findFirst({
    where: { id: tripId, userId, deletedAt: null },
    select: { id: true, title: true },
  });
}

// Cryptographically secure, URL-friendly share token (~24 chars, 18 bytes).
function generateShareToken(): string {
  return randomBytes(18).toString("base64url");
}

function revalidate(tripId: string): void {
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/publication`);
}

/** Loads the (single) publication of a trip, or null. */
export async function getPublication(tripId: string) {
  const userId = await currentUserId();
  if (!userId || !(await ownsTrip(tripId, userId))) return null;
  return prisma.publication.findFirst({ where: { tripId } });
}

export async function createPublication(
  tripId: string,
  formData: FormData,
): Promise<PublicationActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  const trip = await ownsTrip(tripId, userId);
  if (!trip) return { error: "Reise nicht gefunden." };

  // Only one publication per trip.
  const existing = await prisma.publication.findFirst({
    where: { tripId },
    select: { id: true },
  });
  if (existing) return { error: "Es existiert bereits eine Freigabe." };

  const title =
    (formData.get("title") as string | null)?.trim() || trip.title;
  const password = (formData.get("password") as string | null)?.trim() || "";
  const passwordHash = password ? await bcrypt.hash(password, 12) : null;

  await prisma.publication.create({
    data: {
      tripId,
      shareToken: generateShareToken(),
      title,
      status: PublicationStatus.DRAFT,
      passwordHash,
    },
  });

  revalidate(tripId);
  return { redirectTo: `/trips/${tripId}/publication` };
}

export async function updatePublication(
  tripId: string,
  publicationId: string,
  formData: FormData,
): Promise<PublicationActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const publication = await prisma.publication.findFirst({
    where: { id: publicationId, tripId },
    select: { id: true },
  });
  if (!publication) return { error: "Freigabe nicht gefunden." };

  const title = (formData.get("title") as string | null)?.trim();
  if (!title) return { error: "Titel darf nicht leer sein.", fieldErrors: { title: "Titel ist erforderlich." } };

  const password = (formData.get("password") as string | null)?.trim() || "";
  // Empty password field clears the protection.
  const passwordHash = password ? await bcrypt.hash(password, 12) : null;

  await prisma.publication.update({
    where: { id: publicationId },
    data: { title, passwordHash },
  });

  revalidate(tripId);
  return { redirectTo: `/trips/${tripId}/publication` };
}

export async function publishPublication(
  tripId: string,
  publicationId: string,
): Promise<PublicationActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const publication = await prisma.publication.findFirst({
    where: { id: publicationId, tripId },
    select: { id: true },
  });
  if (!publication) return { error: "Freigabe nicht gefunden." };

  await prisma.publication.update({
    where: { id: publicationId },
    data: { status: PublicationStatus.PUBLISHED, publishedAt: new Date() },
  });

  revalidate(tripId);
  return {};
}

export async function unpublishPublication(
  tripId: string,
  publicationId: string,
): Promise<PublicationActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const publication = await prisma.publication.findFirst({
    where: { id: publicationId, tripId },
    select: { id: true },
  });
  if (!publication) return { error: "Freigabe nicht gefunden." };

  await prisma.publication.update({
    where: { id: publicationId },
    data: { status: PublicationStatus.DRAFT },
  });

  revalidate(tripId);
  return {};
}

export async function deletePublication(
  tripId: string,
  publicationId: string,
): Promise<PublicationActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Nicht angemeldet." };
  if (!(await ownsTrip(tripId, userId)))
    return { error: "Reise nicht gefunden." };

  const publication = await prisma.publication.findFirst({
    where: { id: publicationId, tripId },
    select: { id: true },
  });
  if (!publication) return { error: "Freigabe nicht gefunden." };

  await prisma.publication.delete({ where: { id: publicationId } });

  revalidate(tripId);
  return { redirectTo: `/trips/${tripId}/publication` };
}
