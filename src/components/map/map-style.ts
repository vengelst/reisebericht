// Shared MapLibre configuration. A raster style using CARTO's "dark_all"
// tiles (free, no API key) keeps the map consistent with the app's dark theme.

export const DARK_RASTER_STYLE = {
  version: 8 as const,
  sources: {
    "carto-dark": {
      type: "raster" as const,
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap-Mitwirkende © CARTO",
    },
  },
  layers: [
    {
      id: "carto-dark",
      type: "raster" as const,
      source: "carto-dark",
    },
  ],
};

// Default view (roughly centered on Europe) when there are no markers.
export const EUROPE_CENTER: [number, number] = [10, 50];
export const EUROPE_ZOOM = 3.4;
