# Cloud-Auftrag 09: Notizen + Mobile Navigation

Stand: 18. Juni 2026
Branch: `feature/notes-mobile-nav` (von `main` abzweigen)

---

## Kontext

Das Prisma-Schema definiert bereits das `Note`-Modell mit `NoteType`-Enum (QUICK, DICTATION, REPORT) und Relationen zu Trip, TripDay und Location. Die Tabelle existiert in der Datenbank. Auf den Detailseiten von Reisen, Tagen und Orten gibt es Platzhalter-Karten mit "Notizen — Kommt bald", die ersetzt werden muessen.

Die Seitenleiste (`src/app/(dashboard)/layout.tsx`) ist auf Mobilgeraeten via `hidden md:flex` versteckt. Der mobile Header zeigt nur "Reisebericht" und "Abmelden" — es gibt **keine Navigation auf Smartphones**.

---

## Teil A: Notizen-CRUD

### A1. Shared Helpers — `src/lib/notes.ts`

Neue Datei, analog zu `src/lib/media.ts` (framework-agnostisch, kein Prisma-Import):

```typescript
export type NoteTypeValue = "QUICK" | "DICTATION" | "REPORT";

export type NoteActionResult = {
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
};

export const NOTE_TYPE_LABELS: Record<NoteTypeValue, string> = {
  QUICK: "Schnellnotiz",
  DICTATION: "Diktat",
  REPORT: "Bericht",
};

export const NOTE_TYPE_EMOJI: Record<NoteTypeValue, string> = {
  QUICK: "📝",
  DICTATION: "🎙️",
  REPORT: "📄",
};

export function noteTypeLabel(type: string): string { ... }
export function noteTypeEmoji(type: string): string { ... }
export function formatNotePreview(content: string, maxLength?: number): string { ... }
```

### A2. Server Actions — `src/app/(dashboard)/trips/[id]/notes/actions.ts`

`"use server"`, analog zu `media/actions.ts`. Gleiche `currentUserId()` / `ownsTrip()` / `dayBelongsToTrip()` / `locationBelongsToTrip()` Hilfsfunktionen.

| Action | Beschreibung |
|--------|-------------|
| `createNote(tripId, formData)` | Neue Notiz anlegen. FormData-Felder: `type` (NoteType), `content` (string, min 1 Zeichen), `tripDayId?`, `locationId?`. Zod-Validierung. `sortOrder` = max(sortOrder) + 1 innerhalb des Trips. Ownership-Check. `revalidatePath`. |
| `updateNote(tripId, noteId, formData)` | Notiz bearbeiten. Felder: `content`, `type`. Ownership-Check. |
| `deleteNote(tripId, noteId)` | Notiz loeschen. Ownership-Check. Confirm-Dialog im UI. |
| `toggleNoteHighlight(tripId, noteId)` | `isHighlight` umschalten. |
| `assignNoteToDay(tripId, noteId, tripDayId)` | Notiz einem Tag zuordnen. Ownership-Check inkl. dayBelongsToTrip. |
| `assignNoteToLocation(tripId, noteId, locationId)` | Notiz einem Ort zuordnen. Ownership-Check inkl. locationBelongsToTrip. |
| `getNotes(tripId)` | Alle Notizen einer Reise, sortiert nach sortOrder. |
| `getNotesByDay(tripId, dayId)` | Notizen eines bestimmten Tags. |
| `getNotesByLocation(tripId, locationId)` | Notizen eines bestimmten Orts. |
| `getNote(tripId, noteId)` | Einzelne Notiz laden. |

### A3. Notiz-Formular-Komponente — `src/app/(dashboard)/trips/[id]/notes/note-form.tsx`

Client-Komponente (`"use client"`):

- **Typ-Auswahl**: Drei Buttons/Tabs fuer QUICK, DICTATION, REPORT. Default: QUICK.
- **Textarea**: Fuer `content`. Bei QUICK: kompakt (3 Zeilen). Bei REPORT: groesser (8 Zeilen). Bei DICTATION: gleich wie QUICK, aber mit Mikrofon-Button.
- **Diktat-Funktion**: Web Speech API (`window.SpeechRecognition` / `webkitSpeechRecognition`). Mikrofon-Button toggelt Start/Stop. Erkannter Text wird an `content` angehaengt (nicht ersetzt). Feature-Detection: Wenn API nicht verfuegbar, Mikrofon-Button ausgegraut mit Tooltip "Spracheingabe nicht unterstuetzt". Sprache: `lang="de-DE"`.
- **Zuordnungs-Felder** (optional, via Props):
  - Dropdown `tripDayId` — befuellt mit den Tagen der Reise (Label: "Tag X — Datum").
  - Dropdown `locationId` — befuellt mit den Orten der Reise (Label: "Emoji Name").
  - Wenn `defaultTripDayId` oder `defaultLocationId` per Prop uebergeben wird, vorausgefuellt.
