# Cloud-Auftrag 11: Freigabe und Veroeffentlichung

Stand: 18. Juni 2026
Branch: `feature/publication` (von `main` abzweigen)

---

## Kontext

Das Prisma-Schema definiert bereits das `Publication`-Modell mit `shareToken`, `status`
(DRAFT/PUBLISHED), `passwordHash`, `publishedAt`. Die Tabelle existiert in der Datenbank.

Es gibt eine Platzhalter-Seite unter `src/app/share/[token]/page.tsx`, die nur "noch nicht
implementiert" zeigt. Die Middleware (`src/proxy.ts`) schliesst `/share` bereits von der
Auth-Pruefung aus (Matcher-Regex enthaelt `share`).

Die Story-Ansicht (`/trips/[id]/story`) mit `StoryDaySection`, `StoryData` und den
Story-Komponenten liefert die visuelle Grundlage fuer die oeffentliche Ansicht. Die
Komponenten enthalten aber Links zu `/trips/{id}/...` (Edit-Seiten), die in der
oeffentlichen Ansicht nicht erscheinen duerfen.

Die Media-API-Route (`/api/media/[...path]`) prueft aktuell Trip-Ownership ueber die
Session. Oeffentliche Besucher haben keine Session und benoetigen einen alternativen
Zugangsweg zu den Bildern.

---

## Teil A: Publication-Verwaltung (authentifiziert)

### A1. Shared Helpers — `src/lib/publications.ts`

Neue Datei (framework-agnostisch, kein Prisma-Import):

```typescript
export type PublicationStatusValue = "DRAFT" | "PUBLISHED";

export type PublicationActionResult = {
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
};

export const PUBLICATION_STATUS_LABELS: Record<PublicationStatusValue, string> = {
  DRAFT: "Entwurf",
  PUBLISHED: "Veröffentlicht",
};

export function shareUrl(token: string): string {
  // Gibt relative URL zurueck: /share/{token}
  // Die volle URL (mit Domain) wird im UI per window.location.origin gebaut.
  return `/share/${token}`;
}

export function generateShareToken(): string {
  // Kryptographisch sicherer, URL-freundlicher Token (nanoid-Stil).
  // Implementierung: crypto.randomBytes(18).toString("base64url")
  // oder crypto.randomUUID() — Hauptsache eindeutig und schwer zu erraten.
}
```

### A2. Server Actions — `src/app/(dashboard)/trips/[id]/publication/actions.ts`

`"use server"`, mit den ueblichen `currentUserId()` / `ownsTrip()` Hilfsfunktionen.

| Action | Beschreibung |
|--------|-------------|
| `createPublication(tripId, formData)` | Neue Freigabe erstellen. FormData: `title` (default: Reise-Titel). Token via `generateShareToken()`. Status: DRAFT. Optional: `password` — wenn gesetzt, mit bcrypt hashen. Nur eine aktive Publication pro Trip erlauben (oder mehrere — einfachheitshalber max. 1). Ownership-Check. |
| `updatePublication(tripId, publicationId, formData)` | Titel und Passwort aendern. Wenn `password` leer/entfernt, `passwordHash = null` setzen. |
| `publishPublication(tripId, publicationId)` | Status auf PUBLISHED setzen, `publishedAt = new Date()`. |
| `unpublishPublication(tripId, publicationId)` | Status zurueck auf DRAFT setzen. |
| `deletePublication(tripId, publicationId)` | Publication loeschen. |
| `getPublication(tripId)` | Die Publication dieser Reise laden (oder null). |

### A3. Freigabe-Verwaltungsseite — `src/app/(dashboard)/trips/[id]/publication/page.tsx`

Server-Komponente. Zwei Zustaende:

**Keine Publication vorhanden:**
- Card mit Erklaerungstext: "Teilen Sie Ihren Reisebericht mit anderen. Ein nicht gelisteter
  Link wird erzeugt, den nur Personen mit dem Link oeffnen koennen."
