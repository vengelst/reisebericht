"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createLocation, updateLocation } from "./actions";
import { LocationPicker } from "@/components/map/location-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  LOCATION_CATEGORIES,
  LOCATION_CATEGORY_EMOJI,
  LOCATION_CATEGORY_LABELS,
  type LocationFormInitial,
} from "@/lib/locations";

export type DayOption = { id: string; label: string };

type LocationFormProps = {
  tripId: string;
  locationId?: string;
  initial?: LocationFormInitial;
  dayOptions: DayOption[];
  defaultDayId?: string;
  submitLabel: string;
  cancelHref: string;
};

const emptyInitial: LocationFormInitial = {
  name: "",
  category: "CITY",
  latitude: "",
  longitude: "",
  tripDayId: "",
  rating: "",
  description: "",
  isHighlight: false,
};

function toNumberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function LocationForm({
  tripId,
  locationId,
  initial,
  dayOptions,
  defaultDayId,
  submitLabel,
  cancelHref,
}: LocationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const values = initial ?? emptyInitial;
  const [latitude, setLatitude] = useState(values.latitude);
  const [longitude, setLongitude] = useState(values.longitude);

  function onSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = locationId
        ? await updateLocation(tripId, locationId, formData)
        : await createLocation(tripId, formData);

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
            label="Name"
            name="name"
            placeholder="z. B. Schloss Kronborg"
            defaultValue={values.name}
            errorMessage={fieldErrors.name}
            maxLength={200}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Select
              label="Kategorie"
              name="category"
              defaultValue={values.category}
              errorMessage={fieldErrors.category}
            >
              {LOCATION_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {LOCATION_CATEGORY_EMOJI[category]}{" "}
                  {LOCATION_CATEGORY_LABELS[category]}
                </option>
              ))}
            </Select>
            <Select
              label="Reisetag"
              name="tripDayId"
              defaultValue={values.tripDayId || defaultDayId || ""}
              errorMessage={fieldErrors.tripDayId}
            >
              <option value="">Ohne Tageszuordnung</option>
              {dayOptions.map((day) => (
                <option key={day.id} value={day.id}>
                  {day.label}
                </option>
              ))}
            </Select>
          </div>

          <LocationPicker
            initialLatitude={toNumberOrNull(values.latitude)}
            initialLongitude={toNumberOrNull(values.longitude)}
            onChange={(lat, lng) => {
              setLatitude(String(lat));
              setLongitude(String(lng));
            }}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Breitengrad"
              name="latitude"
              type="number"
              step="any"
              min="-90"
              max="90"
              inputMode="decimal"
              placeholder="z. B. 56.0394"
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
              errorMessage={fieldErrors.latitude}
              required
            />
            <Input
              label="Längengrad"
              name="longitude"
              type="number"
              step="any"
              min="-180"
              max="180"
              inputMode="decimal"
              placeholder="z. B. 12.6213"
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
              errorMessage={fieldErrors.longitude}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Select
              label="Bewertung"
              name="rating"
              defaultValue={values.rating}
              errorMessage={fieldErrors.rating}
            >
              <option value="">Keine Bewertung</option>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {"★".repeat(value)} ({value})
                </option>
              ))}
            </Select>
            <div className="flex items-end">
              <Checkbox
                name="isHighlight"
                label="Als Highlight markieren"
                defaultChecked={values.isHighlight}
              />
            </div>
          </div>

          <Textarea
            label="Beschreibung"
            name="description"
            placeholder="Notizen zu diesem Ort (optional)"
            defaultValue={values.description}
            errorMessage={fieldErrors.description}
            rows={4}
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
