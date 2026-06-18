"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createTrip, updateTrip } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  TRIP_STATUS_FORM_OPTIONS,
  TRIP_STATUS_LABELS,
  TRIP_VISIBILITY_FORM_OPTIONS,
  TRIP_VISIBILITY_LABELS,
  type TripStatusValue,
  type TripVisibilityValue,
} from "@/lib/trips";

export type TripFormInitial = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: TripStatusValue;
  visibility: TripVisibilityValue;
};

type TripFormProps = {
  /** When set, the form edits an existing trip; otherwise it creates one. */
  tripId?: string;
  initial?: TripFormInitial;
  submitLabel: string;
  cancelHref: string;
};

const emptyInitial: TripFormInitial = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  status: "PLANNING",
  visibility: "PRIVATE",
};

export function TripForm({
  tripId,
  initial,
  submitLabel,
  cancelHref,
}: TripFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const values = initial ?? emptyInitial;

  function onSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = tripId
        ? await updateTrip(tripId, formData)
        : await createTrip(formData);

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
            label="Titel"
            name="title"
            placeholder="z. B. Sommer in Skandinavien"
            defaultValue={values.title}
            errorMessage={fieldErrors.title}
            maxLength={200}
            required
            autoFocus
          />

          <Textarea
            label="Beschreibung"
            name="description"
            placeholder="Worum geht es auf dieser Reise? (optional)"
            defaultValue={values.description}
            errorMessage={fieldErrors.description}
            rows={4}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Startdatum"
              name="startDate"
              type="date"
              defaultValue={values.startDate}
              errorMessage={fieldErrors.startDate}
            />
            <Input
              label="Enddatum"
              name="endDate"
              type="date"
              defaultValue={values.endDate}
              errorMessage={fieldErrors.endDate}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Select
              label="Status"
              name="status"
              defaultValue={values.status}
              errorMessage={fieldErrors.status}
            >
              {TRIP_STATUS_FORM_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {TRIP_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
            <Select
              label="Sichtbarkeit"
              name="visibility"
              defaultValue={values.visibility}
              errorMessage={fieldErrors.visibility}
            >
              {TRIP_VISIBILITY_FORM_OPTIONS.map((visibility) => (
                <option key={visibility} value={visibility}>
                  {TRIP_VISIBILITY_LABELS[visibility]}
                </option>
              ))}
            </Select>
          </div>

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