- Button "Freigabe erstellen"
- Formular (initial versteckt oder direkt sichtbar):
  - Titel (Textfeld, vorausgefuellt mit Reise-Titel)
  - Passwort (optional, Textfeld)
  - Erstellen-Button

**Publication vorhanden:**
- Status-Badge (Entwurf / Veroeffentlicht)
- Share-Link (vollstaendige URL, klickbar, mit Kopieren-Button)
- Vorschau-Link zum Pruefen des Berichts
- Buttons:
  - "Veroeffentlichen" (wenn DRAFT) oder "Zurueckziehen" (wenn PUBLISHED)
  - "Bearbeiten" (Titel/Passwort aendern)
  - "Loeschen" (mit ConfirmDialog)
- Wenn Passwort gesetzt: Hinweis "Passwortgeschuetzt"
- Info-Text: "Im Entwurfsmodus ist der Bericht nur fuer Sie sichtbar."

### A4. Kopieren-Button — `src/components/ui/copy-button.tsx`

Client-Komponente (`"use client"`):

- Zeigt einen Button mit einem Kopier-Icon.
- Bei Klick: `navigator.clipboard.writeText(text)`.
- Kurze Rueckmeldung: Button-Text wechselt fuer 2 Sekunden zu "Kopiert!" (oder Haekchen-Icon).
- Props: `text: string`, `label?: string`.

### A5. Integration in die Reise-Detailseite

In `src/app/(dashboard)/trips/[id]/page.tsx`:

- Neuer Button in der `TripActions`-Leiste: "Freigabe verwalten" (Link zu `/trips/[id]/publication`).
- Wenn eine veroeffentlichte Publication existiert: Kleines Badge/Hinweis unter dem Reise-Titel
  (z. B. "Oeffentlich geteilt" mit Link-Icon).

---

## Teil B: Oeffentliche Share-Ansicht (unauthentifiziert)

### B1. Oeffentliche Daten-Ladung — `src/app/share/[token]/actions.ts`

`"use server"`. Keine Session-Pruefung (oeffentlich), stattdessen Token-basierte Autorisierung.

```typescript
export async function getPublicStoryData(token: string): Promise<PublicStoryData | null>
```

- Publication ueber `shareToken` laden.
- Pruefen: Status muss `PUBLISHED` sein (DRAFT → null zurueckgeben).
- Trip laden (inkl. Pruefung `deletedAt = null`).
- Gleiche Datenstruktur wie `getStoryData()` aus `story/actions.ts` erzeugen — aber
  **ohne Session-/Ownership-Check** (der Token ist die Autorisierung).
- Zusaetzlich zurueckgeben: `publication` (Titel, Status, ob Passwort gesetzt).

```typescript
export async function checkPublicationPassword(
  token: string,
  password: string,
): Promise<{ valid: boolean }>
```

- Publication laden, passwordHash mit bcrypt vergleichen.
- Bei Erfolg: ein signiertes Cookie setzen (`share-access-{token}`) mit `httpOnly`, `sameSite: lax`,
  `maxAge: 7 Tage`. Dafuer `cookies()` aus `next/headers` verwenden.
- Bei Fehler: `{ valid: false }`.

### B2. Oeffentliche Share-Seite — `src/app/share/[token]/page.tsx`

Ersetzt die Platzhalter-Seite komplett. Server-Komponente.

**Ablauf:**

1. `getPublicStoryData(token)` aufrufen.
2. Falls null → `notFound()`.
3. Falls Passwort gesetzt:
   - Cookie `share-access-{token}` pruefen (via `cookies()`).
   - Wenn Cookie fehlt oder ungueltig → Passwort-Formular anzeigen (`SharePasswordForm`).
4. Story rendern — gleiche Struktur wie `/trips/[id]/story`, aber:
   - Kein Breadcrumb / Dashboard-Navigation.
   - Kein "Bearbeiten"-, "Loeschen"-, "Highlight"-Buttons.
   - Eigenes, minimales Layout (kein Dashboard-Layout, da `/share` ausserhalb von `(dashboard)` liegt).
   - Bilder-URLs zeigen auf `/api/media/...?token={shareToken}` (siehe Teil C).
   - Einfacher Footer: "Erstellt mit Reisebericht" und Datum der Veroeffentlichung.

