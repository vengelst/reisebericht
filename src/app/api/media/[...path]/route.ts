import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

// Serves media objects from MinIO through the app, enforcing that the requester
// owns the trip the object belongs to. Keys look like:
//   trips/<tripId>/originals/<mediaId>.<ext>
//   trips/<tripId>/thumbnails/<mediaId>-md.webp
export async function GET(_request: Request, context: RouteContext) {
  const { path } = await context.params;

  if (!path || path.length < 4 || path[0] !== "trips") {
    return new Response("Not found", { status: 404 });
  }
  const tripId = path[1];
  const segment = path[2];
  if (segment !== "originals" && segment !== "thumbnails") {
    return new Response("Not found", { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Only the trip owner may access its media (shared-report viewing is handled
  // separately and is out of scope here).
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: session.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!trip) {
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
      "Cache-Control": "private, max-age=3600",
    },
  });
}
