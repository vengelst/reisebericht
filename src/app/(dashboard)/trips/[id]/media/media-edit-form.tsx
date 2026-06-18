"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMedia } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { InboxOption } from "@/components/media/media-inbox";

export type MediaEditInitial = {
  caption: string;
  tripDayId: string;
  locationId: string;
  isHighlight: boolean;
  isCover: boolean;
};

type MediaEditFormProps = {
  tripId: string;
  mediaId: string;
  initial: MediaEditInitial;
  dayOptions: InboxOption[];
  locationOptions: InboxOption[];
};

export function MediaEditForm({
  tripId,
  mediaId,
  initial,
  dayOptions,
  locationOptions,
}: MediaEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateMedia(tripId, mediaId, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-5">
      <Input
        label="Bildunterschrift"
        name="caption"
        placeholder="optional"
        defaultValue={initial.caption}
        maxLength={500}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Select
          label="Zuordnung: Reisetag"
          name="tripDayId"
          defaultValue={initial.tripDayId}
        >
          <option value="">Keinem Tag zugeordnet</option>
          {dayOptions.map((day) => (
            <option key={day.id} value={day.id}>
              {day.label}
            </option>
          ))}
        </Select>
        <Select
          label="Zuordnung: Ort"
          name="locationId"
          defaultValue={initial.locationId}
        >
          <option value="">Keinem Ort zugeordnet</option>
          {locationOptions.map((location) => (
            <option key={location.id} value={location.id}>
              {location.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        <Checkbox
          name="isHighlight"
          label="Als Highlight markieren"
          defaultChecked={initial.isHighlight}
        />
        <Checkbox
          name="isCover"
          label="Als Titelbild verwenden"
          defaultChecked={initial.isCover}
        />
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Speichern…" : "Speichern"}
        </Button>
      </div>
    </form>
  );
}
