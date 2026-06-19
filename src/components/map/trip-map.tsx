"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MlMap } from "maplibre-gl";
import {
  categoryColor,
  categoryLabel,
  LOCATION_HIGHLIGHT_COLOR,
  type LocationCategoryValue,
} from "@/lib/locations";
import { rasterStyleForTheme, EUROPE_CENTER, EUROPE_ZOOM } from "./map-style";
import { useTheme } from "@/lib/use-theme";

export type TripMapMarker = {
  id: string;
  name: string;
  category: LocationCategoryValue;
  latitude: number;
  longitude: number;
  isHighlight: boolean;
  description: string | null;
  tripDayId: string | null;
  sortOrder: number;
};

type TripMapProps = {
  tripId: string;
  markers: TripMapMarker[];
  /** Tailwind height classes, e.g. "h-[300px] sm:h-[400px]". */
  heightClassName?: string;
  className?: string;
  /** Public mode: popups show no "Details anzeigen" link. */
  readOnly?: boolean;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function popupHtml(
  tripId: string,
  marker: TripMapMarker,
  readOnly: boolean,
): string {
  const name = escapeHtml(marker.name);
  const label = escapeHtml(categoryLabel(marker.category));
  const description = marker.description
    ? `<p style="margin:6px 0 0;color:#8a93a6;font-size:12px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(
        marker.description,
      )}</p>`
    : "";
  const detailLink = readOnly
    ? ""
    : `<a href="/trips/${tripId}/locations/${marker.id}" style="display:inline-block;margin-top:8px;font-size:12px;color:#4f46e5;font-weight:600;">Details anzeigen →</a>`;
  return `
    <div style="min-width:160px;font-family:inherit;">
      <strong style="font-size:14px;color:#0b0d12;">${name}</strong>
      <div style="margin-top:4px;">
        <span style="display:inline-block;background:#eef;border-radius:9999px;padding:1px 8px;font-size:11px;color:#3730a3;">${label}</span>
      </div>
      ${description}
      ${detailLink}
    </div>
  `;
}

// Builds per-day connecting lines (markers assigned to the same day, in order).
function dayLineFeatures(markers: TripMapMarker[]) {
  const byDay = new Map<string, TripMapMarker[]>();
  for (const marker of markers) {
    if (!marker.tripDayId) continue;
    const list = byDay.get(marker.tripDayId) ?? [];
    list.push(marker);
    byDay.set(marker.tripDayId, list);
  }
  const features = [];
  for (const list of byDay.values()) {
    if (list.length < 2) continue;
    const ordered = [...list].sort((a, b) => a.sortOrder - b.sortOrder);
    features.push({
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: ordered.map((m) => [m.longitude, m.latitude]),
      },
      properties: {},
    });
  }
  return features;
}

export function TripMap({
  tripId,
  markers,
  heightClassName = "h-[300px] sm:h-[400px]",
  className = "",
  readOnly = false,
}: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const theme = useTheme();

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !container) return;

      const map = new maplibregl.Map({
        container,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style: rasterStyleForTheme(theme) as any,
        center: EUROPE_CENTER,
        zoom: EUROPE_ZOOM,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        const lineFeatures = dayLineFeatures(markers);
        if (lineFeatures.length > 0) {
          map.addSource("day-lines", {
            type: "geojson",
            data: { type: "FeatureCollection", features: lineFeatures },
          });
          map.addLayer({
            id: "day-lines",
            type: "line",
            source: "day-lines",
            paint: {
              "line-color": "#6366f1",
              "line-width": 2,
              "line-opacity": 0.6,
              "line-dasharray": [2, 1.5],
            },
          });
        }

        for (const marker of markers) {
          const popup = new maplibregl.Popup({
            offset: 24,
            closeButton: true,
          }).setHTML(popupHtml(tripId, marker, readOnly));

          new maplibregl.Marker({
            color: marker.isHighlight
              ? LOCATION_HIGHLIGHT_COLOR
              : categoryColor(marker.category),
            scale: marker.isHighlight ? 1.35 : 1,
          })
            .setLngLat([marker.longitude, marker.latitude])
            .setPopup(popup)
            .addTo(map);
        }

        if (markers.length === 1) {
          map.jumpTo({
            center: [markers[0].longitude, markers[0].latitude],
            zoom: 11,
          });
        } else if (markers.length > 1) {
          const bounds = new maplibregl.LngLatBounds();
          for (const marker of markers) {
            bounds.extend([marker.longitude, marker.latitude]);
          }
          map.fitBounds(bounds, { padding: 56, maxZoom: 13, duration: 0 });
        }
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [tripId, markers, readOnly, theme]);

  return (
    <div
      ref={containerRef}
      className={[
        "w-full overflow-hidden rounded-lg border border-[var(--color-border)]",
        heightClassName,
        className,
      ].join(" ")}
    />
  );
}
