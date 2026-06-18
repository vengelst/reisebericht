"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignMedia } from "@/app/(dashboard)/trips/[id]/media/actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export type InboxOption = { id: string; label: string };

export type InboxItem = {
  id: string;
  thumbUrl: string;
  caption: string | null;
  suggestedDayId: string | null;
  suggestedLocationId: string | null;
  suggestionLabel: string | null;
};

type MediaInboxProps = {
  tripId: string;
  items: InboxItem[];
  dayOptions: InboxOption[];
  locationOptions: InboxOption[];
};

export function MediaInbox({
  tripId,
  items,
  dayOptions,
  locationOptions,
}: MediaInboxProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<
    Record<string, { dayId: string; locationId: string }>
  >(() =>
    Object.fromEntries(
      items.map((item) => [
        item.id,
        {
          dayId: item.suggestedDayId ?? "",
          locationId: item.suggestedLocationId ?? "",
        },
      ]),
    ),
  );

  function update(id: string, patch: Partial<{ dayId: string; locationId: string }>) {
    setSelection((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function assign(id: string) {
    const choice = selection[id];
    if (!choice || (!choice.dayId && !choice.locationId)) {
      setError("Bitte einen Tag oder Ort auswählen.");
      return;
    }
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const formData = new FormData();
      if (choice.dayId) formData.append("tripDayId", choice.dayId);
      if (choice.locationId) formData.append("locationId", choice.locationId);
      const result = await assignMedia(tripId, id, formData);
      setBusyId(null);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const choice = selection[item.id] ?? { dayId: "", locationId: "" };
          return (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:flex-row sm:items-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.thumbUrl}
                alt={item.caption ?? "Bild"}
                className="h-20 w-20 shrink-0 rounded-md object-cover"
              />
              <div className="flex flex-1 flex-col gap-2">
                {item.suggestionLabel ? (
                  <span className="text-xs text-[var(--color-muted)]">
                    Vorschlag: {item.suggestionLabel}
                  </span>
                ) : null}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Select
                    aria-label="Reisetag"
                    value={choice.dayId}
                    onChange={(event) =>
                      update(item.id, { dayId: event.target.value })
                    }
                  >
                    <option value="">Keinem Tag zugeordnet</option>
                    {dayOptions.map((day) => (
                      <option key={day.id} value={day.id}>
                        {day.label}
                      </option>
                    ))}
                  </Select>
                  <Select
                    aria-label="Ort"
                    value={choice.locationId}
                    onChange={(event) =>
                      update(item.id, { locationId: event.target.value })
                    }
                  >
                    <option value="">Keinem Ort zugeordnet</option>
                    {locationOptions.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => assign(item.id)}
                disabled={isPending && busyId === item.id}
              >
                {isPending && busyId === item.id ? "…" : "Zuordnen"}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
