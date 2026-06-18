# Datenmodell: Reiseplanung und Reisebericht

Stand: 18. Juni 2026

PostgreSQL 16 + PostGIS

---

## Uebersicht der Beziehungen

```
user (1) ---- (*) trip
trip (1) ---- (*) trip_day
trip (1) ---- (*) location
trip_day (1) -- (*) location
location (1) -- (*) media
location (1) -- (*) note
trip (1) ---- (*) media         (Bilder ohne Ortzuordnung)
trip (1) ---- (*) note
trip (1) ---- (*) highlight
trip (1) ---- (*) route_import
trip (1) ---- (*) publication
trip (1) ---- (*) poi_suggestion (KI-Vorschlaege)
```

---

## Tabelle: user

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID, PK | |
| email | VARCHAR, UNIQUE | Login |
| password_hash | VARCHAR | Gehashtes Passwort |
| display_name | VARCHAR | Anzeigename |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## Tabelle: trip

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID, PK | |
| user_id | UUID, FK -> user | |
| title | VARCHAR | Reisename |
| description | TEXT | Beschreibung |
| start_date | DATE | Reisebeginn |
| end_date | DATE | Reiseende |
| status | ENUM | planning, active, completed, archived |
| visibility | ENUM | private, unlisted, public |
| cover_image_id | UUID, FK -> media, NULL | Titelbild |
| deleted_at | TIMESTAMPTZ, NULL | Papierkorb (Soft Delete) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## Tabelle: trip_day

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID, PK | |
| trip_id | UUID, FK -> trip | |
| date | DATE | Datum des Reisetags |
| day_number | INT | Laufende Nummer |
| title | VARCHAR, NULL | Optionaler Tagesname |
| start_location | VARCHAR, NULL | Startort (Text) |
| end_location | VARCHAR, NULL | Zielort (Text) |
| distance_km | DECIMAL, NULL | Gefahrene Kilometer |
| driving_minutes | INT, NULL | Fahrzeit in Minuten |
| daily_note | TEXT, NULL | Tagesnotiz |
| sort_order | INT | Reihenfolge |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

UNIQUE: (trip_id, date)

## Tabelle: location

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID, PK | |
| trip_id | UUID, FK -> trip | |
| trip_day_id | UUID, FK -> trip_day, NULL | Zuordnung zum Reisetag |
| name | VARCHAR | Ortsname |
| category | ENUM | city, village, nature, monastery, beach, campsite, parking, attraction, activity, other |
| coordinates | GEOGRAPHY(Point, 4326) | PostGIS-Punkt |
| arrival_at | TIMESTAMPTZ, NULL | Ankunft |
| departure_at | TIMESTAMPTZ, NULL | Abfahrt |
| rating | SMALLINT, NULL | Bewertung 1-5 |
| description | TEXT, NULL | Beschreibung |
| is_highlight | BOOLEAN, DEFAULT false | Als Highlight markiert |
| sort_order | INT | Reihenfolge innerhalb des Tages |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## Tabelle: media

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID, PK | |
| trip_id | UUID, FK -> trip | |
| trip_day_id | UUID, FK -> trip_day, NULL | |
| location_id | UUID, FK -> location, NULL | |
| type | ENUM | photo, video (Video im Modell vorbereitet) |
| original_path | VARCHAR | Pfad zum Original in MinIO |
| thumbnail_sm | VARCHAR, NULL | Kleines Vorschaubild |
| thumbnail_md | VARCHAR, NULL | Mittleres Vorschaubild |
| thumbnail_lg | VARCHAR, NULL | Grosses Vorschaubild |
| caption | TEXT, NULL | Bildunterschrift |
| taken_at | TIMESTAMPTZ, NULL | Aufnahmezeitpunkt |
| coordinates | GEOGRAPHY(Point, 4326), NULL | GPS aus EXIF |
| exif_data | JSONB, NULL | Weitere EXIF-Metadaten |
| file_hash | VARCHAR, NULL | Fuer Dublettenerkennung |
| file_size_bytes | BIGINT, NULL | Dateigroesse |
| width | INT, NULL | Bildbreite in Pixel |
| height | INT, NULL | Bildhoehe in Pixel |
| is_highlight | BOOLEAN, DEFAULT false | |
| is_cover | BOOLEAN, DEFAULT false | Titelbild des Ortes oder Tages |
| assigned | BOOLEAN, DEFAULT false | Zuordnung bestaetigt (vs. Eingang) |
| sort_order | INT | Reihenfolge |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## Tabelle: note

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID, PK | |
| trip_id | UUID, FK -> trip | |
| trip_day_id | UUID, FK -> trip_day, NULL | |
| location_id | UUID, FK -> location, NULL | |
| type | ENUM | quick, dictation, report |
| content | TEXT | Textinhalt |
| is_highlight | BOOLEAN, DEFAULT false | |
| sort_order | INT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## Tabelle: route_import

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID, PK | |
| trip_id | UUID, FK -> trip | |
| source | ENUM | gpx, kml, google_timeline, manual |
| file_path | VARCHAR, NULL | Originaldatei |
| geometry | GEOGRAPHY(LineString, 4326) | Importierte Route |
| recorded_from | TIMESTAMPTZ, NULL | Anfang des Aufzeichnungszeitraums |
| recorded_until | TIMESTAMPTZ, NULL | Ende des Aufzeichnungszeitraums |
| distance_km | DECIMAL, NULL | Berechnete Strecke |
| created_at | TIMESTAMPTZ | |

## Tabelle: poi_suggestion

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID, PK | |
| trip_id | UUID, FK -> trip | |
| trip_day_id | UUID, FK -> trip_day, NULL | |
| name | VARCHAR | Vorgeschlagener Ortsname |
| category | VARCHAR | Kategorie (Natur, Stadt, Kloster etc.) |
| coordinates | GEOGRAPHY(Point, 4326) | Position |
| description | TEXT, NULL | KI-generierte Beschreibung |
| source | VARCHAR | Quelle (claude, gpt, osm etc.) |
| status | ENUM | suggested, accepted, rejected |
| distance_from_route_km | DECIMAL, NULL | Entfernung von der Route |
| created_at | TIMESTAMPTZ | |

## Tabelle: publication

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID, PK | |
| trip_id | UUID, FK -> trip | |
| share_token | VARCHAR, UNIQUE | Zufaelliger Token fuer Freigabelink |
| title | VARCHAR | Titel des veroeffentlichten Berichts |
| status | ENUM | draft, published |
| password_hash | VARCHAR, NULL | Optionaler Passwortschutz |
| published_at | TIMESTAMPTZ, NULL | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

## Wichtige Indizes

- trip(user_id, status) - Reisen pro Benutzer filtern
- trip_day(trip_id, date) - Tage einer Reise chronologisch
- location(trip_id, trip_day_id) - Orte pro Reise und Tag
- media(trip_id, assigned) - Nicht zugeordnete Bilder finden
- media(file_hash) - Dublettenerkennung
- publication(share_token) - Freigabelink-Lookup
- poi_suggestion(trip_id, status) - Vorschlaege pro Reise filtern
- Raeumliche Indizes auf allen GEOGRAPHY-Spalten
