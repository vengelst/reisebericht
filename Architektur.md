# Technische Architektur: Reiseplanung und Reisebericht

Stand: 18. Juni 2026

## Rahmenbedingungen

- Eigener Server (vivahome.de)
- Ein Benutzer (Mehrbenutzersystem architektonisch vorbereitet)
- Einfache Offline-Faehigkeit (lokales Zwischenspeichern, spaeter synchronisieren)
- PostgreSQL und MinIO bereits auf dem Server vorhanden

## Bestandsaufnahme vivahome.de

| Port | Dienst | Status |
|------|--------|--------|
| 80 | Nginx (Reverse Proxy) | vorhanden |
| 443 | Nginx (HTTPS) | vorhanden |
| 3000 | Bestehende Next.js-App | belegt |
| 5432 | PostgreSQL | vorhanden, wird mitgenutzt |
| 9000 | MinIO (S3-API) | vorhanden, wird mitgenutzt |
| 9001 | MinIO Console | vorhanden |
| 6379 | Redis | frei, muss installiert werden |
| 8080 | Tile-Server | frei, optional |

## Stack

| Schicht | Technologie | Anmerkung |
|---------|-------------|-----------|
| Frontend | React + Next.js (App Router) | SSR fuer oeffentliche Berichte, SPA fuer Redaktion |
| Karte | MapLibre GL JS + OpenStreetMap-Tiles | Kostenlos, selbst hostbar |
| Backend-API | Next.js API Routes (TypeScript) | Ein Projekt, kein separater API-Server |
| Datenbank | PostgreSQL 16 + PostGIS | Bestehende Instanz, neue Datenbank `reisebericht` |
| ORM | Prisma oder Drizzle ORM | Typsicherheit, Migrationen |
| Bildspeicher | MinIO (bestehende Instanz) | Neuer Bucket `reisebericht-media` |
| Bildverarbeitung | Sharp (Node.js) | Vorschaubilder erzeugen, EXIF auslesen |
| Auth | NextAuth.js (Credentials Provider) | Ein Benutzer, erweiterbar |
| Hintergrundjobs | BullMQ + Redis | Redis muss installiert werden |
| Reverse Proxy | Nginx (bestehend) | Neue Subdomain oder Pfad fuer die App |

## Ports und Zuordnung

| Dienst | Port | Bemerkung |
|--------|------|-----------|
| Reisebericht-App (Next.js) | **3001** | 3000 ist durch bestehende App belegt |
| PostgreSQL | 5432 | Bestehende Instanz mitnutzen |
| MinIO S3-API | 9000 | Bestehende Instanz mitnutzen |
| MinIO Console | 9001 | Bestehende Instanz |
| Redis | 6379 | Neu zu installieren |
| Tile-Server (optional) | 8080 | Spaeter bei Bedarf |

## Projektstruktur

```
reisebericht/
├── docker-compose.yml          # Nur App + Redis (DB und MinIO extern)
├── .env
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login-Seiten
│   │   ├── (dashboard)/        # Geschuetzter Bereich
│   │   │   ├── trips/          # Reisenverwaltung
│   │   │   ├── trips/[id]/     # Reise-Detail
│   │   │   ├── trips/[id]/days/
│   │   │   ├── trips/[id]/locations/
│   │   │   ├── trips/[id]/media/
│   │   │   └── trips/[id]/map/
│   │   └── share/[token]/      # Oeffentlicher Freigabelink
│   ├── components/
│   │   ├── map/                # MapLibre-Komponenten
│   │   ├── media/              # Bildergalerie, Upload
│   │   ├── timeline/           # Zeitachse
│   │   ├── story/              # Reisegeschichte
│   │   └── ui/                 # Allgemeine UI-Komponenten
│   ├── lib/
│   │   ├── db.ts               # Datenbankverbindung
│   │   ├── auth.ts             # Auth-Konfiguration
│   │   ├── storage.ts          # MinIO/S3-Zugriff
│   │   └── geo.ts              # Geodaten-Hilfsfunktionen
│   ├── api/                    # API-Routen
│   └── workers/                # BullMQ-Worker
│       ├── image-processor.ts
│       └── route-importer.ts
├── public/
└── tests/
```

## Docker Compose (vereinfacht)

Nur die App und Redis werden als Container betrieben. PostgreSQL und MinIO laufen
bereits auf dem Server und werden ueber Netzwerk angebunden.

| Container | Image | Port |
|-----------|-------|------|
| app | Node.js / Next.js | 3001 |
| redis | Redis 7 | 6379 |

PostgreSQL und MinIO werden ueber Umgebungsvariablen konfiguriert:

```
DATABASE_URL=postgresql://reisebericht:***@localhost:5432/reisebericht
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_BUCKET=reisebericht-media
REDIS_URL=redis://localhost:6379
```

## Nginx-Konfiguration

Die bestehende Nginx-Instanz erhaelt einen neuen Server-Block oder Location-Eintrag,
der Anfragen an die Reisebericht-App auf Port 3001 weiterleitet. Optionen:

- **Subdomain:** reise.vivahome.de -> localhost:3001
- **Pfad:** vivahome.de/reise -> localhost:3001

Die Subdomain-Variante ist sauberer und vermeidet Pfad-Konflikte.

## Offline-Strategie

- Service Worker cacht die App-Shell und zuletzt geladene Daten
- Neue Notizen und Fotos werden in IndexedDB zwischengespeichert
- Bei Verbindung: automatischer Sync zum Server
- Konflikte: Server gewinnt, lokale Aenderungen werden als Entwurf markiert

## Sicherheit

- Bearbeitungsbereich nur nach Anmeldung erreichbar
- Oeffentliche Berichte ueber separate Route ohne Anmeldung
- MinIO-Bucket mit eingeschraenkten Zugriffsregeln
- PostgreSQL-Benutzer mit minimalen Rechten fuer die Anwendung
- Redis nur ueber localhost erreichbar (kein externer Zugriff)
- HTTPS ueber Nginx mit Let's Encrypt
