# Cloud-Auftrag 10: Highlights und Reisegeschichte

Stand: 18. Juni 2026
Branch: `feature/highlights-story` (von `main` abzweigen)

---

## Kontext

`isHighlight` existiert bereits als Feld auf Location, Media und Note. Notizen haben einen
Toggle-Button auf der Detailseite (`NoteDetailActions`), aber Orte und Bilder bieten den
Highlight-Toggle nur ueber das Bearbeiten-Formular — ein Schnell-Toggle fehlt.

Es gibt noch keine zusammenfassende Highlights-Ansicht und keine Reisegeschichte (chronologische
Story-Ansicht, die Bilder, Texte und Highlights zu einer lesbaren Erzaehlung verbindet).

---

## Teil A: Highlight-Schnell-Toggles

### A1. Server Action — `toggleLocationHighlight`

In `src/app/(dashboard)/trips/[id]/locations/actions.ts` hinzufuegen:

```typescript
export async function toggleLocationHighlight(
  tripId: string,
  locationId: string,
): Promise<LocationActionResult | void> {
  // currentUserId + ownsTrip Check (bestehendes Pattern)
  // location.isHighlight invertieren
  // revalidatePath(`/trips/${tripId}`)
}
```

### A2. Server Action — `toggleMediaHighlight`

In `src/app/(dashboard)/trips/[id]/media/actions.ts` hinzufuegen:

```typescript
export async function toggleMediaHighlight(
  tripId: string,
  mediaId: string,
): Promise<MediaActionResult | void> {
  // currentUserId + ownsTrip Check
  // media.isHighlight invertieren
  // revalidatePath(`/trips/${tripId}`)
}
```

### A3. LocationDetailActions erweitern

In `src/app/(dashboard)/trips/[id]/locations/[locationId]/location-detail-actions.tsx`:

- Neue Prop `isHighlight: boolean` hinzufuegen.
- Toggle-Button einfuegen (gleiche Darstellung wie in `NoteDetailActions`):
  `{isHighlight ? "★ Highlight entfernen" : "☆ Als Highlight"}`.
- Ruft `toggleLocationHighlight(tripId, locationId)` auf.
- `router.refresh()` nach Erfolg.

Aufruf in `location/[locationId]/page.tsx` anpassen — `isHighlight={location.isHighlight}` als Prop uebergeben.

### A4. MediaDetailActions erweitern

In `src/app/(dashboard)/trips/[id]/media/[mediaId]/media-detail-actions.tsx`:

- Neue Props: `isHighlight: boolean`.
- Toggle-Button: `{isHighlight ? "★ Highlight entfernen" : "☆ Als Highlight"}`.
- Ruft `toggleMediaHighlight(tripId, mediaId)` auf.
- `router.refresh()` nach Erfolg.

Aufruf in `media/[mediaId]/page.tsx` anpassen — `isHighlight={media.isHighlight}` als Prop uebergeben.

---

## Teil B: Highlights-Sektion auf der Reise-Detailseite

### B1. Server Action — `getHighlights`

In `src/app/(dashboard)/trips/[id]/notes/actions.ts` oder in einer neuen Datei
`src/app/(dashboard)/trips/[id]/highlights-actions.ts` (besser, da modelluebergreifend):

```typescript
export async function getHighlights(tripId: string): Promise<{
  locations: Array<{ id: string; name: string; category: string; description: string | null }>;
  media: Array<{ id: string; thumbnailMd: string | null; originalPath: string; caption: string | null }>;
  notes: Array<{ id: string; type: string; content: string; createdAt: Date }>;
} | null>
```

- Session-/Ownership-Check
- Drei parallele Prisma-Queries:
  - `location.findMany({ where: { tripId, isHighlight: true } })`
  - `media.findMany({ where: { tripId, isHighlight: true } })`
  - `note.findMany({ where: { tripId, isHighlight: true } })`
- Sortiert nach `sortOrder` bzw. `createdAt`

### B2. Highlights-Sektion in `trips/[id]/page.tsx`

Neue Sektion zwischen "Orte" und "Bilder" (oder vor "Notizen") auf der Reise-Detailseite:

- Ueberschrift: "★ Highlights"
- Nur anzeigen wenn mindestens ein Highlight existiert (Orte, Bilder oder Notizen).
- Layout:
  - **Highlight-Orte**: Kompakte Karten mit Kategorie-Emoji, Name und ggf. Beschreibungs-Vorschau.
    Klick fuehrt zur Ort-Detailseite.
  - **Highlight-Bilder**: Mini-Galerie (max 6 Thumbnails) mit der bestehenden `Gallery`-Komponente.
  - **Highlight-Notizen**: `NoteListItem`-Karten.
