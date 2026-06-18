# Cloud-Auftrag 05: Reisen-CRUD

## Ziel

Die erste Geschaeftslogik implementieren: Reisen anlegen, anzeigen, bearbeiten und loeschen. Nach Abschluss kann der Benutzer Reisen verwalten und sieht sie auf dem Dashboard und einer eigenen Reisen-Uebersichtsseite.

## Arbeitsverzeichnis

`/Users/volkhardengelstadter/coding/Reisebericht`

## Git-Workflow

1. Neuen Branch erstellen: `git checkout -b feature/trips-crud`
2. Alle Aenderungen dort committen
3. Am Ende NICHT in main mergen – das pruefen wir zuerst in Cursor

## Bestehendes

- Next.js 16, TypeScript, Tailwind 4, Prisma 6, Auth.js (NextAuth v5 Beta)
- Prisma-Schema mit `Trip`-Modell existiert bereits (siehe `prisma/schema.prisma`)
- Dashboard-Layout mit Seitenleiste existiert (`src/app/(dashboard)/layout.tsx`)
- Leere Dashboard-Seite existiert (`src/app/(dashboard)/dashboard/page.tsx`)
- Navigation zeigt bereits "Reisen" als Link auf `/trips`
- UI-Komponenten: Button, Input, Card
- Auth: Session mit `user.id`, `user.email`, `user.displayName`
- Prisma Client Singleton: `src/lib/db.ts`
- Mobile Navigation fehlt (Hamburger-Menue) – wird in einem eigenen Auftrag nachgeruestet

## Aufgaben

### 1. Reisen-Uebersichtsseite `/trips`

Neue Seite: `src/app/(dashboard)/trips/page.tsx`

- Alle Reisen des angemeldeten Benutzers laden (nicht geloeschte, sortiert nach `updatedAt` absteigend)
- Darstellung als Karten-Grid (responsive: 1 Spalte mobil, 2 Tablet, 3 Desktop)
- Jede Karte zeigt:
  - Titel
  - Zeitraum (Start- bis Enddatum, formatiert auf Deutsch, z.B. "12. Jun – 28. Jun 2026")
  - Status-Badge (Planung, Aktiv, Abgeschlossen, Archiviert)
  - Sichtbarkeits-Icon (privat, nicht gelistet, oeffentlich)
  - Kurze Beschreibung (max. 2 Zeilen, abgeschnitten)
- Klick auf Karte fuehrt zu `/trips/[id]`
- Button "Neue Reise" oben rechts
- Leerer Zustand: Hinweis "Noch keine Reisen vorhanden" mit Button "Erste Reise anlegen"

### 2. Neue Reise anlegen

Neues Modal oder eigene Seite: `/trips/new`

Formular mit folgenden Feldern:
- Titel (Pflicht)
- Beschreibung (optional, mehrzeilig)
- Startdatum (optional, Datepicker)
- Enddatum (optional, Datepicker)
- Status (Dropdown: Planung, Aktiv, Abgeschlossen) – Standard: Planung
- Sichtbarkeit (Dropdown: Privat, Nicht gelistet, Oeffentlich) – Standard: Privat

Nach dem Anlegen: Weiterleitung zur Reise-Detailseite `/trips/[id]`.

Server Action oder API Route fuer das Erstellen verwenden. Die Reise wird mit der `userId` aus der Session verknuepft.

### 3. Reise-Detailseite `/trips/[id]`

Neue Seite: `src/app/(dashboard)/trips/[id]/page.tsx`

- Reise-Daten anzeigen (Titel, Beschreibung, Zeitraum, Status, Sichtbarkeit)
- Bearbeiten-Button → oeffnet Bearbeitungsformular
- Loeschen-Button → Bestaetigung → Soft Delete (deleted_at setzen)
- Statuswechsel-Buttons (z.B. "Reise starten", "Reise abschliessen")
- Platzhalter-Bereiche fuer spaetere Funktionen:
  - "Reisetage" (leer, mit Hinweis "Kommt bald")
  - "Orte" (leer)
  - "Bilder" (leer)
  - "Notizen" (leer)

### 4. Reise bearbeiten