### B3. Oeffentliches Layout — `src/app/share/layout.tsx`

Minimales Layout ohne Sidebar/Header:

```tsx
export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
```

### B4. Passwort-Formular — `src/app/share/[token]/share-password-form.tsx`

Client-Komponente (`"use client"`):

- Zentrierte Card mit Schloss-Icon, Titel "Passwortgeschuetzter Reisebericht".
- Passwort-Input + Submit-Button.
- Ruft `checkPublicationPassword` Server Action auf.
- Bei Erfolg: `router.refresh()` (Cookie wurde gesetzt, Seite rendert nun die Story).
- Bei Fehler: Fehlermeldung "Falsches Passwort".

### B5. Story-Komponenten im Read-Only-Modus

Die bestehenden Komponenten muessen im oeffentlichen Modus **ohne interaktive Links** funktionieren.

**Option (bevorzugt): `readOnly`-Prop**

`StoryDaySection` und `LocationListItem` bekommen eine optionale Prop `readOnly?: boolean`:

- `StoryDaySection`: Wenn `readOnly`, werden die `<Link>`-Elemente (Tag-Titel,
  "Inhalte hinzufuegen") durch einfache `<span>`- oder `<div>`-Elemente ersetzt.
  `HighlightImage` wird ohne Link gerendert.
- `LocationListItem`: Wenn `readOnly`, wird der aeussere `<Link>` durch ein `<div>` ersetzt.
  Die Karte bleibt visuell gleich, aber ohne Klick-Navigation.
- `Gallery`: Bleibt unveraendert (Lightbox funktioniert auch oeffentlich).

Die `readOnly`-Prop nur bei Bedarf hinzufuegen — **keine funktionale Aenderung** im
authentifizierten Modus (Default: `readOnly = false`).

---

## Teil C: Media-Zugang fuer oeffentliche Besucher

### C1. Media-API-Route erweitern — `src/app/api/media/[...path]/route.ts`

Die bestehende Route erhaelt eine zweite Autorisierungspruefung:

```
Ablauf:
1. Session pruefen → wenn eingeloggt UND Trip-Owner → Zugang (wie bisher).
2. Wenn nicht eingeloggt ODER nicht Owner:
   → Query-Param `token` pruefen.
   → Publication mit diesem Token laden, Status muss PUBLISHED sein.
   → Publication muss zum Trip gehoeren (tripId aus dem Pfad).
   → Wenn Passwort gesetzt: Cookie `share-access-{token}` pruefen.
   → Wenn alles valide → Zugang mit oeffentlichen Cache-Headern.
3. Sonst → 403 Forbidden.
```

Wichtig:
- Cache-Header fuer oeffentliche Zugriffe: `public, max-age=86400` (1 Tag).
- Cache-Header fuer private Zugriffe bleiben: `private, max-age=3600`.
- `mediaUrl()`-Funktion in `src/lib/media.ts` erhaelt eine optionale Variante, die den Token
  anhaengt: `mediaUrl(path, { shareToken })` → `/api/media/key?token=xxx`.

---

## Teil D: Ergaenzungen

### D1. `TripMap` im oeffentlichen Modus

Die `TripMap`-Komponente funktioniert bereits ohne Auth (nur Client-seitiges MapLibre).
Popups enthalten aber Links zu Ort-Detailseiten. Wenn `readOnly`, sollen Popups nur
Name und Kategorie zeigen (ohne Link).

→ Neue Prop `readOnly?: boolean` auf `TripMap`. Im Popup: `readOnly`
→ kein `<a>`-Tag, nur Text.

### D2. Proxy/Middleware

`src/proxy.ts` — keine Aenderung noetig. `/share` ist bereits im Matcher ausgeschlossen.
`/api/media` ist ebenfalls ausgeschlossen (beginnt mit `api/`).

