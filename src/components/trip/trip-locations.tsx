import type { Location, TripDay } from "@prisma/client";
import { TripMap, type TripMapMarker } from "@/components/map/trip-map";
import { LocationListItem } from "@/components/trip/location-list-item";
import { formatTripDayDateShort } from "@/lib/trip-days";
import type { LocationCategoryValue } from "@/lib/locations";

function toMarker(location: Location): TripMapMarker {
  return {
    id: location.id,
    name: location.name,
    category: location.category as LocationCategoryValue,
    latitude: location.latitude,
    longitude: location.longitude,
    isHighlight: location.isHighlight,
    description: location.description,
    tripDayId: location.tripDayId,
    sortOrder: location.sortOrder,
  };
}

export function TripLocations({
  tripId,
  locations,
  days,
}: {
  tripId: string;
  locations: Location[];
  days: TripDay[];
}) {
  const markers = locations.map(toMarker);

  // Group locations by day (chronological), with an "unassigned" group last.
  const groups: { key: string; label: string; items: Location[] }[] = [];
  for (const day of days) {
    const items = locations.filter((l) => l.tripDayId === day.id);
    if (items.length > 0) {
      groups.push({
        key: day.id,
        label: `Tag ${day.dayNumber} – ${formatTripDayDateShort(day.date)}`,
        items,
      });
    }
  }
  const unassigned = locations.filter((l) => l.tripDayId === null);
  if (unassigned.length > 0) {
    groups.push({
      key: "none",
      label: "Ohne Tageszuordnung",
      items: unassigned,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <TripMap tripId={tripId} markers={markers} />

      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.key} className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-[var(--color-muted)]">
              {group.label}
            </h3>
            <ul className="flex flex-col gap-2">
              {group.items.map((location) => (
                <li key={location.id}>
                  <LocationListItem tripId={tripId} location={location} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
