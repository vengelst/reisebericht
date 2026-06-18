# Cloud-Auftrag 01: Projektgeruest aufsetzen

## Ziel

Erstelle das vollstaendige Projektgeruest fuer eine Reiseplanungs- und Reisebericht-Webanwendung. Nach Abschluss soll die App starten, eine Login-Seite anzeigen und nach Anmeldung ein leeres Dashboard zeigen. Die Datenbank soll mit allen Tabellen angelegt sein.

## Arbeitsverzeichnis

`/Users/volkhardengelstadter/coding/Reisebericht`

Dort liegen bereits Planungsdokumente (Markdown-Dateien). Diese nicht veraendern oder loeschen.

## Technischer Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS 4
- **ORM:** Prisma mit PostgreSQL + PostGIS
- **Auth:** NextAuth.js v5 (Auth.js) mit Credentials Provider
- **Bildspeicher:** MinIO (S3-kompatibel), Zugriff ueber AWS SDK v3
- **Bildverarbeitung:** Sharp
- **Hintergrundjobs:** BullMQ + Redis
- **Karte:** MapLibre GL JS (noch nicht implementieren, nur Abhaengigkeit installieren)
- **Containerisierung:** Docker Compose

## Serverumgebung (vivahome.de)

Folgende Dienste laufen bereits auf dem Server und werden mitgenutzt:

- PostgreSQL auf Port 5432 (neue Datenbank `reisebericht` anlegen)
- MinIO auf Port 9000 (API) und 9001 (Console)
- Nginx auf Port 80/443 (Reverse Proxy)

Die App laeuft auf **Port 3001** (Port 3000 ist durch eine andere App belegt).

Redis (Port 6379) ist noch nicht installiert und wird im Docker Compose mitgeliefert.

## Aufgaben

### 1. Next.js-Projekt initialisieren

- Next.js 15 mit App Router und TypeScript
- Tailwind CSS 4 einrichten
- ESLint konfigurieren
- Projektstruktur wie unten beschrieben anlegen

### 2. Prisma-Schema erstellen

Erstelle das komplette Schema mit folgenden Tabellen und Beziehungen. Verwende UUIDs als Primaerschluessel. Aktiviere die PostGIS-Erweiterung.

**Tabelle user:**
- id (UUID, PK)
- email (String, unique)
- password_hash (String)
- display_name (String)
- created_at (DateTime)
- updated_at (DateTime)

**Tabelle trip:**
- id (UUID, PK)
- user_id (FK -> user)
- title (String)
- description (String, optional)
- start_date (DateTime, optional)
- end_date (DateTime, optional)
- status (Enum: PLANNING, ACTIVE, COMPLETED, ARCHIVED)
- visibility (Enum: PRIVATE, UNLISTED, PUBLIC)
- cover_image_id (FK -> media, optional)
- deleted_at (DateTime, optional, fuer Soft Delete)
- created_at, updated_at

**Tabelle trip_day:**
- id (UUID, PK)
- trip_id (FK -> trip)
- date (DateTime)
- day_number (Int)
- title (String, optional)
- start_location (String, optional)
- end_location (String, optional)
- distance_km (Decimal, optional)
- driving_minutes (Int, optional)
- daily_note (String, optional)
- sort_order (Int)
- created_at, updated_at
- Unique Constraint auf (trip_id, date)

**Tabelle location:**
- id (UUID, PK)
- trip_id (FK -> trip)
- trip_day_id (FK -> trip_day, optional)
- name (String)
- category (Enum: CITY, VILLAGE, NATURE, MONASTERY, BEACH, CAMPSITE, PARKING, ATTRACTION, ACTIVITY, OTHER)
- latitude (Float)
- longitude (Float)
- arrival_at (DateTime, optional)
- departure_at (DateTime, optional)
- rating (Int, optional, 1-5)
- description (String, optional)
- is_highlight (Boolean, default false)
- sort_order (Int)
- created_at, updated_at

**Tabelle media:**
- id (UUID, PK)
- trip_id (FK -> trip)
- trip_day_id (FK -> trip_day, optional)
- location_id (FK -> location, optional)
- type (Enum: PHOTO, VIDEO)
- original_path (String)
- thumbnail_sm (String, optional)
- thumbnail_md (String, optional)
- thumbnail_lg (String, optional)
- caption (String, optional)
- taken_at (DateTime, optional)
- latitude (Float, optional)
- longitude (Float, optional)
- exif_data (Json, optional)
- file_hash (String, optional)
- file_size_bytes (BigInt, optional)
- width (Int, optional)
- height (Int, optional)
- is_highlight (Boolean, default false)
- is_cover (Boolean, default false)
- assigned (Boolean, default false)
- sort_order (Int)
- created_at, updated_at

