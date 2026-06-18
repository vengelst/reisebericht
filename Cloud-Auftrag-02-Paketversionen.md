# Cloud-Auftrag 02: Paketversionen auf aktuelle stabile Releases aktualisieren

## Ziel

Alle Abhaengigkeiten des Projekts auf die jeweils aktuellsten stabilen Versionen aktualisieren. Beta- und Release-Candidate-Versionen muessen durch stabile Releases ersetzt werden. Nach dem Update muss die App weiterhin fehlerfrei bauen, starten und funktionieren.

## Arbeitsverzeichnis

`/Users/volkhardengelstadter/coding/Reisebericht`

## Aktueller Stand (zu ersetzen)

Die folgenden Pakete befinden sich derzeit auf veralteten oder instabilen Versionen:

| Paket | Aktuelle Version | Problem |
|-------|-----------------|---------|
| next | 15.0.3 | Veraltet |
| react | 19.0.0-rc-66855b96-20241106 | Release Candidate |
| react-dom | 19.0.0-rc-66855b96-20241106 | Release Candidate |
| next-auth | 5.0.0-beta.25 | Beta |
| tailwindcss | ^4.0.0-beta.4 | Beta |
| @tailwindcss/postcss | ^4.0.0-beta.4 | Beta |

## Aufgaben

### 1. Stabile Versionen ermitteln und installieren

Aktualisiere die folgenden Pakete auf die jeweils neueste stabile Version:

- `react` und `react-dom` → stabile React 19.x
- `next` → neuestes stabiles Next.js 15.x (oder 16.x falls verfuegbar und stabil)
- `next-auth` → neuestes stabiles v5.x (Auth.js). Falls v5 noch in Beta ist, die neueste Beta verwenden und einen Kommentar in package.json hinterlassen
- `tailwindcss` und `@tailwindcss/postcss` → stabile Tailwind CSS 4.x
- `@types/react` und `@types/react-dom` → passend zur neuen React-Version
- `eslint` und `eslint-config-next` → passend zur neuen Next.js-Version
- `prisma` und `@prisma/client` → neueste stabile Version
- `typescript` → neueste stabile Version

Aktualisiere ausserdem alle weiteren Abhaengigkeiten auf kompatible aktuelle Versionen:
- `@aws-sdk/client-s3` und `@aws-sdk/s3-request-presigner`
- `bcryptjs` und `@types/bcryptjs`
- `bullmq` und `ioredis`
- `maplibre-gl`
- `sharp`
- `zod`
- `tsx`
- `autoprefixer` und `postcss`

### 2. Breaking Changes behandeln

Nach dem Update:
- Pruefe ob sich APIs geaendert haben (insbesondere NextAuth v5, Next.js App Router, Tailwind 4)
- Passe den Code an, falls Breaking Changes vorliegen
- Beachte insbesondere:
  - Tailwind CSS 4 hat gegenueber der Beta moeglicherweise Aenderungen an der Konfiguration
  - NextAuth v5 API-Aenderungen
  - Next.js Middleware- oder Route-Handler-Aenderungen

### 3. Tailwind-Konfiguration ueberpruefen

Die aktuelle Konfiguration verwendet Tailwind 4 Beta-Syntax (`@import "tailwindcss"` und `@theme` in globals.css). Stelle sicher, dass die Syntax mit der stabilen Version kompatibel ist. Falls nicht, passe globals.css und die Tailwind-Konfiguration an.

### 4. Verifikation

Nach dem Update muessen folgende Pruefungen bestehen:

1. `npm install` ohne Fehler und ohne Peer-Dependency-Warnungen (oder nur unkritische)
2. `npx tsc --noEmit` → 0 Fehler
3. `npx next lint` → 0 Fehler
4. `npm run build` → erfolgreich
5. `npm run dev` → App startet auf Port 3001
6. Login-Seite (/login) wird korrekt angezeigt
7. Middleware-Redirect funktioniert (/dashboard → /login)
8. `npx prisma generate` → erfolgreich

### 5. Dokumentation

