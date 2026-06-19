"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MlMap, Marker as MlMarker } from "maplibre-gl";
import { rasterStyleForTheme, EUROPE_CENTER, EUROPE_ZOOM } from "./map-style";
import { useTheme } from "@/lib/use-theme";

type LocationPickerProps = {
  /** Initial coordinates (only read once, on mount). */
  initialLatitude: number | null;
  initialLongitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
  heightClassName?: string;
};

export function LocationPicker({
  initialLatitude,
  initialLongitude,
  onChange,
  heightClassName = "h-[300px]",
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRef = useRef<MlMarker | null>(null);
  const theme = useTheme();
  // Keep the latest onChange without re-initialising the map.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Switch tiles on theme change without re-initialising (keeps the picked marker).
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapRef.current?.setStyle(rasterStyleForTheme(theme) as any);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    const startLat = initialLatitude;
    const startLng = initialLongitude;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !container) return;

      const hasStart =
        startLat != null &&
        startLng != null &&
        Number.isFinite(startLat) &&
        Number.isFinite(startLng);

      const map = new maplibregl.Map({
        container,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style: rasterStyleForTheme(theme) as any,
        center: hasStart ? [startLng, startLat] : EUROPE_CENTER,
        zoom: hasStart ? 11 : EUROPE_ZOOM,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-right",
      );

      function placeMarker(lng: number, lat: number) {
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        } else {
          const marker = new maplibregl.Marker({
            color: "#6366f1",
            draggable: true,
          })
            .setLngLat([lng, lat])
            .addTo(map);
          marker.on("dragend", () => {
            const pos = marker.getLngLat();
            onChangeRef.current(
              Number(pos.lat.toFixed(6)),
              Number(pos.lng.toFixed(6)),
            );
          });
          markerRef.current = marker;
        }
      }

      if (hasStart) {
        placeMarker(startLng, startLat);
      }

      map.on("click", (event) => {
        const { lng, lat } = event.lngLat;
        placeMarker(lng, lat);
        onChangeRef.current(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
      });
    })();

    return () => {
      cancelled = true;
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Intentionally run once on mount; later coordinate edits are driven by the map itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      <div
        ref={containerRef}
        className={[
          "w-full overflow-hidden rounded-lg border border-[var(--color-border)]",
          heightClassName,
        ].join(" ")}
      />
      <p className="text-xs text-[var(--color-muted)]">
        Klicken Sie auf die Karte, um die Position zu setzen. Den Marker können
        Sie zum Feinjustieren verschieben.
      </p>
    </div>
  );
}
