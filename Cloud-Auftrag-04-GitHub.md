# Cloud-Auftrag 04: GitHub Repository einrichten

## Ziel

Das Projekt in ein Git-Repository umwandeln, auf GitHub pushen und den Server (vivahome.de) fuer Git-basiertes Deployment vorbereiten.

## Arbeitsverzeichnis

`/Users/volkhardengelstadter/coding/Reisebericht`

## Voraussetzungen

- SSH-Key vorhanden: `~/.ssh/id_ed25519`
- GitHub-Benutzername: `vengelst`
- Repository-Name: `reisebericht`
- Sichtbarkeit: **privat**
- Kein `.gitconfig` vorhanden – muss eingerichtet werden
- Kein `gh` CLI installiert – muss installiert werden

## Aufgaben

### 1. Git konfigurieren

```bash
git config --global user.name "Volkhard Engelstädter"
git config --global user.email "ve@vivahome.de"
```

Den Namen bitte beim User bestaetigen lassen, falls er anders lautet.

### 2. gh CLI installieren

```bash
brew install gh
gh auth login
```

Bei `gh auth login`:
- GitHub.com
- SSH als bevorzugtes Protokoll
- Bestehenden SSH-Key (`~/.ssh/id_ed25519.pub`) verwenden
- Browser-basierte Authentifizierung

### 3. GitHub Repository erstellen

```bash
gh repo create vengelst/reisebericht --private --source=. --description "Reiseplanung und Reisebericht – Wohnmobil-App"
```

Falls das nicht funktioniert (weil noch kein Git-Repo initialisiert ist), dann manuell:

```bash
cd /Users/volkhardengelstadter/coding/Reisebericht
git init
git add .
git commit -m "Initial commit: Projektgerüst mit Next.js 16, Prisma, Auth.js"
gh repo create vengelst/reisebericht --private --push --source=.
```

### 4. .gitignore pruefen

Sicherstellen, dass folgende Eintraege in `.gitignore` vorhanden sind:

```
node_modules/
.next/
.env.local
.env
*.pem
.DS_Store
```

Die Cloud-Auftrag-Dateien (Cloud-Auftrag-*.md) und die Planungsdokumente (*.md) sollen MIT ins Repo – sie gehoeren zur Projektdokumentation.

### 5. Sinnvolle Branch-Strategie

- `main` als Hauptbranch (Production)
- Fuer jeden Cloud-Auftrag einen Feature-Branch erstellen (z.B. `feature/trips-crud`)
- Nach Pruefung in Cursor: Merge in main

### 6. Server fuer Git-Deployment vorbereiten

Auf dem Server (root@vivahome.de):

```bash
cd /opt/reisebericht
git init
git remote add origin git@github.com:vengelst/reisebericht.git
```

Dafuer muss der SSH-Key des Servers bei GitHub als Deploy Key hinterlegt werden:

```bash
# Auf dem Server pruefen ob SSH-Key existiert:
ls ~/.ssh/id_*.pub

# Falls nicht, einen erstellen (ohne Passphrase fuer automatisches Deployment):
ssh-keygen -t ed25519 -C "vivahome-deploy" -f ~/.ssh/id_ed25519 -N ""

# Public Key anzeigen:
cat ~/.ssh/id_ed25519.pub
```

Den Public Key als **Deploy Key** (Read-only) im GitHub-Repo hinterlegen:

```bash
gh repo deploy-key add ~/.ssh/id_ed25519.pub --repo vengelst/reisebericht --title "vivahome-server"
```

Oder manuell: GitHub Repo → Settings → Deploy keys → Add deploy key.

### 7. Erster Pull auf dem Server testen

```bash
cd /opt/reisebericht
git fetch origin
git checkout main
```

### 8. Verifikation

1. `gh repo view vengelst/reisebericht` zeigt das Repository
2. Auf GitHub ist das Repo mit allen Dateien sichtbar
3. Lokal: `git status` zeigt sauberen Zustand
4. Lokal: `git remote -v` zeigt `origin` auf GitHub
5. Server: `git remote -v` zeigt `origin` auf GitHub
6. Server: `git pull origin main` funktioniert

## Was NICHT Teil dieses Auftrags ist

- Keine Code-Aenderungen
- Kein CI/CD-Pipeline-Setup
- Keine GitHub Actions
- Kein automatisches Deployment (kommt spaeter)