---

## Regeln

1. **Branch**: Alle Commits auf `feature/publication` (von aktuellem `main`).
2. **Keine neuen Dependencies**: bcrypt (`bcryptjs`) und `cookies()` aus `next/headers` sind
   bereits verfuegbar. Token-Generierung ueber `node:crypto`.
3. **Prisma-Schema nicht aendern** — Publication-Modell existiert bereits.
4. **Session-Checks**: Nur in Teil A (authentifizierte Verwaltung). Teil B prueft ueber Token/Cookie.
5. **Sicherheit**:
   - Share-Token kryptographisch sicher erzeugen (min. 18 Bytes Entropie).
   - Passwort-Hashing mit bcrypt (wie bei User-Passwort).
   - Passwort-Cookie: `httpOnly`, `secure` (in Production), `sameSite: lax`.
   - Rate-Limiting fuer Passwort-Pruefung: nicht in diesem Auftrag (spaeter).
6. **Bestehende Komponenten wiederverwenden**: Story-Komponenten, Gallery, TripMap, Card, Badge, Button.
7. **Responsive**: Oeffentliche Ansicht muss auf Smartphone/Tablet gut lesbar sein.
8. **Kein `next lint`**: Nur `eslint .` und `tsc --noEmit`.

---

## Erfolgskriterien

| # | Kriterium |
|---|-----------|
| 1 | Publication erstellen (mit automatischem Share-Token) |
| 2 | Publication bearbeiten (Titel, Passwort aendern/entfernen) |
| 3 | Veroeffentlichen (DRAFT → PUBLISHED) und Zurueckziehen (PUBLISHED → DRAFT) |
| 4 | Publication loeschen |
| 5 | Share-Link kopierbar (Kopieren-Button) |
| 6 | Freigabe-Verwaltungsseite mit Status, Link, Aktionen |
| 7 | Link zur Freigabe-Verwaltung auf Reise-Detailseite |
| 8 | Oeffentliche Story-Ansicht unter `/share/[token]` (ohne Login) |
| 9 | Passwortschutz: Formular, bcrypt-Pruefung, Cookie-basierter Zugang |
| 10 | DRAFT-Publications nicht oeffentlich zugaenglich |
| 11 | Story-Komponenten im Read-Only-Modus (keine Edit-Links) |
| 12 | TripMap im Read-Only-Modus (Popups ohne Links) |
| 13 | Bilder in der oeffentlichen Ansicht via Token-Parameter zuganglich |
| 14 | Oeffentliche Ansicht: minimales Layout ohne Dashboard-Navigation |
| 15 | Responsive auf Smartphone, Tablet, Desktop |
| 16 | Keine TS-/Lint-Fehler (`tsc --noEmit`, `eslint .`) |
| 17 | `npm run build` erfolgreich |
| 18 | Commits auf `feature/publication` |

---

## Dateiuebersicht (neu / geaendert)

### Neue Dateien
- `src/lib/publications.ts`
- `src/app/(dashboard)/trips/[id]/publication/actions.ts`
- `src/app/(dashboard)/trips/[id]/publication/page.tsx`
- `src/app/share/layout.tsx`
- `src/app/share/[token]/actions.ts`
- `src/app/share/[token]/share-password-form.tsx`
- `src/components/ui/copy-button.tsx`

### Geaenderte Dateien
- `src/app/share/[token]/page.tsx` — Platzhalter ersetzen durch oeffentliche Story
- `src/app/(dashboard)/trips/[id]/page.tsx` — Link zur Freigabe-Verwaltung
- `src/app/api/media/[...path]/route.ts` — Token-basierte Autorisierung hinzufuegen
- `src/components/story/story-day-section.tsx` — `readOnly`-Prop
- `src/components/trip/location-list-item.tsx` — `readOnly`-Prop
- `src/components/map/trip-map.tsx` — `readOnly`-Prop (Popups ohne Links)
- `src/lib/media.ts` — `mediaUrl()` mit optionalem Token-Parameter
