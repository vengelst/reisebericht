"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MlMap } from "maplibre-gl";
import { DARK_RASTER_STYLE } from "./map-style";

// A read-only map showing a single coordinate (e.g. a photo's GPS location).
export function PointMap({
  latitude,
  longitude,
  heightClassName = "h-[220px]",
}: {
  latitude: number;
  longitude: number;
  heightClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);

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
        style: DARK_RASTER_STYLE as any,
        center: [longitude, latitude],
        zoom: 12,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      new maplibregl.Marker({ color: "#6366f1" })
        .setLngLat([longitude, latitude])
        .addTo(map);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      className={[
        "w-full overflow-hidden rounded-lg border border-[var(--color-border)]",
        heightClassName,
      ].join(" ")}
    />
  );
}
