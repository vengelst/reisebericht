import Link from "next/link";
import type { Location } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { categoryEmoji, categoryLabel } from "@/lib/locations";

export function LocationListItem({
  tripId,
  location,
  readOnly = false,
}: {
  tripId: string;
  location: Location;
  readOnly?: boolean;
}) {
  const card = (
    <Card
      className={
        readOnly
          ? ""
          : "transition-colors hover:border-[var(--color-accent)]/60"
      }
    >
      <CardContent className="flex items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true">{categoryEmoji(location.category)}</span>
          <span className="truncate text-sm font-medium text-foreground">
            {location.name}
          </span>
          {location.isHighlight ? (
            <span
              className="text-[var(--color-accent)]"
              title="Highlight"
              aria-label="Highlight"
            >
              ★
            </span>
          ) : null}
        </div>
        <Badge tone="muted">{categoryLabel(location.category)}</Badge>
      </CardContent>
    </Card>
  );

  if (readOnly) {
    return <div>{card}</div>;
  }

  return (
    <Link href={`/trips/${tripId}/locations/${location.id}`} className="block">
      {card}
    </Link>
  );
}