- Wenn eine Kategorie leer ist (z. B. keine Highlight-Notizen), wird sie nicht angezeigt.
- Link: "Reisegeschichte ansehen →" fuehrt zu `/trips/[id]/story`.

---

## Teil C: Reisegeschichte (Story-Ansicht)

### C1. Server Action — `getStoryData`

In `src/app/(dashboard)/trips/[id]/story/actions.ts`:

```typescript
export async function getStoryData(tripId: string): Promise<StoryData | null>
```

Laedt alle Daten fuer die Story-Ansicht in einem Aufruf:

```typescript
type StoryDay = {
  day: TripDay;
  locations: Array<Location & { noteCount: number }>;
  media: Array<{ id: string; thumbnailMd: string | null; thumbnailLg: string | null;
                  originalPath: string; caption: string | null; isHighlight: boolean;
                  takenAt: Date | null; latitude: number | null; longitude: number | null }>;
  notes: Array<{ id: string; type: string; content: string;
                  isHighlight: boolean; createdAt: Date }>;
};

type StoryData = {
  trip: { id: string; title: string; description: string | null;
          startDate: Date | null; endDate: Date | null; status: string;
          coverImageId: string | null };
  days: StoryDay[];
  unassignedMedia: Array</* gleicher Media-Typ wie oben */>;
  unassignedNotes: Array</* gleicher Note-Typ wie oben */>;
};
```

- Session-/Ownership-Check.
- Trip mit allen TripDays laden (sortiert nach `sortOrder`).
- Pro Tag: zugehoerige Locations, Media und Notes laden.
- Zusaetzlich: Media und Notes ohne Tag-Zuordnung (`tripDayId = null`) als "unassigned".

### C2. Story-Seite — `src/app/(dashboard)/trips/[id]/story/page.tsx`

Server-Komponente. Seitentitel: "Reisegeschichte — {Reise-Titel}".

**Layout und Struktur:**

```
┌──────────────────────────────────────────────────┐
│  Breadcrumb: Reisen / {Reise} / Reisegeschichte  │
├──────────────────────────────────────────────────┤
│  Hero-Bereich:                                   │
│  - Titelbild (falls vorhanden, volle Breite)     │
│  - Reise-Titel gross                             │
│  - Zeitraum, Statistiken                         │
│  - Beschreibung                                  │
├──────────────────────────────────────────────────┤
│  Tag 1 — Datum                                   │
│  ┌────────────────────────────────────────────┐  │
│  │ Tages-Header (Titel, Route, Strecke)       │  │
│  ├────────────────────────────────────────────┤  │
│  │ Tagesnotiz (dailyNote, falls vorhanden)    │  │
│  ├────────────────────────────────────────────┤  │
│  │ Highlights dieses Tages (goldener Rand):   │  │
│  │ - Highlight-Orte als kompakte Karten       │  │
│  │ - Highlight-Bilder gross dargestellt        │  │
│  │ - Highlight-Notizen hervorgehoben           │  │
│  ├────────────────────────────────────────────┤  │
│  │ Besuchte Orte (Karten mit Emoji + Name)    │  │
│  ├────────────────────────────────────────────┤  │
│  │ Notizen des Tages                          │  │
│  ├────────────────────────────────────────────┤  │
│  │ Bilder-Galerie des Tages                   │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  Tag 2 — Datum                                   │
│  (gleiche Struktur)                              │
│  ...                                             │
│                                                  │
│  (Optional: "Weitere Eindrücke" falls            │
│   unassigned Media/Notes existieren)             │
├──────────────────────────────────────────────────┤
│  Karte mit allen Orten der Reise                 │
│  (bestehende TripMap-Komponente)                 │
└──────────────────────────────────────────────────┘
```

**Design-Vorgaben:**

- `max-w-4xl` (etwas breiter als die ueblichen `max-w-3xl` Seiten fuer Magazine-Feeling).
- Highlight-Elemente bekommen einen goldenen/bernsteinfarbenen linken Rand:
  `border-l-4 border-amber-400` und einen dezenten Hintergrund `bg-amber-400/5`.
- Bilder: Highlight-Bilder einzeln in voller Breite (`max-w-4xl`), normale Bilder als
  Gallery-Grid (2–3 Spalten).
- Notiz-Texte: `whitespace-pre-wrap`, laengere Texte komplett anzeigen (kein Truncate in der Story).
- Orte: Kompakte Karten mit Emoji + Name + Kategorie-Badge. Verlinkt zur Ort-Detailseite.
- Tagesnotiz (`dailyNote` aus TripDay): Kursiv oder in einer separaten Zitat-Box dargestellt.
- Leere Tage (keine Orte, keine Bilder, keine Notizen): Zeile mit "Reisetag ohne Eintraege" und Link "Inhalte hinzufuegen".
- Sektion "Weitere Eindrücke" am Ende: Nur anzeigen wenn unzugeordnete Bilder oder Notizen existieren.
- Am Ende: `TripMap` mit allen Orten der Reise.

