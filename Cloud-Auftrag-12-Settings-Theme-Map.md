# Cloud-Auftrag 12: Einstellungen, Dark/Light Mode, Karte aufhellen

Stand: 19. Juni 2026
Branch: `feature/settings-theme` (von `main` abzweigen)

---

## Kontext

Die Navigation enthaelt Links zu `/settings` und `/media`, aber fuer beide existieren
**keine Seiten** (404). Es gibt keine Moeglichkeit, das Passwort zu aendern.

Die App ist aktuell ausschliesslich im Dark Mode (hart codierte CSS-Variablen in
`globals.css`). Es gibt keinen Dark/Light-Mode-Toggle.

Die Karte verwendet CARTO `dark_all` Tiles (`src/components/map/map-style.ts`), die so
dunkel sind, dass man kaum etwas erkennt — auch im Dark Mode muss die Karte **heller** sein.

---

## Teil A: Einstellungen-Seite

### A1. Einstellungen-Seite — `src/app/(dashboard)/settings/page.tsx`

Server-Komponente. Laedt Session und Benutzerdaten.

Aufbau:

- Ueberschrift: "Einstellungen"
- **Abschnitt 1: Profil**
  - Anzeigename aendern (Textfeld, Submit-Button)
  - E-Mail anzeigen (nur lesen, nicht aenderbar)
- **Abschnitt 2: Passwort aendern**
  - Formular mit drei Feldern:
    - Aktuelles Passwort
    - Neues Passwort (min. 8 Zeichen)
    - Neues Passwort bestaetigen
  - Server Action prueft aktuelles Passwort (bcrypt compare), hasht neues Passwort.
  - Fehlermeldung bei falschem aktuellem Passwort oder nicht uebereinstimmenden Passwoertern.
  - Erfolgsmeldung bei Aenderung.
- **Abschnitt 3: Darstellung**
  - Dark/Light Mode Toggle (siehe Teil B)

### A2. Server Actions — `src/app/(dashboard)/settings/actions.ts`

`"use server"`, Session-Check.

| Action | Beschreibung |
|--------|-------------|
| `updateProfile(formData)` | `displayName` aendern. Zod: min 1, max 100 Zeichen. |
| `changePassword(formData)` | Aktuelles Passwort pruefen, neues Passwort setzen. Zod: `currentPassword` (min 1), `newPassword` (min 8), `confirmPassword` (muss mit newPassword uebereinstimmen). bcrypt compare + hash. |

### A3. Formular-Komponenten

- `src/app/(dashboard)/settings/profile-form.tsx` — Client-Komponente fuer Profil-Bearbeitung.
- `src/app/(dashboard)/settings/password-form.tsx` — Client-Komponente fuer Passwort-Aenderung.
  Nach Erfolg: Felder leeren, Erfolgsmeldung anzeigen.

---

## Teil B: Dark/Light Mode

### B1. Theme-System

**Ansatz:** CSS-Klasse `dark` / `light` auf dem `<html>`-Element. Gespeichert in
einem Cookie (`theme`), damit der Server beim ersten Render die richtige Klasse
setzen kann (kein Flash of Wrong Theme).

### B2. CSS-Variablen — `src/app/globals.css`

Zwei Farbsaetze definieren:

```css
@theme {
  /* Basis-Werte fuer Light Mode (Default) */
  --color-background: #f8f9fb;
  --color-foreground: #1a1d24;
  --color-surface: #ffffff;
  --color-surface-elevated: #f0f1f4;
  --color-border: #dfe1e6;
  --color-accent: #4f46e5;
  --color-accent-hover: #4338ca;
  --color-muted: #6b7280;
  /* (font-sans bleibt gleich) */
}

:root {
  color-scheme: light;
}

:root.dark {
  color-scheme: dark;
  --color-background: #0b0d12;
  --color-foreground: #e6e8ee;
  --color-surface: #141821;
  --color-surface-elevated: #1c2230;
  --color-border: #232a38;
  --color-accent: #6366f1;
  --color-accent-hover: #4f52e0;
  --color-muted: #8a93a6;
}
```

Wichtig: Das bestehende `:root { color-scheme: dark }` und die Dark-Variablen sind
der bisherige Default. Durch die Umstellung wird `dark` der Default-Cookie-Wert
(bestehende User sehen keinen visuellen Bruch).

### B3. Root Layout anpassen — `src/app/layout.tsx`

