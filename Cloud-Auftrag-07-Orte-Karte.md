# Cloud-Auftrag 07: Orte mit Kartenintegration

## Ziel

Orte als Unterobjekte einer Reise implementieren, inklusive interaktiver Kartenansicht mit MapLibre GL JS. Nach Abschluss kann der Benutzer Orte anlegen (per Formular oder Klick auf die Karte), bearbeiten, loeschen und auf einer Karte ansehen. Die Platzhalter-Karte "Orte – Kommt bald" auf der Reise-Detailseite wird durch eine echte Karte ersetzt.

## Arbeitsverzeichnis

`/Users/volkhardengelstadter/coding/Reisebericht`

## Git-Workflow

1. `git checkout -b feature/locations-map` (von main)
2. Alle Aenderungen dort committen
3. Am Ende NICHT in main mergen

## Bestehendes

- Prisma-Modell `Location` existiert bereits (schema.prisma)
- Felder: id, tripId, tripDayId (optional), name, category (Enum), latitude, longitude, arrivalAt, departureAt, rating, description, isHighlight, sortOrder
- LocationCategory Enum: CITY, VILLAGE, NATURE, MONASTERY, BEACH, CAMPSITE, PARKING, ATTRACTION, ACTIVITY, OTHER
- `maplibre-gl` ist bereits als Dependency installiert (^5.24.0)
- Server Actions Pattern aus trips/actions.ts und days/actions.ts als Vorlage
- Reise-Detailseite zeigt Reisetage als Zeitachse und hat Platzhalter fuer Orte
- Tag-Detailseite hat Platzhalter "Orte an diesem Tag"

## Aufgaben

### 1. Server Actions fuer Orte

Neue Datei: `src/app/(dashboard)/trips/[id]/locations/actions.ts`

Actions (alle mit Session-Pruefung + Ownership-Check):

- `getLocations(tripId: string)` – Alle Orte einer Reise, sortiert nach sortOrder
- `getLocation(tripId: string, locationId: string)` – Einzelnen Ort laden
- `getLocationsByDay(tripId: string, dayId: string)` – Orte eines bestimmten Tages
- `createLocation(tripId: string, formData: FormData)` – Ort anlegen. sortOrder automatisch.
- `updateLocation(tripId: string, locationId: string, formData: FormData)` – Ort bearbeiten
- `deleteLocation(tripId: string, locationId: string)` – Ort loeschen (Hard Delete)

Zod-Validierung:
- name: Pflicht, max 200 Zeichen
- category: Pflicht, muss ein gueltiger LocationCategory-Wert sein
- latitude: Pflicht, Zahl zwischen -90 und 90
- longitude: Pflicht, Zahl zwischen -180 und 180
- tripDayId: optional, falls angegeben: pruefen ob der Tag zur Reise gehoert
- arrivalAt: optional, gueltiger DateTime
- departureAt: optional, gueltiger DateTime
- rating: optional, ganzzahlig 1-5
- description: optional, max 5000 Zeichen
- isHighlight: optional, Boolean

### 2. Shared Types und Hilfsfunktionen

Neue Datei: `src/lib/locations.ts`

- `LocationActionResult` Typ
- `LocationFormInitial` Typ
- Kategorie-Labels auf Deutsch: Stadt, Dorf, Natur, Kloster, Strand, Stellplatz, Parkplatz, Sehenswuerdigkeit, Aktivitaet, Sonstiges
- Kategorie-Icons (einfache SVG-Icons oder Emoji als Fallback)
- Bewertungs-Formatierung (Sterne)

### 3. MapLibre-Kartenkomponente

Neue Komponente: `src/components/map/trip-map.tsx`

- Client Component ("use client")
- MapLibre GL JS mit OpenStreetMap-Tiles (kostenlos, kein API-Key noetig)
- Tile-URL: `https://tile.openstreetmap.org/{z}/{x}/{y}.png` (oder ein anderer freier Tile-Provider wie `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png`)
- Karte passt sich automatisch an die Grenzen aller Marker an (fitBounds)
- Falls keine Orte: Karte zeigt Europa als Standard
- Responsive: volle Breite, Hoehe ca. 400px Desktop, 300px Mobile
- Dunkles Karten-Theme passend zum App-Design (z.B. CartoDB Dark Matter: `https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png`)

### 4. Marker auf der Karte

- Jeder Ort wird als Marker angezeigt
- Marker-Farbe oder -Icon basierend auf der Kategorie
- Highlight-Orte bekommen einen besonderen Marker (groesser, andere Farbe)
- Klick auf Marker zeigt Popup mit:
  - Ortsname
  - Kategorie-Badge
  - Kurzbeschreibung (max 2 Zeilen)
  - Link "Details anzeigen" → `/trips/[id]/locations/[locationId]`
- Wenn Orte einem Tag zugeordnet sind: Verbindungslinie zwischen den Orten in Reihenfolge

### 5. Kartenansicht auf der Reise-Detailseite