**Tabelle note:**
- id (UUID, PK)
- trip_id (FK -> trip)
- trip_day_id (FK -> trip_day, optional)
- location_id (FK -> location, optional)
- type (Enum: QUICK, DICTATION, REPORT)
- content (String)
- is_highlight (Boolean, default false)
- sort_order (Int)
- created_at, updated_at

**Tabelle route_import:**
- id (UUID, PK)
- trip_id (FK -> trip)
- source (Enum: GPX, KML, GOOGLE_TIMELINE, MANUAL)
- file_path (String, optional)
- distance_km (Decimal, optional)
- recorded_from (DateTime, optional)
- recorded_until (DateTime, optional)
- created_at (DateTime)

**Tabelle poi_suggestion:**
- id (UUID, PK)
- trip_id (FK -> trip)
- trip_day_id (FK -> trip_day, optional)
- name (String)
- category (String)
- latitude (Float)
- longitude (Float)
- description (String, optional)
- source (String)
- status (Enum: SUGGESTED, ACCEPTED, REJECTED)
- distance_from_route_km (Decimal, optional)
- created_at (DateTime)

**Tabelle publication:**
- id (UUID, PK)
- trip_id (FK -> trip)
- share_token (String, unique)
- title (String)
- status (Enum: DRAFT, PUBLISHED)
- password_hash (String, optional)
- published_at (DateTime, optional)
- created_at, updated_at

### 3. Auth.js (NextAuth v5) einrichten

- Credentials Provider mit E-Mail und Passwort
- Passwort-Hashing mit bcrypt
- Session-Strategie: JWT
- Geschuetztes Dashboard (Middleware)
- Login-Seite unter /login
- Seed-Script, das einen Standardbenutzer anlegt:
  - E-Mail: admin@vivahome.de
  - Passwort: changeme (gehashed speichern)

### 4. Projektstruktur

```
reisebericht/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .env.local              (gitignored)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root Layout mit Tailwind
│   │   ├── page.tsx            # Startseite (Redirect zu /login oder /dashboard)
│   │   ├── login/
│   │   │   └── page.tsx        # Login-Formular
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx      # Dashboard-Layout mit Navigation
│   │   │   └── dashboard/
│   │   │       └── page.tsx    # Uebersicht aller Reisen (erstmal leer)
│   │   └── share/
│   │       └── [token]/
│   │           └── page.tsx    # Platzhalter fuer oeffentlichen Bericht
│   ├── components/
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       └── card.tsx
│   ├── lib/
│   │   ├── db.ts               # Prisma Client Singleton
│   │   ├── auth.ts             # Auth.js Konfiguration
│   │   └── storage.ts          # MinIO-Client (Grundkonfiguration)
│   └── middleware.ts           # Auth-Schutz fuer /dashboard
├── public/
└── tests/
```

### 5. Docker Compose

```yaml
services:
  app:
    build: .
    ports:
      - "3001:3000"
    env_file: .env.local
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

Die App laeuft intern auf Port 3000 (Next.js Standard), wird aber auf dem Host auf Port 3001 gemappt.

### 6. Umgebungsvariablen (.env.example)

```
DATABASE_URL=postgresql://reisebericht:password@localhost:5432/reisebericht
NEXTAUTH_SECRET=generate-a-random-secret-here
NEXTAUTH_URL=http://localhost:3001
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=reisebericht-media
MINIO_USE_SSL=false
REDIS_URL=redis://localhost:6379
```

### 7. UI-Anforderungen

- Modernes, cleanes Design mit Tailwind CSS
- Dunkles Farbschema als Standard (mit Option fuer Hell)
- Responsive: Mobile-first
- Login-Seite: zentriertes Formular, App-Name "Reisebericht"
- Dashboard: Seitenleiste mit Navigation, Hauptbereich mit Hinweis "Noch keine Reisen vorhanden"
- Deutsche Texte in der Oberflaeche

### 8. Was NICHT Teil dieses Auftrags ist

- Keine CRUD-Operationen fuer Reisen, Tage, Orte etc.
- Keine Karten-Integration
- Keine Bild-Upload-Funktionalitaet
- Keine Freigabe-Logik
- Kein Deployment auf den Server

## Erfolgskriterien

1. `npm run dev` startet die App auf Port 3001 ohne Fehler
2. Login-Seite wird angezeigt unter /login
3. Nach Anmeldung mit admin@vivahome.de / changeme wird das Dashboard angezeigt
4. Unangemeldete Benutzer werden von /dashboard auf /login umgeleitet
5. `npx prisma db push` legt alle Tabellen korrekt an
6. `npx prisma db seed` erstellt den Standardbenutzer
7. Docker Compose startet App + Redis
8. Keine TypeScript- oder Lint-Fehler
