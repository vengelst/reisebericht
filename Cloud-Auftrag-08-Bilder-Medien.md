# Cloud-Auftrag 08: Bilder und Medien

## Ziel

Bilder-Upload, Thumbnail-Erzeugung, Galerie-Ansicht und Zuordnung zu Reisen, Tagen und Orten implementieren. Bilder werden in MinIO gespeichert und ueber Sharp verarbeitet. Die Platzhalter "Bilder – Kommt bald" werden durch echte Funktionalitaet ersetzt.

## Arbeitsverzeichnis

`/Users/volkhardengelstadter/coding/Reisebericht`

## Git-Workflow

1. `git checkout -b feature/media-upload` (von main)
2. Alle Aenderungen dort committen
3. Am Ende NICHT in main mergen

## Bestehendes

- Prisma-Modell `Media` existiert (schema.prisma, Felder siehe unten)
- MinIO S3-Client ist konfiguriert (`src/lib/storage.ts`)
- Bucket `reisebericht-media` existiert auf dem Server
- `sharp` ist als Dependency installiert (^0.35.1)
- `@aws-sdk/client-s3` und `@aws-sdk/s3-request-presigner` sind installiert
- Reise-Detailseite, Tag-Detailseite und Ort-Detailseite haben Platzhalter fuer Bilder

## Media-Modell (zur Referenz)

```
id, tripId, tripDayId?, locationId?, type (PHOTO/VIDEO),
originalPath, thumbnailSm?, thumbnailMd?, thumbnailLg?,
caption?, takenAt?, latitude?, longitude?, exifData? (JSON),
fileHash?, fileSizeBytes?, width?, height?,
isHighlight, isCover, assigned, sortOrder
```

## Aufgaben

### 1. Storage-Hilfsfunktionen erweitern

`src/lib/storage.ts` erweitern:

- `uploadFile(key: string, body: Buffer, contentType: string)` – Datei in MinIO hochladen
- `deleteFile(key: string)` – Datei aus MinIO loeschen
- `getPublicUrl(key: string)` – URL fuer den Zugriff auf die Datei erzeugen. Presigned URL mit Ablaufzeit (z.B. 1 Stunde) oder oeffentliche URL je nach Bucket-Policy
- `ensureBucket()` – Bucket erstellen falls er nicht existiert (beim Start aufrufen)

Datei-Organisationsstruktur in MinIO:
```
reisebericht-media/
  trips/<tripId>/
    originals/<mediaId>.<ext>
    thumbnails/<mediaId>-sm.webp    (150x150, Cover)
    thumbnails/<mediaId>-md.webp    (600x400, Vorschau)
    thumbnails/<mediaId>-lg.webp    (1200x800, Grossansicht)
```

### 2. Bildverarbeitung mit Sharp

Neue Datei: `src/lib/image-processing.ts`

- `processImage(buffer: Buffer, mediaId: string, tripId: string)`:
  - EXIF-Daten auslesen (Aufnahmezeit, GPS-Koordinaten, Kameramodell)
  - Originalbild speichern (unter `trips/<tripId>/originals/`)
  - Drei Thumbnails erzeugen:
    - `sm`: 150x150 px, Cover-Crop, WebP
    - `md`: max 600x400 px, proportional, WebP
    - `lg`: max 1200x800 px, proportional, WebP
  - Bild-Dimensionen (width, height) ermitteln
  - SHA-256 Hash fuer Dublettenerkennung
  - Dateisgroesse
  - Alle Thumbnails in MinIO speichern
  - Ergebnis zurueckgeben (Pfade, Metadaten, EXIF)

- `deleteMediaFiles(tripId: string, mediaId: string, originalExt: string)` – Original + alle Thumbnails loeschen

### 3. Server Actions fuer Medien

Neue Datei: `src/app/(dashboard)/trips/[id]/media/actions.ts`

Actions:
- `getMedia(tripId: string)` – Alle Medien einer Reise, sortiert nach takenAt (falls vorhanden) oder createdAt
- `getMediaByDay(tripId: string, dayId: string)` – Medien eines Tages
- `getMediaByLocation(tripId: string, locationId: string)` – Medien eines Ortes
- `getMediaItem(tripId: string, mediaId: string)` – Einzelnes Medium
- `uploadMedia(tripId: string, formData: FormData)` – Ein oder mehrere Bilder hochladen. FormData enthaelt `files` (File[]) und optionale Zuordnung (`tripDayId`, `locationId`). Fuer jede Datei: Bildverarbeitung, DB-Eintrag, EXIF-basierte Zuordnungsvorschlaege.
- `updateMedia(tripId: string, mediaId: string, formData: FormData)` – Metadaten bearbeiten (caption, Zuordnung, isHighlight, isCover)
- `deleteMedia(tripId: string, mediaId: string)` – Medium loeschen (Dateien + DB-Eintrag)
- `assignMedia(tripId: string, mediaId: string, formData: FormData)` – Zuordnung zu Tag/Ort aendern, `assigned` auf true setzen
- `setTripCover(tripId: string, mediaId: string)` – Bild als Titelbild der Reise setzen

### 4. Upload-Komponente

Neue Komponente: `src/components/media/upload-zone.tsx`

- Client Component
- Drag-and-Drop-Zone oder Klick-zum-Auswaehlen
- Mehrere Dateien gleichzeitig
- Akzeptierte Formate: JPEG, PNG, WebP, HEIC
- Maximale Dateigroesse: 20 MB pro Bild
- Upload-Fortschrittsanzeige (pro Datei)
- Vorschau der ausgewaehlten Bilder vor dem Upload
- Nach erfolgreichem Upload: Seite aktualisieren

### 5. Galerie-Komponente

