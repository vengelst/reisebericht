# Cloud-Auftrag 03: Infrastruktur auf vivahome.de einrichten

## Sicherheitsregeln (HOECHSTE PRIORITAET)

- **NIEMALS** bestehende Nginx-Konfigurationen anderer Apps aendern oder loeschen
- **NIEMALS** bestehende Docker-Container oder -Compose-Dateien anderer Apps stoppen oder modifizieren
- **NIEMALS** bestehende PostgreSQL-Datenbanken oder -User aendern
- **NIEMALS** bestehende MinIO-Buckets aendern oder loeschen
- **NUR** neue Eintraege hinzufuegen, neue Dateien anlegen, neue Datenbanken erstellen
- Vor jeder Aenderung an Nginx: `ls /etc/nginx/sites-enabled/` auflisten und dokumentieren was bereits vorhanden ist
- Vor jeder PostgreSQL-Aenderung: `\l` (Datenbanken) und `\du` (User) auflisten und dokumentieren
- Vor jeder Docker-Aenderung: `docker ps` auflisten und dokumentieren

## SSH-Zugang

```
ssh root@vivahome.de
```

## Arbeitsverzeichnis (lokal)

`/Users/volkhardengelstadter/coding/Reisebericht`

## Aufgaben

### 1. PostGIS installieren

PostGIS ist auf dem Server noch nicht installiert. Die Version muss zur installierten PostgreSQL-Version passen.

```bash
ssh root@vivahome.de
# Zuerst PostgreSQL-Version ermitteln:
psql --version
# Dann passendes PostGIS-Paket installieren, z.B.:
apt install postgresql-16-postgis-3
# (Version an das installierte PostgreSQL anpassen)
```

### 2. PostgreSQL: Neue Datenbank und User anlegen

Vorher den Bestand dokumentieren:

```bash
sudo -u postgres psql -c '\l'    # Vorhandene Datenbanken auflisten
sudo -u postgres psql -c '\du'   # Vorhandene User auflisten
```

Dann neue Datenbank und User anlegen:

```bash
sudo -u postgres psql <<'SQL'
CREATE USER reisebericht WITH PASSWORD 'EIN_SICHERES_PASSWORT_HIER_GENERIEREN';
CREATE DATABASE reisebericht OWNER reisebericht;
\c reisebericht
CREATE EXTENSION IF NOT EXISTS postgis;
GRANT ALL PRIVILEGES ON DATABASE reisebericht TO reisebericht;
SQL
```

Das Passwort sicher generieren (z.B. `openssl rand -base64 24`) und notieren – es wird spaeter in `.env.local` eingetragen.

### 3. MinIO: Neuen Bucket erstellen

MinIO laeuft bereits auf Port 9000 (API) und 9001 (Console).

```bash
# Pruefen ob mc (MinIO Client) installiert ist:
which mc || echo "mc nicht gefunden"

# Falls mc nicht installiert:
curl https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc
chmod +x /usr/local/bin/mc

# Alias setzen (Zugangsdaten anpassen):
mc alias set local http://localhost:9000 MINIO_ACCESS_KEY MINIO_SECRET_KEY

# Neuen Bucket erstellen:
mc mb local/reisebericht-media

# Pruefen:
mc ls local/
```

### 4. Redis installieren

Port 6379 ist laut Scan frei. Redis als Docker-Container starten:

```bash
# Vorher pruefen ob Port frei ist:
ss -tlnp | grep 6379

# Redis starten (nur auf localhost binden):
docker run -d \
  --name reisebericht-redis \
  --restart unless-stopped \
  -p 127.0.0.1:6379:6379 \
  redis:7-alpine

# Pruefen:
docker ps | grep reisebericht-redis
```

### 5. Nginx: Neuen Server-Block hinzufuegen

**WICHTIG:** Nur eine NEUE Datei anlegen. Keine bestehenden Dateien aendern.

```bash
# Vorher dokumentieren was bereits existiert:
ls -la /etc/nginx/sites-enabled/
ls -la /etc/nginx/sites-available/
```

Neue Datei anlegen:

```bash
cat > /etc/nginx/sites-available/reise.vivahome.de <<'NGINX'
server {
    listen 80;
    server_name reise.vivahome.de;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }
}
NGINX

# Symlink setzen:
ln -s /etc/nginx/sites-available/reise.vivahome.de /etc/nginx/sites-enabled/

# Konfiguration testen (MUSS erfolgreich sein bevor reload):
nginx -t

# Nur bei erfolgreichem Test:
systemctl reload nginx
```

### 6. DNS pruefen

Pruefen ob `reise.vivahome.de` als DNS-Eintrag existiert:

```bash
dig reise.vivahome.de +short
# oder
host reise.vivahome.de
```

Falls kein Eintrag vorhanden ist: Dokumentieren, dass der User einen A-Record oder CNAME fuer `reise.vivahome.de` anlegen muss, der auf die IP von vivahome.de zeigt.

### 7. HTTPS mit Certbot einrichten

Nur ausfuehren wenn DNS funktioniert:

```bash
certbot --nginx -d reise.vivahome.de
```

Falls Certbot nicht installiert ist:

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d reise.vivahome.de
```

### 8. Projekt auf den Server bringen

```bash
# Auf dem Server: Verzeichnis anlegen
mkdir -p /opt/reisebericht

# Vom lokalen Rechner: Projektdateien uebertragen (ohne node_modules und .next)
# Dieser Befehl wird LOKAL ausgefuehrt:
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='.env.local' \
  /Users/volkhardengelstadter/coding/Reisebericht/ \
  root@vivahome.de:/opt/reisebericht/

# Auf dem Server:
cd /opt/reisebericht
cp .env.example .env.local
```

Dann `.env.local` mit den echten Werten befuellen:

```
DATABASE_URL=postgresql://reisebericht:DAS_GENERIERTE_PASSWORT@localhost:5432/reisebericht
NEXTAUTH_SECRET=<mit openssl rand -base64 32 generieren>
NEXTAUTH_URL=https://reise.vivahome.de
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=<echter MinIO Access Key>
MINIO_SECRET_KEY=<echter MinIO Secret Key>
MINIO_BUCKET=reisebericht-media
MINIO_USE_SSL=false
REDIS_URL=redis://localhost:6379
```

### 9. App bauen und Datenbank initialisieren

```bash
cd /opt/reisebericht
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run build
```

### 10. App als Systemd-Service einrichten

Neue Service-Datei anlegen (KEINE bestehenden Services aendern):

```bash
cat > /etc/systemd/system/reisebericht.service <<'SERVICE'
[Unit]
Description=Reisebericht Next.js App
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/reisebericht
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=5
EnvironmentFile=/opt/reisebericht/.env.local

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable reisebericht
systemctl start reisebericht

# Status pruefen:
systemctl status reisebericht
```

### 11. Verifikation

Alle folgenden Pruefungen muessen bestehen:

```bash
# 1. App laeuft:
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/login
# Erwartung: 200

# 2. Redirect funktioniert:
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/dashboard
# Erwartung: 307

# 3. Nginx Proxy funktioniert:
curl -s -o /dev/null -w "%{http_code}" http://reise.vivahome.de/login
# Erwartung: 200 (oder 301 wenn HTTPS-Redirect)

# 4. HTTPS funktioniert (falls Certbot erfolgreich war):
curl -s -o /dev/null -w "%{http_code}" https://reise.vivahome.de/login
# Erwartung: 200

# 5. Datenbank-Tabellen vorhanden:
sudo -u postgres psql -d reisebericht -c '\dt'
# Erwartung: user, trip, trip_day, location, media, note, route_import, poi_suggestion, publication

# 6. Seed-User vorhanden:
sudo -u postgres psql -d reisebericht -c "SELECT email, display_name FROM \"user\";"
# Erwartung: admin@vivahome.de | Administrator

# 7. Redis laeuft:
docker ps | grep reisebericht-redis
# Erwartung: Container laeuft

# 8. MinIO Bucket existiert:
mc ls local/reisebericht-media
# Erwartung: Bucket wird aufgelistet
```

## Was NICHT Teil dieses Auftrags ist

- Keine Code-Aenderungen an der App
- Keine Aenderungen an bestehenden Apps, Nginx-Configs oder Docker-Containern
- Keine Aenderungen an bestehenden Datenbanken oder MinIO-Buckets