- **Submit**: Ruft `createNote` Server Action auf. Bei Erfolg: `redirectTo` oder `revalidatePath`.
- **Edit-Modus**: Wenn `note` als Prop uebergeben wird, vorausgefuellt und `updateNote` aufrufen.

### A4. Notiz-Uebersichtsseite — `src/app/(dashboard)/trips/[id]/notes/page.tsx`

Server-Komponente:

- Breadcrumb: Reisen / {Reise} / Notizen
- Filter-Leiste: Alle | Schnellnotizen | Diktate | Berichte (analog zu Medien-Filter)
- "Neue Notiz" Button oben rechts
- Notizen als Karten-Liste:
  - Typ-Emoji + Typ-Label als Badge
  - Vorschau des Inhalts (erste 150 Zeichen)
  - Zuordnung (Tag/Ort) als Link
  - Highlight-Stern wenn `isHighlight`
  - Erstellt-Zeitpunkt
  - Klick fuehrt zur Detailseite
- Leerzustand: "Noch keine Notizen. Halten Sie Ihre Gedanken fest."

### A5. Inline-Notiz-Formular — `src/components/notes/quick-note.tsx`

Client-Komponente fuer schnelle Notiz-Erfassung direkt auf Detail-Seiten (Trip/Day/Location):

- Kompaktes Textfeld (2 Zeilen, expandiert bei Fokus)
- Mikrofon-Button fuer Diktat (Web Speech API, gleiche Logik wie in note-form.tsx)
- "Speichern"-Button (nur sichtbar wenn Inhalt vorhanden)
- Typ wird automatisch gesetzt: QUICK bei getipptem Text, DICTATION wenn Spracheingabe verwendet
- Props: `tripId`, `tripDayId?`, `locationId?`
- Ruft `createNote` Server Action auf
- Nach erfolgreichem Speichern: Textfeld leeren, Liste aktualisiert sich via `revalidatePath`

### A6. Notiz-Detailseite — `src/app/(dashboard)/trips/[id]/notes/[noteId]/page.tsx`

Server-Komponente:

- Breadcrumb: Reisen / {Reise} / Notizen / {Typ-Label}
- Voller Inhalt der Notiz (whitespace-pre-wrap)
- Typ-Badge, Highlight-Stern, Erstellt/Aktualisiert-Zeiten
- Zuordnung (Tag/Ort) als klickbare Links
- Action-Buttons: Bearbeiten, Loeschen (mit ConfirmDialog), Highlight umschalten

### A7. Notiz-Bearbeiten-Seite — `src/app/(dashboard)/trips/[id]/notes/[noteId]/edit/page.tsx`

- Gleiche `note-form.tsx` Komponente im Edit-Modus
- Vorausgefuellt mit bestehender Notiz

### A8. Integration in bestehende Detail-Seiten

Die `PLACEHOLDER_SECTIONS` mit "Notizen — Kommt bald" auf folgenden Seiten **ersetzen**:

**`src/app/(dashboard)/trips/[id]/page.tsx`** (Reise-Detail):
- Notizen-Sektion mit:
  - Ueberschrift "Notizen ({count})"
  - `QuickNote` Inline-Formular mit `tripId`
  - Letzte 3 Notizen als kompakte Karten-Vorschau
  - Link "Alle {count} Notizen" zur Uebersichtsseite
- Die `PLACEHOLDER_SECTIONS`-Konstante und ihren Render-Block entfernen.

**`src/app/(dashboard)/trips/[id]/days/[dayId]/page.tsx`** (Tag-Detail):
- Notizen-Sektion mit:
  - `QuickNote` Inline-Formular mit `tripId` + `defaultTripDayId={day.id}`
  - Notizen dieses Tages als Liste
  - Link zur Notiz-Uebersicht (gefiltert)
- Die `PLACEHOLDER_SECTIONS`-Konstante und ihren Render-Block entfernen.

**`src/app/(dashboard)/trips/[id]/locations/[locationId]/page.tsx`** (Ort-Detail):
- Notizen-Sektion mit:
  - `QuickNote` Inline-Formular mit `tripId` + `defaultLocationId={location.id}`
  - Notizen dieses Orts als Liste
  - Link zur Notiz-Uebersicht (gefiltert)
- Die `PLACEHOLDER_SECTIONS`-Konstante und ihren Render-Block entfernen.

---

## Teil B: Mobile Navigation

### B1. Mobile-Navigation-Komponente — `src/components/layout/mobile-nav.tsx`

Client-Komponente (`"use client"`):