- Cookie `theme` lesen (via `cookies()` aus `next/headers`).
- Default-Wert: `"dark"` (damit bestehende Nutzer keinen Flash bekommen).
- `<html lang="de" className={theme}>` setzen.

### B4. Theme-Toggle-Komponente — `src/components/layout/theme-toggle.tsx`

Client-Komponente (`"use client"`):

- Zeigt Sonnen-Icon (Light aktiv) oder Mond-Icon (Dark aktiv).
- Bei Klick:
  - Cookie `theme` setzen (via `document.cookie`, `path=/`, `max-age=365 Tage`).
  - Klasse auf `document.documentElement` sofort umschalten (`dark` ↔ `light`).
  - Kein Page-Reload noetig (CSS-Variablen aendern sich sofort).
- Platzierung:
  - **Desktop-Sidebar**: Zwischen Nav-Links und Benutzer-Info.
  - **Mobile-Drawer**: Gleiche Position.
  - **Einstellungen-Seite**: Im Abschnitt "Darstellung".

### B5. Server Action fuer Theme (optional, aber empfohlen)

`src/app/(dashboard)/settings/actions.ts`:

```typescript
export async function setTheme(formData: FormData): Promise<void> {
  const theme = formData.get("theme") === "light" ? "light" : "dark";
  cookies().set("theme", theme, { path: "/", maxAge: 365 * 86400 });
}
```

Falls der Client-seitige Cookie-Zugriff ausreicht, kann die Server Action entfallen.
Aber fuer die Einstellungsseite ist ein Form-Submit sauberer.

---

## Teil C: Karte aufhellen

### C1. Karten-Styles — `src/components/map/map-style.ts`

Zwei Styles definieren (statt nur `DARK_RASTER_STYLE`):

```typescript
export const LIGHT_RASTER_STYLE = {
  version: 8,
  sources: {
    "carto-voyager": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap © CARTO",
    },
  },
  layers: [{ id: "carto-voyager", type: "raster", source: "carto-voyager" }],
};

export const DARK_RASTER_STYLE = {
  version: 8,
  sources: {
    "carto-light": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap © CARTO",
    },
  },
  layers: [{ id: "carto-light", type: "raster", source: "carto-light" }],
};
```

**Begruendung:** Statt `dark_all` (fast schwarz, unleserlich) wird im Dark Mode
`light_all` verwendet — das ist eine helle Karte mit dezenten Farben, die auch
auf dunklem Hintergrund gut lesbar ist. Im Light Mode wird `voyager` verwendet
(bunt, modern, gut lesbar).

Die Karte soll in **beiden** Modi hell und lesbar sein. Die dunkle Umgebung
(App-Hintergrund) sorgt fuer den Kontrast — die Karte selbst muss den Inhalt
gut zeigen.

### C2. Theme-Prop auf Karten-Komponenten

Alle drei Karten-Komponenten (`TripMap`, `LocationPicker`, `PointMap`) muessen
den aktuellen Theme-Modus kennen, um den richtigen Style zu waehlen.

**Ansatz:** Neue Prop `theme?: "light" | "dark"` auf allen Karten-Komponenten.
Der Wert wird aus dem Cookie oder einem Theme-Context bezogen.

Alternativ (einfacher): Die Karten-Komponenten lesen das Theme selbst via
`document.documentElement.classList.contains("dark")` beim Mount.
Das ist client-seitig und braucht keine Prop.

**Bevorzugter Ansatz:** `useTheme()`-Hook, der das aktuelle Theme aus der
`<html>`-Klasse liest (via `useSyncExternalStore` oder `MutationObserver`).
Dieser Hook wird in `src/components/layout/theme-toggle.tsx` neben dem Toggle
definiert und von den Karten-Komponenten importiert.

```typescript
// src/lib/use-theme.ts
export function useTheme(): "light" | "dark" {
  // Liest className von <html>, subscribed auf MutationObserver
  // SSR-Fallback: "dark"
}
```

Alle drei Map-Komponenten waehlen den Style basierend auf `useTheme()`:

```typescript
const theme = useTheme();
const style = theme === "dark" ? DARK_RASTER_STYLE : LIGHT_RASTER_STYLE;
```

### C3. Popup-Farben anpassen