### C3. Story-Komponenten

Falls die Story-Seite zu gross wird, in Unter-Komponenten aufteilen:

- `src/components/story/story-day-section.tsx` — Rendert einen einzelnen Tag
- `src/components/story/story-highlight-card.tsx` — Rendert ein Highlight-Element (Ort/Bild/Notiz)

Diese sind **keine** Client-Komponenten — reine Server-Komponenten.

### C4. Navigation zur Story

- **Reise-Detailseite** (`trips/[id]/page.tsx`): Button "Reisegeschichte ansehen" in der `TripActions`-Leiste
  (als `Link` mit `Button variant="secondary"`), oder im Highlights-Bereich als Link.
- **Nav-Items**: Kein Eintrag in der Hauptnavigation noetig (Story ist reise-spezifisch).

---

## Regeln

1. **Branch**: Alle Commits auf `feature/highlights-story` (von aktuellem `main`).
2. **Keine neuen Dependencies.**
3. **Prisma-Schema nicht aendern** — alle benoetigten Felder (`isHighlight`) existieren bereits.
4. **Session-/Ownership-Checks** in allen neuen Server Actions.
5. **Bestehende Komponenten wiederverwenden**: `Gallery`, `TripMap`, `NoteListItem`, `LocationListItem`, `Card`, `Badge`, `Button`.
6. **Responsive**: Story-Ansicht muss auf Smartphone gut lesbar sein (einspaltig, Bilder volle Breite).
7. **Kein `next lint`**: Nur `eslint .` und `tsc --noEmit`.

---

## Erfolgskriterien

| # | Kriterium |
|---|-----------|
| 1 | Highlight-Toggle-Button auf Ort-Detailseite |
| 2 | Highlight-Toggle-Button auf Bild-Detailseite |
| 3 | toggleLocationHighlight Server Action mit Ownership-Check |
| 4 | toggleMediaHighlight Server Action mit Ownership-Check |
| 5 | Highlights-Sektion auf Reise-Detailseite (Orte + Bilder + Notizen aggregiert) |
| 6 | Highlights-Sektion nur sichtbar wenn mindestens ein Highlight existiert |
| 7 | Story-Seite `/trips/[id]/story` mit chronologischer Tag-fuer-Tag-Ansicht |
| 8 | Hero-Bereich mit Titelbild, Titel, Zeitraum, Beschreibung |
| 9 | Highlight-Elemente visuell hervorgehoben (goldener Rand, Hintergrund) |
| 10 | Tagesnotiz (dailyNote) als Zitat/Hervorhebung dargestellt |
| 11 | Bilder in der Story (Highlight-Bilder gross, normale als Grid) |
| 12 | Notiz-Texte vollstaendig angezeigt (kein Truncate) |
| 13 | Karte mit allen Orten am Ende der Story |
| 14 | Sektion "Weitere Eindrücke" fuer unzugeordnete Inhalte |
| 15 | Link zur Story von der Reise-Detailseite |
| 16 | Responsive auf Smartphone, Tablet, Desktop |
| 17 | Session-/Ownership-Checks in allen Actions |
| 18 | Keine TS-/Lint-Fehler (`tsc --noEmit`, `eslint .`) |
| 19 | `npm run build` erfolgreich |
| 20 | Commits auf `feature/highlights-story` |

---

## Dateiuebersicht (neu / geaendert)

### Neue Dateien
- `src/app/(dashboard)/trips/[id]/highlights-actions.ts`
- `src/app/(dashboard)/trips/[id]/story/actions.ts`
- `src/app/(dashboard)/trips/[id]/story/page.tsx`
- `src/components/story/story-day-section.tsx` (optional, falls Seite zu gross)
- `src/components/story/story-highlight-card.tsx` (optional)

### Geaenderte Dateien
- `src/app/(dashboard)/trips/[id]/locations/actions.ts` — `toggleLocationHighlight` hinzufuegen
- `src/app/(dashboard)/trips/[id]/media/actions.ts` — `toggleMediaHighlight` hinzufuegen
- `src/app/(dashboard)/trips/[id]/locations/[locationId]/location-detail-actions.tsx` — Toggle-Button
- `src/app/(dashboard)/trips/[id]/locations/[locationId]/page.tsx` — `isHighlight` Prop uebergeben
- `src/app/(dashboard)/trips/[id]/media/[mediaId]/media-detail-actions.tsx` — Toggle-Button
- `src/app/(dashboard)/trips/[id]/media/[mediaId]/page.tsx` — `isHighlight` Prop uebergeben
- `src/app/(dashboard)/trips/[id]/page.tsx` — Highlights-Sektion + Link zur Story