Schreibe ein kurzes CHANGELOG am Ende dieser Datei mit:
- Vorherige Version → Neue Version fuer jedes aktualisierte Paket
- Eventuelle Breaking Changes die behandelt wurden
- Aenderungen an der Konfiguration

## Was NICHT Teil dieses Auftrags ist

- Keine neuen Features
- Keine Aenderung an der Projektstruktur
- Keine neuen Abhaengigkeiten hinzufuegen
- Keine Aenderungen am Prisma-Schema
- Keine UI-Aenderungen (ausser wenn durch Breaking Changes erzwungen)

## CHANGELOG

Datum der Umsetzung: 2026-06-18.

### Aktualisierte Pakete

| Paket | Vorher | Nachher | Hinweis |
|-------|--------|---------|---------|
| next | 15.0.3 | ^16.2.9 | Major-Sprung; Turbopack-Build, `next lint` entfernt, `middleware`-Konvention deprecated zugunsten von `proxy` |
| react | 19.0.0-rc-66855b96-20241106 | ^19.2.7 | Stabiles React 19 |
| react-dom | 19.0.0-rc-66855b96-20241106 | ^19.2.7 | Stabiles React-DOM 19 |
| next-auth | 5.0.0-beta.25 | 5.0.0-beta.31 | Auth.js v5 ist weiterhin nur als Beta veroeffentlicht; dist-tag `latest` zeigt auf v4. Auswahl gemaess Auftrag 02, Kommentar in package.json hinterlegt |
| @auth/prisma-adapter | ^2.7.4 | ^2.11.2 | Patch/Minor; keine Code-Aenderungen |
| tailwindcss | ^4.0.0-beta.4 | ^4.3.1 | Stabile Tailwind 4 |
| @tailwindcss/postcss | ^4.0.0-beta.4 | ^4.3.1 | Stabile Tailwind 4; Konfiguration via PostCSS-Plugin unveraendert |
| @types/react | ^18.3.12 | ^19.2.17 | Auf React 19 angehoben |
| @types/react-dom | ^18.3.1 | ^19.2.3 | Auf React 19 angehoben |
| eslint | ^9.14.0 | ^9.39.4 | Letzte stabile 9er-Linie. ESLint 10 ist veroeffentlicht, aber die durch eslint-config-next 16 gebuendelten Plugins (`eslint-plugin-react`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import`) deklarieren ESLint 10 nicht in `peerDependencies` und erzeugen ERESOLVE-Warnungen. Daher die kompatible 9er-Linie |
| eslint-config-next | 15.0.3 | ^16.2.9 | An Next 16 angepasst |
| prisma | ^5.22.0 | ^6.19.3 | Letzte stabile 6er-Linie. Prisma 7 hat `datasource.url` und `previewFeatures` aus dem Schema entfernt und verlangt einen Driver-Adapter sowie `prisma.config.ts`; das verstoesst gegen "Keine neuen Abhaengigkeiten hinzufuegen" |
| @prisma/client | ^5.22.0 | ^6.19.3 | Siehe `prisma` |
| typescript | ^5.6.3 | ^6.0.3 | Stabile TypeScript 6 |
| @aws-sdk/client-s3 | ^3.658.1 | ^3.1071.0 | Aktuelles SDK v3 |
| @aws-sdk/s3-request-presigner | ^3.658.1 | ^3.1071.0 | Aktuelles SDK v3 |
| bcryptjs | ^2.4.3 | ^3.0.3 | Major-Sprung; API kompatibel fuer `hash` und `compare` |
| @types/bcryptjs | ^2.4.6 | ENTFERNT | DefinitelyTyped-Paket ist als deprecated stub markiert; bcryptjs 3 liefert eigene Typdefinitionen |
| bullmq | ^5.21.2 | ^5.79.0 | Minor-Updates |
| ioredis | ^5.4.1 | ^5.11.1 | Patch/Minor |
| maplibre-gl | ^4.7.1 | ^5.24.0 | Major-Sprung; noch keine Verwendung im Code |
| sharp | ^0.33.5 | ^0.35.1 | Minor-Updates |
| zod | ^3.23.8 | ^4.4.3 | Major-Sprung; `z.string().email()` weiterhin verfuegbar (in v4 deprecated, aber nicht entfernt). Keine Code-Aenderung noetig |
| tsx | ^4.19.2 | ^4.22.4 | Patch/Minor |
| autoprefixer | ^10.4.20 | ^10.5.0 | Patch |
| postcss | ^8.4.49 | ^8.5.15 | Patch/Minor |
| @types/node | ^22.9.0 | ^25.9.3 | An aktuelle Node-LTS angehoben |

### Behandelte Breaking Changes

1. **Next.js 16: `next lint` entfernt.** `npm run lint` wird jetzt direkt durch `eslint .` ausgefuehrt; das Skript in `package.json` wurde entsprechend angepasst.
2. **Next.js 16: Flat-Config statt `.eslintrc`.** Die alte `.eslintrc.json` wurde geloescht, eine neue `eslint.config.mjs` legt die Flat-Config an und uebernimmt `eslint-config-next`, `eslint-config-next/core-web-vitals` und `eslint-config-next/typescript`.
3. **Next.js 16: `middleware.ts` -> `proxy.ts`.** Die Datei-Konvention `middleware` ist deprecated, das identische Modul liegt jetzt als `src/proxy.ts`. Die Datei-API (Default-Export der `auth`-Wrapper-Funktion plus `config.matcher`) ist unveraendert.
4. **Next.js 16: tsconfig wird automatisch angepasst.** `jsx` wird beim ersten Build auf `react-jsx` gesetzt und `.next/dev/types/**/*.ts` wird zu `include` hinzugefuegt. Beides bleibt erhalten.
5. **bcryptjs 3.x: eigene Typen.** `@types/bcryptjs` wurde entfernt; der bestehende `import bcrypt from "bcryptjs"` funktioniert ohne Aenderung.
6. **zod 4.x: API weitgehend kompatibel.** `z.string().email()` ist in v4 zwar als deprecated markiert, bleibt aber funktional. Es wurde bewusst nicht auf `z.email()` migriert, um die UI- und Logik-Aenderungen aus Auftrag 02 herauszuhalten.
7. **NextAuth v5 Beta-Update (.25 -> .31):** Keine API-Aenderungen, die das Projekt betreffen.
8. **Tailwind 4 stabil:** Die Beta-Syntax (`@import "tailwindcss"` plus `@theme {}` in `src/app/globals.css`) ist auch in der stabilen 4er-Linie das offiziell empfohlene Format. Keine Anpassung an `globals.css`, `tailwind.config.ts` oder `postcss.config.mjs` noetig.

### Konfigurationsaenderungen

- `package.json`: Skript `lint` von `next lint` auf `eslint .` umgestellt; `@types/bcryptjs` aus `devDependencies` entfernt; `//`-Kommentar-Array dokumentiert die bewussten Versions-Pinnings (next-auth Beta, Prisma 6, ESLint 9).
- `.eslintrc.json` geloescht; neue Datei `eslint.config.mjs` (Flat-Config).
- `src/middleware.ts` umbenannt in `src/proxy.ts`.
- `tsconfig.json`: durch Next 16 automatisch auf `jsx: "react-jsx"` plus erweitertes `include` aktualisiert.

### Verifikation (alle Pruefungen bestanden)

- `npm install` ohne Peer-Dependency-Warnungen
- `npx tsc --noEmit` -> 0 Fehler
- `npm run lint` -> 0 Warnungen/Fehler
- `npm run build` -> 5 Routen + Proxy-Middleware kompiliert
- `npm run dev` -> Port 3001 erreichbar
- `GET /login` -> HTTP 200, enthaelt "Reisebericht" / "Anmelden" / "E-Mail"
- `GET /dashboard` (unauthenticated) -> HTTP 307 nach `/login?callbackUrl=%2Fdashboard`
- `npx prisma generate` -> erfolgreich (v6.19.3)