Die Popup-HTML-Strings in `TripMap` verwenden hart codierte Farben
(`color:#0b0d12`, `color:#3730a3`). Diese muessen fuer den Light-Mode
passen — die bisherigen Werte sind bereits hell-auf-weiss, also kompatibel.
Im Dark Mode muessten die Popup-Farben ebenfalls funktionieren, da das
MapLibre-Popup seinen eigenen weissen Hintergrund hat. **Keine Aenderung noetig.**

---

## Teil D: Nav-Items bereinigen

### D1. `/media`-Link entfernen oder umleiten

Die globale Media-Seite (`/media`) existiert nicht und hat keinen sinnvollen Inhalt
(Medien gehoeren immer zu einer Reise). Den Nav-Link **entfernen**.

`src/app/(dashboard)/nav-items.ts`:

```typescript
export const navItems = [
  { href: "/dashboard", label: "Übersicht" },
  { href: "/trips", label: "Reisen" },
  { href: "/settings", label: "Einstellungen" },
];
```

---

## Regeln

1. **Branch**: Alle Commits auf `feature/settings-theme` (von aktuellem `main`).
2. **Keine neuen Dependencies.**
3. **Prisma-Schema nicht aendern** — User-Modell hat `passwordHash` und `displayName`.
4. **Session-Checks** in allen Settings-Actions.
5. **Default-Theme `dark`** — bestehende Nutzer sehen keinen visuellen Bruch.
6. **Kein Flash of Wrong Theme** — Cookie server-seitig lesen, Klasse vor Render setzen.
7. **Kein `next lint`**: Nur `eslint .` und `tsc --noEmit`.
8. **Responsive**: Einstellungen-Seite muss auf Smartphone funktionieren.

---

## Erfolgskriterien

| # | Kriterium |
|---|-----------|
| 1 | Einstellungen-Seite erreichbar unter `/settings` (kein 404) |
| 2 | Anzeigename aenderbar |
| 3 | Passwort aenderbar (aktuelles Passwort pruefen, neues min. 8 Zeichen) |
| 4 | Fehlermeldung bei falschem aktuellem Passwort |
| 5 | Dark/Light Mode Toggle funktioniert (sofortige Umschaltung, kein Reload) |
| 6 | Theme-Wahl wird in Cookie gespeichert und ueberlebt Seitenreload |
| 7 | Kein Flash of Wrong Theme (Server liest Cookie, setzt Klasse) |
| 8 | Toggle in Desktop-Sidebar und Mobile-Drawer sichtbar |
| 9 | Karte verwendet helle, lesbare Tiles (`light_all` / `voyager`) |
| 10 | Karte reagiert auf Theme-Wechsel (richtiger Style) |
| 11 | Alle drei Karten-Komponenten (TripMap, LocationPicker, PointMap) angepasst |
| 12 | `/media`-Link aus Navigation entfernt (kein 404 mehr) |
| 13 | Light-Mode-Farbschema gut lesbar und konsistent |
| 14 | Dark-Mode-Farbschema unveraendert (kein visueller Bruch fuer bestehende User) |
| 15 | Responsive auf Smartphone, Tablet, Desktop |
| 16 | Keine TS-/Lint-Fehler (`tsc --noEmit`, `eslint .`) |
| 17 | `npm run build` erfolgreich |
| 18 | Commits auf `feature/settings-theme` |

---

## Dateiuebersicht (neu / geaendert)

### Neue Dateien
- `src/app/(dashboard)/settings/page.tsx`
- `src/app/(dashboard)/settings/actions.ts`
- `src/app/(dashboard)/settings/profile-form.tsx`
- `src/app/(dashboard)/settings/password-form.tsx`
- `src/components/layout/theme-toggle.tsx`
- `src/lib/use-theme.ts`

### Geaenderte Dateien
- `src/app/globals.css` — Light/Dark CSS-Variablen
- `src/app/layout.tsx` — Cookie lesen, Theme-Klasse setzen
- `src/app/(dashboard)/layout.tsx` — Theme-Toggle in Sidebar einbinden
- `src/app/(dashboard)/nav-items.ts` — `/media`-Link entfernen
- `src/components/layout/mobile-nav.tsx` — Theme-Toggle einbinden
- `src/components/map/map-style.ts` — Zwei Styles (Voyager + Light)
- `src/components/map/trip-map.tsx` — Theme-abhaengiger Style
- `src/components/map/location-picker.tsx` — Theme-abhaengiger Style
- `src/components/map/point-map.tsx` — Theme-abhaengiger Style
