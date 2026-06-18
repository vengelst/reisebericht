# Cloud-Auftrag 06: Reisetage und Etappen

## Ziel

Reisetage (Etappen) als Unterobjekte einer Reise implementieren. Nach Abschluss kann der Benutzer fuer jede Reise Tage anlegen, bearbeiten, loeschen und in einer Zeitachse ansehen. Die Reisetage ersetzen die Platzhalter-Karte "Reisetage – Kommt bald" auf der Reise-Detailseite.

## Arbeitsverzeichnis

`/Users/volkhardengelstadter/coding/Reisebericht`

## Git-Workflow

1. `git checkout -b feature/trip-days` (von main)
2. Alle Aenderungen dort committen
3. Am Ende NICHT in main mergen

## Bestehendes

- Prisma-Modell `TripDay` existiert bereits (siehe schema.prisma Zeile 117-141)
- Felder: id, tripId, date, dayNumber, title, startLocation, endLocation, distanceKm, drivingMinutes, dailyNote, sortOrder
- Unique Constraint auf (tripId, date)
- Reise-Detailseite existiert unter `/trips/[id]` mit Platzhalter-Karten
- Server Actions Pattern aus trips/actions.ts als Vorlage verwenden
- Shared Types Pattern aus src/lib/trips.ts als Vorlage verwenden
- UI-Komponenten: Button, Input, Card, Badge, Textarea, Select, ConfirmDialog

## Aufgaben

### 1. Server Actions fuer Reisetage

Neue Datei: `src/app/(dashboard)/trips/[id]/days/actions.ts`

Actions (alle mit Session-Pruefung + Ownership-Check auf die Reise):

- `getTripDays(tripId: string)` – Alle Tage einer Reise laden, sortiert nach `date` aufsteigend
- `getTripDay(tripId: string, dayId: string)` – Einzelnen Tag laden
- `createTripDay(tripId: string, formData: FormData)` – Tag anlegen. `dayNumber` automatisch berechnen (naechste freie Nummer). `sortOrder` automatisch setzen.
- `updateTripDay(tripId: string, dayId: string, formData: FormData)` – Tag bearbeiten
- `deleteTripDay(tripId: string, dayId: string)` – Tag loeschen (Hard Delete, kein Soft Delete fuer Tage). Nach dem Loeschen: `dayNumber` der verbleibenden Tage neu berechnen.

Zod-Validierung fuer TripDay-Formular:
- date: Pflichtfeld, gueltiges Datum, Unique innerhalb der Reise pruefen
- title: optional, max 200 Zeichen
- startLocation: optional, max 200 Zeichen
- endLocation: optional, max 200 Zeichen
- distanceKm: optional, Zahl >= 0
- drivingMinutes: optional, ganzzahlig >= 0
- dailyNote: optional, max 5000 Zeichen

### 2. Shared Types und Hilfsfunktionen

Neue Datei: `src/lib/trip-days.ts`

- `TripDayActionResult` Typ (wie TripActionResult)
- Formatierungsfunktion fuer Fahrzeit (z.B. "2 Std. 30 Min." oder "45 Min.")
- Formatierungsfunktion fuer Strecke (z.B. "234 km")
- Datumsformatierung auf Deutsch (z.B. "Donnerstag, 12. Juni 2026")

### 3. Reisetage-Liste auf der Reise-Detailseite

Die Platzhalter-Karte "Reisetage – Kommt bald" auf `/trips/[id]` durch eine echte Reisetage-Sektion ersetzen:

- Ueberschrift "Reisetage" mit Anzahl und Button "Tag hinzufuegen"
- Liste/Zeitachse der Tage, chronologisch sortiert
- Jeder Tag zeigt:
  - Tag-Nummer und Datum (z.B. "Tag 1 – Do., 12. Juni 2026")
  - Optionaler Titel
  - Start → Ziel (falls vorhanden)
  - Strecke und Fahrzeit (falls vorhanden)
  - Tagesnotiz-Vorschau (erste 2 Zeilen)