Bearbeitungsformular (auf der Detailseite oder als eigene Seite `/trips/[id]/edit`):
- Gleiche Felder wie beim Anlegen
- Vorausgefuellt mit bestehenden Daten
- Speichern-Button → Server Action → Zurueck zur Detailseite

### 5. Reise loeschen (Soft Delete)

- Bestaetigung: "Reise wirklich loeschen?" (Dialog oder Inline-Bestaetigung)
- Soft Delete: `deleted_at` wird auf aktuelle Zeit gesetzt
- Reise verschwindet aus der Uebersicht
- Weiterleitung zu `/trips`
- Papierkorb-Ansicht ist NICHT Teil dieses Auftrags

### 6. Dashboard aktualisieren

Die bestehende Dashboard-Seite (`src/app/(dashboard)/dashboard/page.tsx`) anpassen:
- Statt "Noch keine Reisen vorhanden" (statisch): echte Daten laden
- Anzahl Reisen anzeigen
- Die letzten 3-5 Reisen als kompakte Liste oder Karten zeigen
- Link "Alle Reisen anzeigen" → `/trips`
- Falls keine Reisen: bisherigen leeren Zustand beibehalten, aber Button "Neue Reise" funktionsfaehig machen (Link auf `/trips/new`)

### 7. Server Actions / API

Alle Datenbankoperationen als Server Actions implementieren:

```typescript
// Vorgeschlagene Datei: src/app/(dashboard)/trips/actions.ts
"use server"

// createTrip(formData: FormData): Promise<Trip>
// updateTrip(id: string, formData: FormData): Promise<Trip>
// deleteTrip(id: string): Promise<void>
// getTrips(): Promise<Trip[]>
// getTrip(id: string): Promise<Trip | null>
```

Jede Action muss:
- Die Session pruefen (nur eingeloggter Benutzer)
- Die userId aus der Session verwenden
- Bei getTrip/updateTrip/deleteTrip: pruefen ob die Reise dem Benutzer gehoert
- Eingaben validieren (Zod)
- Fehlerbehandlung

### 8. Zusaetzliche UI-Komponenten

Falls noetig, neue wiederverwendbare Komponenten erstellen:
- Badge-Komponente (fuer Status und Sichtbarkeit)
- Dialog/Modal-Komponente (fuer Loeschbestaetigung)
- Textarea-Komponente (fuer Beschreibung)
- Date-Input oder einfaches Datumsfeld
- Select/Dropdown-Komponente

Alle Komponenten in `src/components/ui/` ablegen, konsistent mit dem bestehenden Design (dunkles Farbschema, CSS-Variablen).

### 9. Deutsche Texte

Alle UI-Texte auf Deutsch:
- "Neue Reise", "Reise bearbeiten", "Reise loeschen"
- "Planung", "Aktiv", "Abgeschlossen", "Archiviert"
- "Privat", "Nicht gelistet", "Oeffentlich"
- "Titel", "Beschreibung", "Startdatum", "Enddatum"
- "Speichern", "Abbrechen", "Wirklich loeschen?"
- Datumsformate auf Deutsch (z.B. "12. Jun 2026")

## Erfolgskriterien

1. `/trips` zeigt alle Reisen des Benutzers als Karten-Grid
2. "Neue Reise" fuehrt zu einem Formular, das eine Reise anlegt
3. Klick auf Reise-Karte fuehrt zur Detailseite
4. Reise kann bearbeitet werden (alle Felder)
5. Reise kann geloescht werden (Soft Delete mit Bestaetigung)
6. Dashboard zeigt aktuelle Reisendaten
7. Alle Aktionen sind auf den eingeloggten Benutzer beschraenkt
8. Keine TypeScript- oder Lint-Fehler
9. `npm run build` erfolgreich
10. Alle Seiten sind responsive (Mobile + Desktop)
11. Alle Commits auf Branch `feature/trips-crud`

## Was NICHT Teil dieses Auftrags ist

- Reisetage, Etappen, Orte, Bilder, Notizen (nur Platzhalter)
- Karten-Integration
- Freigabe-Logik
- Papierkorb-Ansicht
- Mobile Hamburger-Menue (eigener Auftrag)
- Deployment auf den Server
