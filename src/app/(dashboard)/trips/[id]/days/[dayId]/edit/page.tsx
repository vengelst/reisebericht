import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTripDay } from "../../actions";
import { DayForm } from "../../day-form";
import { toDateInputValue } from "@/lib/trips";
import { toNumberOrNull } from "@/lib/trip-days";

type EditDayPageProps = {
  params: Promise<{ id: string; dayId: string }>;
};

export const metadata: Metadata = {
  title: "Tag bearbeiten",
};

export default async function EditDayPage({ params }: EditDayPageProps) {
  const { id, dayId } = await params;
  const day = await getTripDay(id, dayId);

  if (!day) {
    notFound();
  }

  const distance = toNumberOrNull(day.distanceKm);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/trips/${id}/days/${day.id}`}
          className="text-sm text-[var(--color-muted)] transition-colors hover:text-foreground"
        >
          ← Zurück zu Tag {day.dayNumber}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tag bearbeiten
        </h1>
      </div>

      <DayForm
        tripId={id}
        dayId={day.id}
        submitLabel="Speichern"
        cancelHref={`/trips/${id}/days/${day.id}`}
        initial={{
          date: toDateInputValue(day.date),
          title: day.title ?? "",
          startLocation: day.startLocation ?? "",
          endLocation: day.endLocation ?? "",
          distanceKm: distance === null ? "" : String(distance),
          drivingMinutes:
            day.drivingMinutes === null ? "" : String(day.drivingMinutes),
          dailyNote: day.dailyNote ?? "",
        }}
      />
    </div>
  );
}