- **Hamburger-Button**: Drei horizontale Linien (SVG oder CSS), platziert links im mobilen Header.
- **Drawer / Slide-Over**: Von links einfahrendes Panel, ueberlagert den Inhalt.
  - Halbtransparenter Backdrop (Klick schliesst)
  - Breite: 280px
  - Gleiche `navItems` wie die Desktop-Sidebar
  - Aktiver Link hervorgehoben (via `usePathname()`)
  - Benutzer-Info (displayName, email) unten
  - "Abmelden"-Button (als `<form action={signOutAction}>`)
  - Schliessen: Klick auf Link, Klick auf Backdrop, Escape-Taste
- Animation: CSS `translate-x` Transition (300ms ease-in-out), kein zusaetzliches Paket.

### B2. Layout anpassen — `src/app/(dashboard)/layout.tsx`

- Die `signOut`-Action als separate Server Action in eine eigene Datei auslagern oder als Prop an die Client-Komponente weitergeben (Server Action als form action ist moeglich).
- Im mobilen Header (`md:hidden`):
  - Links: Hamburger-Button (oeffnet `MobileNav`)
  - Mitte: "Reisebericht" Logo
  - Rechts: bleibt leer oder optional Benutzer-Avatar
- Die `MobileNav`-Komponente im Layout einbinden.
- Die `navItems`-Definition exportieren, damit Desktop-Sidebar und Mobile-Drawer die gleiche Quelle nutzen.

---

## Regeln

1. **Branch**: Alle Commits auf `feature/notes-mobile-nav` (von aktuellem `main`).
2. **Prisma-Schema**: Nicht aendern — `Note`-Modell und `NoteType`-Enum existieren bereits.
3. **Keine neuen Dependencies**: Alles mit vorhandenen Paketen und Browser-APIs (Web Speech API) umsetzbar.
4. **Session-/Ownership-Checks**: In allen Server Actions, analog zu den bestehenden Patterns.
5. **Zod-Validierung**: Fuer `createNote` und `updateNote` (content min 1 Zeichen, type muss NoteType-Wert sein).
6. **Responsive**: Alle neuen Seiten und Komponenten muessen auf Smartphone, Tablet und Desktop funktionieren.
7. **Stil**: Bestehende Tailwind-CSS-Variablen und Komponenten (`Card`, `Button`, `Badge`, `Input`, `Textarea`, `Select`, `ConfirmDialog`) verwenden.
8. **Kein `next lint`**: Nur `eslint .` und `tsc --noEmit` als Qualitaetspruefung.

---

## Erfolgskriterien

| # | Kriterium |
|---|-----------|
| 1 | Notiz erstellen (alle drei Typen: QUICK, DICTATION, REPORT) |
| 2 | Notiz bearbeiten und loeschen |
| 3 | Zuordnung zu Reise, Tag und Ort |
| 4 | Diktat per Web Speech API (de-DE), Feature-Detection |
| 5 | Inline-QuickNote auf Reise/Tag/Ort-Detailseiten |
| 6 | Platzhalter "Notizen — Kommt bald" auf allen drei Seiten entfernt |
| 7 | Notiz-Uebersichtsseite mit Filter |
| 8 | Highlight-Toggle auf Notizen |
| 9 | Hamburger-Menue auf Mobilgeraeten sichtbar |
| 10 | Slide-Over-Drawer mit Navigation und aktiver Link-Hervorhebung |
| 11 | Drawer schliesst bei Link-Klick, Backdrop-Klick, Escape |
| 12 | Session-/Ownership-Checks in allen Actions |
| 13 | Responsive auf Smartphone, Tablet, Desktop |
| 14 | Keine TS-/Lint-Fehler (`tsc --noEmit`, `eslint .`) |
| 15 | `npm run build` erfolgreich |
| 16 | Commits auf `feature/notes-mobile-nav` |

---

## Dateiuebersicht (neu / geaendert)

### Neue Dateien
- `src/lib/notes.ts`
- `src/app/(dashboard)/trips/[id]/notes/actions.ts`
- `src/app/(dashboard)/trips/[id]/notes/page.tsx`
- `src/app/(dashboard)/trips/[id]/notes/note-form.tsx`
- `src/app/(dashboard)/trips/[id]/notes/[noteId]/page.tsx`
- `src/app/(dashboard)/trips/[id]/notes/[noteId]/edit/page.tsx`
- `src/components/notes/quick-note.tsx`
- `src/components/layout/mobile-nav.tsx`

### Geaenderte Dateien
- `src/app/(dashboard)/layout.tsx` — Mobile-Nav einbinden, navItems exportieren
- `src/app/(dashboard)/trips/[id]/page.tsx` — Notizen-Sektion statt Platzhalter
- `src/app/(dashboard)/trips/[id]/days/[dayId]/page.tsx` — Notizen-Sektion statt Platzhalter
- `src/app/(dashboard)/trips/[id]/locations/[locationId]/page.tsx` — Notizen-Sektion statt Platzhalter
