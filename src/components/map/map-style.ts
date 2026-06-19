// Shared MapLibre raster styles (free CARTO tiles, no API key). Both styles use
// light, legible basemaps — the app's surrounding chrome provides the contrast.

// Used in dark mode: CARTO "light_all" (clean, light grey — readable on a dark
// page, unlike the near-black "dark_all").
export const DARK_RASTER_STYLE = {
  version: 8 as const,
  sources: {
    "carto-light": {
      type: "raster" as const,
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap-Mitwirkende © CARTO",
    },
  },
  layers: [{ id: "carto-light", type: "raster" as const, source: "carto-light" }],
};

// Used in light mode: CARTO "voyager" (colourful, modern).
export const LIGHT_RASTER_STYLE = {
  version: 8 as const,
  sources: {
    "carto-voyager": {
      type: "raster" as const,
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap-Mitwirkende © CARTO",
    },
  },
  layers: [
    { id: "carto-voyager", type: "raster" as const, source: "carto-voyager" },
  ],
};

/** Picks the raster style matching the current theme. */
export function rasterStyleForTheme(theme: "light" | "dark") {
  return theme === "dark" ? DARK_RASTER_STYLE : LIGHT_RASTER_STYLE;
}

// Default view (roughly centered on Europe) when there are no markers.
export const EUROPE_CENTER: [number, number] = [10, 50];
export const EUROPE_ZOOM = 3.4;
