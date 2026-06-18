"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createTripDay, updateTripDay } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import type { TripDayFormInitial } from "@/lib/trip-days";

type DayFormProps = {
  tripId: string;
  /** When set, the form edits this day; otherwise it creates a new one. */
  dayId?: string;
  initial?: TripDayFormInitial;
  submitLabel: string;
  cancelHref: string;
};

const emptyInitial: TripDayFormInitial = {
  date: "",
  title: "",
  startLocation: "",
  endLocation: "",
  distanceKm: "",
  drivingMinutes: "",
  dailyNote: "",
};

export function DayForm({
  tripId,
  dayId,
  initial,
  submitLabel,
  cancelHref,
}: DayFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const values = initial ?? emptyInitial;

  function onSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = dayId
        ? await updateTripDay(tripId, dayId, formData)
        : await createTripDay(tripId, formData);

      if (result?.fieldErrors) setFieldErrors(result.fieldErrors);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardContent>
        <form action={onSubmit} className="flex flex-col gap-5">
          <Input
            label="Datum"
            name="date"
            type="date"
            defaultValue={values.date}
            errorMessage={fieldErrors.date}
            required
            autoFocus
          />

          <Input
            label="Titel"
            name="title"
            placeholder="z. B. Anreise nach Kopenhagen (optional)"
            defaultValue={values.title}
            errorMessage={fieldErrors.title}
            maxLength={200}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Startort"
              name="startLocation"
              placeholder="optional"
              defaultValue={values.startLocation}
              errorMessage={fieldErrors.startLocation}
              maxLength={200}
            />
            <Input
              label="Zielort"
              name="endLocation"
              placeholder="optional"
              defaultValue={values.endLocation}
              errorMessage={fieldErrors.endLocation}
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Strecke (km)"
              name="distanceKm"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              placeholder="optional"
              defaultValue={values.distanceKm}
              errorMessage={fieldErrors.distanceKm}
            />
            <Input
              label="Fahrzeit (Minuten)"
              name="drivingMinutes"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              placeholder="optional"
              defaultValue={values.drivingMinutes}
              errorMessage={fieldErrors.drivingMinutes}
            />
          </div>

          <Textarea
            label="Tagesnotiz"
            name="dailyNote"
            placeholder="Notizen zu diesem Tag (optional)"
            defaultValue={values.dailyNote}
            errorMessage={fieldErrors.dailyNote}
            rows={5}
          />

          {error ? (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <div className="mt-1 flex items-center justify-end gap-3">
            <Link href={cancelHref}>
              <Button type="button" variant="secondary" disabled={isPending}>
                Abbrechen
              </Button>
            </Link>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Speichern…" : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