- Klick auf einen Tag fuehrt zu `/trips/[id]/days/[dayId]`
- Leerer Zustand: "Noch keine Reisetage. Fuegen Sie den ersten Tag hinzu."

### 4. Zeitachsen-Darstellung

Die Tage-Liste soll als vertikale Zeitachse dargestellt werden:
- Vertikale Linie links
- Kreise/Punkte fuer jeden Tag auf der Linie
- Tag-Karten rechts neben der Linie
- Auf Mobile: vereinfachte Darstellung ohne Linie, nur Karten untereinander
- Farbliche Hervorhebung des aktuellen Tages (falls Reise aktiv und heutiges Datum innerhalb des Zeitraums)

### 5. Tag anlegen

Seite oder Modal: `/trips/[id]/days/new`

Formular:
- Datum (Pflicht, type="date")
- Titel (optional)
- Startort (optional)
- Zielort (optional)
- Strecke in km (optional, type="number")
- Fahrzeit in Minuten (optional, type="number")
- Tagesnotiz (optional, Textarea)

Nach dem Anlegen: Zurueck zur Reise-Detailseite, Tage-Liste aktualisiert.

### 6. Tag-Detailseite

Seite: `src/app/(dashboard)/trips/[id]/days/[dayId]/page.tsx`

- Alle Felder des Tages anzeigen
- Bearbeiten-Button → `/trips/[id]/days/[dayId]/edit`
- Loeschen-Button mit Bestaetigung
- Breadcrumb: Reisen → [Reisename] → Tag X
- Platzhalter fuer spaetere Funktionen: "Orte an diesem Tag", "Bilder an diesem Tag", "Notizen"

### 7. Tag bearbeiten

Seite: `src/app/(dashboard)/trips/[id]/days/[dayId]/edit/page.tsx`

- Gleiches Formular wie beim Anlegen, vorausgefuellt
- Speichern → zurueck zur Tag-Detailseite

### 8. Tag loeschen

- Bestaetigung: "Tag X wirklich loeschen?"
- Hard Delete (Tage haben keinen Papierkorb)
- Tagnummern der verbleibenden Tage neu berechnen
- Zurueck zur Reise-Detailseite

### 9. Reise-Detailseite: Zusammenfassung aktualisieren

Auf der Reise-Detailseite zusaetzlich anzeigen:
- Anzahl Reisetage
- Gesamtstrecke (Summe aller distanceKm)
- Gesamtfahrzeit (Summe aller drivingMinutes, formatiert)

### 10. Deutsche Texte

- "Reisetage", "Tag hinzufuegen", "Tag bearbeiten", "Tag loeschen"
- "Datum", "Titel", "Startort", "Zielort", "Strecke (km)", "Fahrzeit (Minuten)"
- "Tagesnotiz"
- Wochentage und Monate auf Deutsch
- "Tag 1", "Tag 2" etc.
- "Noch keine Reisetage vorhanden."
- "Wirklich loeschen? Dieser Tag und alle zugehoerigen Daten werden unwiderruflich entfernt."

## Erfolgskriterien

1. Reisetage koennen angelegt, bearbeitet und geloescht werden
2. Zeitachse zeigt alle Tage einer Reise chronologisch
3. Tagnummern werden nach dem Loeschen automatisch neu berechnet
4. Gesamtstrecke und -fahrzeit werden auf der Reise-Detailseite angezeigt
5. Unique Constraint auf Datum pro Reise wird in der UI behandelt (Fehlermeldung)
6. Alle Actions haben Session- und Ownership-Pruefung
7. Zod-Validierung fuer alle Eingaben
8. Responsive (Mobile + Desktop)
9. Keine TypeScript- oder Lint-Fehler
10. `npm run build` erfolgreich
11. Alle Commits auf Branch `feature/trip-days`

## Was NICHT Teil dieses Auftrags ist

- Orte, Bilder, Notizen (nur Platzhalter auf der Tag-Detailseite)
- Karten-Integration
- Drag-and-Drop zum Sortieren der Tage
- Mobile Hamburger-Menue
