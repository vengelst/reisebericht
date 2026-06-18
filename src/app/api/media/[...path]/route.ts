import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFile } from "@/lib/storage";
import { shareCookieName, verifyShareAccess } from "@/lib/share-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

type Access = "private" | "public" | null;

// Public visitors authorise via a PUBLISHED publication token (?token=...) that
// belongs to the trip; password-protected reports additionally require the
// share-access cookie set after a successful password check.
async function publicAccess(
  tripId: string,
  token: string | null,
): Promise<boolean> {
  if (!token) return false;
  const publication = await prisma.publication.findUnique({
    where: { shareToken: token },
    select: { tripId: true, status: true, passwordHash: true },
  });
  if (
    !publication ||
    publication.status !== "PUBLISHED" ||
    publication.tripId !== tripId
  ) {
    return false;
  }
  if (publication.passwordHash) {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(shareCookieName(token))?.value;
    return verifyShareAccess(token, publication.passwordHash, cookieValue);
  }
  return true;
}

// Serves media objects from MinIO. Keys look like:
//   trips/<tripId>/originals/<mediaId>.<ext>
//   trips/<tripId>/thumbnails/<mediaId>-md.webp
export async function GET(request: Request, context: RouteContext) {
  const { path } = await context.params;

  if (!path || path.length < 4 || path[0] !== "trips") {
    return new Response("Not found", { status: 404 });
  }
  const tripId = path[1];
  const segment = path[2];
  if (segment !== "originals" && segment !== "thumbnails") {
    return new Response("Not found", { status: 404 });
  }

  let access: Access = null;

  // 1. Authenticated owner → private access.
  const session = await auth();
  if (session?.user?.id) {
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId: session.user.id, deletedAt: null },
      select: { id: true },
    });
    if (trip) access = "private";
  }

  // 2. Otherwise: token-based public access.
  if (!access) {
    const token = new URL(request.url).searchParams.get("token");
    if (await publicAccess(tripId, token)) access = "public";
  }

  if (!access) {
    return new Response("Forbidden", { status: 403 });
  }

  const key = path.join("/");
  const file = await getFile(key);
  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(file.body), {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control":
        access === "public"
          ? "public, max-age=86400"
          : "private, max-age=3600",
    },
  });
}