Die Platzhalter-Karte "Orte – Kommt bald" ersetzen durch:

- Ueberschrift "Orte" mit Anzahl und Button "Ort hinzufuegen"
- Interaktive Karte mit allen Orten der Reise
- Unterhalb der Karte: Liste aller Orte, gruppiert nach Reisetag (oder "Ohne Tageszuordnung")
- Jeder Listeneintrag zeigt: Name, Kategorie-Badge, Highlight-Stern
- Klick fuehrt zur Ort-Detailseite

### 6. Ort anlegen

Seite: `/trips/[id]/locations/new`

Zwei Moeglichkeiten einen Ort hinzuzufuegen:

**a) Per Formular:**
- Name (Pflicht)
- Kategorie (Select/Dropdown)
- Breitengrad und Laengengrad (Zahlenfelder)
- Reisetag zuordnen (Dropdown mit allen Tagen der Reise, oder "Keinem Tag zugeordnet")
- Bewertung (optional, 1-5 Sterne)
- Beschreibung (optional, Textarea)
- Als Highlight markieren (Checkbox)

**b) Per Kartenklick:**
- Kleine Karte auf der "Ort hinzufuegen"-Seite
- Klick auf die Karte setzt die Koordinaten automatisch ins Formular
- Marker auf der Karte zeigt die gesetzte Position
- Position per Drag-and-Drop verschiebbar

### 7. Ort-Detailseite

Seite: `src/app/(dashboard)/trips/[id]/locations/[locationId]/page.tsx`

- Alle Felder anzeigen
- Mini-Karte mit dem einzelnen Ort
- Zugeordneter Reisetag (mit Link)
- Bewertung als Sterne
- Bearbeiten-Button
- Loeschen-Button mit Bestaetigung
- Breadcrumb: Reisen → [Reisename] → [Ortsname]
- Platzhalter fuer spaetere Funktionen: "Bilder an diesem Ort", "Notizen"
- Button "In Google Maps oeffnen" → Link zu `https://www.google.com/maps?q=LAT,LNG`

### 8. Ort bearbeiten

Seite: `/trips/[id]/locations/[locationId]/edit`

- Gleiches Formular wie beim Anlegen, vorausgefuellt
- Karte mit Marker auf aktueller Position, verschiebbar

### 9. Ort loeschen

- Bestaetigung: "[Ortsname] wirklich loeschen?"
- Hard Delete
- Zurueck zur Reise-Detailseite

### 10. Orte auf der Tag-Detailseite

Auf `/trips/[id]/days/[dayId]` den Platzhalter "Orte an diesem Tag" ersetzen durch:
- Liste der dem Tag zugeordneten Orte
- Mini-Karte mit den Tages-Orten
- Button "Ort zu diesem Tag hinzufuegen" → `/trips/[id]/locations/new?dayId=[dayId]`

### 11. Reise-Detailseite: Zusammenfassung erweitern

Zusaetzlich zur bestehenden Zusammenfassung (Tage, Strecke, Fahrzeit):
- Anzahl Orte
- Anzahl Highlights

### 12. Deutsche Texte

- Kategorie-Labels: "Stadt", "Dorf", "Natur", "Kloster", "Strand/Badeplatz", "Stellplatz", "Parkplatz", "Sehenswürdigkeit", "Aktivität", "Sonstiges"
- "Ort hinzufügen", "Ort bearbeiten", "Ort löschen"
- "Klicken Sie auf die Karte, um die Position zu setzen"
- "In Google Maps öffnen"
- "Breitengrad", "Längengrad"
- "Bewertung", "Als Highlight markieren"
- "Ohne Tageszuordnung"
- "Noch keine Orte. Fügen Sie den ersten Ort hinzu."

## Erfolgskriterien

1. Orte koennen angelegt, bearbeitet und geloescht werden
2. Karte zeigt alle Orte einer Reise mit kategorie-basierten Markern
3. Klick auf Karte setzt Koordinaten im Formular
4. Popup bei Marker-Klick mit Ortsdetails
5. Orte koennen einem Reisetag zugeordnet werden
6. Tag-Detailseite zeigt zugeordnete Orte mit Mini-Karte
7. "In Google Maps oeffnen" funktioniert
8. Karte hat dunkles Theme passend zur App
9. Alle Actions haben Session- und Ownership-Pruefung
10. Zod-Validierung fuer alle Eingaben
11. Responsive (Mobile + Desktop)
12. Keine TypeScript- oder Lint-Fehler
13. `npm run build` erfolgreich
14. Alle Commits auf Branch `feature/locations-map`

## Was NICHT Teil dieses Auftrags ist

- Bilder und Notizen (nur Platzhalter)
- Routendarstellung zwischen Orten (Linie auf der Karte)
- GPX/KML-Import
- POI-Vorschlaege / KI-Integration
- Geocoding (Adresse zu Koordinaten)
- Mobile Hamburger-Menue