Neue Komponente: `src/components/media/gallery.tsx`

- Grid-Darstellung der Bilder (responsive: 2/3/4 Spalten)
- Zeigt Thumbnail-md als Vorschau
- Hover-Effekt mit Overlay (Caption, Highlight-Stern)
- Klick oeffnet Lightbox/Grossansicht (Thumbnail-lg)
- In der Lightbox: Vor/Zurueck-Navigation, Schliessen, Caption, Download-Link
- Leerer Zustand: "Noch keine Bilder. Laden Sie Fotos hoch."

### 6. Medien-Seite fuer eine Reise

Seite: `src/app/(dashboard)/trips/[id]/media/page.tsx`

- Upload-Zone oben
- Galerie mit allen Bildern der Reise
- Filter: Alle / Einem Tag zugeordnet / Einem Ort zugeordnet / Nicht zugeordnet (Eingang)
- Sortierung: Nach Aufnahmezeit / Nach Upload-Datum
- Massenaktionen sind NICHT Teil dieses Auftrags

### 7. Eingangsbereich fuer nicht zugeordnete Bilder

- Bilder mit `assigned: false` werden im "Eingang" gesammelt
- Hinweis: "X Bilder sind noch keinem Tag oder Ort zugeordnet"
- Fuer jedes nicht zugeordnete Bild: Quick-Assign (Dropdown mit Tagen und Orten)
- Falls EXIF GPS-Daten vorhanden: automatischen Zuordnungsvorschlag zum naechsten Ort anzeigen
- Falls EXIF Aufnahmezeit vorhanden: automatischen Zuordnungsvorschlag zum passenden Tag anzeigen

### 8. Bild-Detail/Bearbeitung

Seite oder Modal: `/trips/[id]/media/[mediaId]`

- Grossansicht (Thumbnail-lg)
- Metadaten: Aufnahmezeit, Kamera, Dateigroesse, Dimensionen, GPS-Koordinaten
- Bearbeitbare Felder: Caption, Tag-Zuordnung, Ort-Zuordnung, Highlight, Titelbild
- Loeschen mit Bestaetigung
- Mini-Karte falls GPS-Koordinaten vorhanden

### 9. Bilder auf Reise-/Tag-/Ort-Detailseiten

Die Platzhalter "Bilder – Kommt bald" ersetzen:

**Reise-Detailseite:**
- Kompakte Galerie (max 6 Bilder, dann "Alle X Bilder anzeigen" → `/trips/[id]/media`)
- Hinweis auf nicht zugeordnete Bilder im Eingang

**Tag-Detailseite:**
- Galerie der dem Tag zugeordneten Bilder
- Upload-Button "Bilder zu diesem Tag hochladen" (setzt tripDayId automatisch)

**Ort-Detailseite:**
- Galerie der dem Ort zugeordneten Bilder
- Upload-Button "Bilder zu diesem Ort hochladen" (setzt locationId automatisch)

### 10. Titelbild fuer Reise

- Auf der Reise-Detailseite und in der Reisen-Uebersicht: Titelbild anzeigen (falls gesetzt)
- Button "Als Titelbild verwenden" in der Galerie/Bilddetails
- Auf der Reisen-Uebersicht: Titelbild als Hintergrund der Karte

### 11. API Route fuer Bild-Auslieferung

API Route: `src/app/api/media/[...path]/route.ts`

- Liefert Bilder aus MinIO ueber die App aus (statt direkter MinIO-URL)
- Prueft Berechtigung: Nur der Besitzer oder Betrachter eines freigegebenen Berichts
- Cache-Header setzen (z.B. 1 Stunde)
- Unterstuetzt die Pfade: `originals/...`, `thumbnails/...`

### 12. Deutsche Texte

- "Bilder hochladen", "Dateien hierher ziehen oder klicken"
- "X Bilder hochgeladen", "Upload laeuft..."
- "Bildunterschrift", "Als Highlight markieren", "Als Titelbild verwenden"
- "Zuordnung", "Keinem Tag zugeordnet", "Keinem Ort zugeordnet"
- "Eingang: X Bilder ohne Zuordnung"
- "Aufnahmezeit", "Kamera", "Dateigroesse", "Abmessungen"
- "Alle X Bilder anzeigen"
- "Bild loeschen", "Bild wirklich loeschen?"

## Erfolgskriterien

1. Bilder koennen hochgeladen werden (einzeln und mehrere)
2. Drei Thumbnail-Groessen werden automatisch erzeugt (WebP)
3. EXIF-Daten werden ausgelesen (Aufnahmezeit, GPS, Kamera)
4. Bilder werden in MinIO gespeichert
5. Galerie zeigt Bilder im responsiven Grid
6. Lightbox fuer Grossansicht mit Navigation
7. Bilder koennen einem Tag und/oder Ort zugeordnet werden
8. Eingangsbereich zeigt nicht zugeordnete Bilder
9. Titelbild fuer Reise kann gesetzt werden
10. Bilder werden auf Reise-/Tag-/Ort-Detailseiten angezeigt
11. Bild-Auslieferung ueber API Route mit Berechtigungspruefung
12. Alle Actions haben Session- und Ownership-Pruefung
13. Responsive (Mobile + Desktop)
14. Keine TypeScript- oder Lint-Fehler
15. `npm run build` erfolgreich
16. Alle Commits auf Branch `feature/media-upload`

## Was NICHT Teil dieses Auftrags ist

- Video-Upload
- Massenaktionen (mehrere Bilder gleichzeitig zuordnen/loeschen)
- Bildbearbeitung (zuschneiden, drehen)
- Gesichtserkennung
- Cloud-Import / E-Mail-Import
- Automatische Collage/Layout-Erzeugung
