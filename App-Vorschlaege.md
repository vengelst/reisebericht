# App-Konzept: Reiseplanung und Reisebericht

## 1. Zielbild

Die Anwendung soll eine zentrale, webbasierte Plattform fuer Wohnmobilreisen werden. Sie verbindet drei Bereiche:

1. **Reise planen**: Ziele, Interessen, Reisedauer, Route und Tagesetappen festlegen.
2. **Reise dokumentieren**: Orte, gefahrene Strecke, Bilder, Notizen und Highlights unterwegs erfassen.
3. **Reise veroeffentlichen**: Nach der Rueckkehr aus den gesammelten Inhalten einen ansprechenden Reisebericht erstellen, teilen und exportieren.

Die App soll auf Smartphone, Tablet und Desktop funktionieren. Sie soll langfristig alle vergangenen und zukuenftigen Reisen verwalten koennen.

## 2. Empfohlenes Nutzungsmodell

Fuer die erste Version wird kein offenes Portal fuer beliebige Benutzer empfohlen. Sinnvoller ist:

- ein geschuetztes persoenliches Redaktionskonto fuer Planung und Bearbeitung,
- private Reisen, die nur der Besitzer sehen kann,
- nicht gelistete Freigabelinks fuer Familie und Freunde,
- optional oeffentliche, bewusst veroeffentlichte Reiseberichte,
- optional Passwortschutz fuer einzelne Freigaben.

So bleiben unveroeffentlichte Bilder, aktuelle Aufenthaltsorte und Planungen geschuetzt. Ein echtes Mehrbenutzersystem kann spaeter ergaenzt werden.

## 3. Zentrale Datenobjekte

- **Reise**: Titel, Zeitraum, Beschreibung, Status, Titelbild und Sichtbarkeit
- **Reisetag/Etappe**: Datum, Start, Ziel, Strecke, Fahrzeit und Tagesnotiz
- **Ort**: Name, Kategorie, Koordinaten, Ankunft, Abfahrt und Bewertung
- **POI**: Sehenswuerdigkeit, Stadt, Kloster, Badeplatz, Stellplatz oder Aktivitaet
- **Route**: geplante und tatsaechlich gefahrene Strecke
- **Medium**: Foto oder Video inklusive Quelle, Aufnahmezeit, GPS-Daten und Metadaten
- **Notiz**: kurzer Eintrag, Diktat, Tagesbericht oder ausformulierter Text
- **Highlight**: besonders wichtiger Ort, Moment, Bild oder Tipp
- **Veroeffentlichung**: freigegebener Webbericht oder Export einer Reise

## 4. Ansichten und Navigation

Die Anwendung sollte einen klaren Drilldown anbieten:

1. Gesamtuebersicht aller Reisen
2. Detailseite einer Reise
3. Karte, Zeitachse und Reisegeschichte
4. Reisetag oder Etappe
5. Besuchter Ort
6. Bilder, Texte, Tipps und weitere Details

Fuer eine Reise sind drei gleichwertige Darstellungen sinnvoll:

- **Karte** fuer Route, Orte und geographischen Zusammenhang
- **Zeitachse** fuer den chronologischen Ablauf
- **Reisegeschichte** fuer Bilder, Texte und Highlights

## 5. Reiseplanung

### Eingaben

- Start- und optionaler Zielort
- verfuegbare Reisetage
- maximale oder bevorzugte Tageskilometer
- Interessen, beispielsweise Staedte, Kloester, Natur, Baden oder Kultur
- bevorzugte Uebernachtungsarten
- Ruhetage und gewuenschte Aufenthaltsdauer
- zu vermeidende Strassen, Laender oder Faehrverbindungen

### Ergebnis

- Routenvorschlag mit Tagesetappen
- Tagesziele, Zwischenstopps und Uebernachtungsorte
- Kilometer und voraussichtliche Fahrzeit pro Tag
- Hinweise auf zu lange oder unrealistische Etappen
- Karte mit verschiebbaren beziehungsweise sortierbaren Zielen
- Uebergabe des naechsten Ziels an Google Maps oder eine andere Navigations-App

### Empfohlene Ausbaustufen

**Erste Stufe:** Orte manuell sammeln, per Drag-and-drop sortieren und Route sowie Tagesdaten berechnen.

**Spaetere Stufe:** Automatische Vorschlaege anhand von Interessen, Oeffnungszeiten, Wetter, Maut, Grenzbedingungen, Fahrzeugdaten und Strassenqualitaet.

Die automatische Reiseplanung ist fachlich anspruchsvoll und sollte erst aufgebaut werden, wenn die Grundfunktionen stabil sind.

## 6. Dokumentation unterwegs

- schnelle Erfassung des aktuellen Ortes
- kurze Text- oder Sprachnotiz
- mehrere Bilder gleichzeitig hochladen
- Markierung eines Moments als Highlight
- Zuordnung zu Reise, Tag und Ort
- nachtraegliche Korrektur der Zuordnung
- optional lokale Zwischenspeicherung bei schlechter Internetverbindung

Fuer Diktate sollte in der ersten Version die Spracheingabe des Betriebssystems genutzt werden. Eine spaetere KI-Funktion kann Rohnotizen gliedern, sprachlich ueberarbeiten oder zu einem Tagesbericht zusammenfassen.

## 7. Bilder und Medien

### Quellen

- Smartphone-Kamera
- Tablet oder Desktop
- weiteres Smartphone
- externe Kamera beziehungsweise importierte Dateien
- spaeter: Upload-Link, E-Mail-Postfach oder Cloud-Import

### Verarbeitung

- Originaldatei sicher speichern
- Vorschaubilder in mehreren Groessen erzeugen
- EXIF-Daten, Aufnahmezeit und GPS-Koordinaten auslesen
- moegliche Dubletten erkennen
- automatische Zuordnung zu Reisetag und Ort vorschlagen
- Bilder zunaechst in einem Eingang sammeln, wenn die Zuordnung unsicher ist

### Gestaltung

Es sollte sowohl automatische als auch manuelle Gestaltung geben:

- automatisch erzeugte Galerie oder Collage als Ausgangspunkt,
- Position, Reihenfolge und Groesse nachtraeglich veraendern,
- Bilder entfernen oder als Titelbild beziehungsweise Highlight markieren,
- Layout-Vorlagen fuer einzelne Orte und Reisetage.

Eine automatisch erzeugte Anordnung sollte gespeichert werden. Sie sollte nicht bei jedem Aufruf zufaellig wechseln, damit ein bewusst gestalteter Bericht stabil bleibt.

## 8. Standortverlauf und Route

Vorgesehen ist ein Import des Google-Standortverlaufs beziehungsweise geeigneter Exportdateien. Der Import sollte:

- Positionspunkte und besuchte Orte erkennen,
- daraus eine tatsaechlich gefahrene Route ableiten,
- Zeitraeume einer Reise zuordnen,
- mit Fotozeiten und GPS-Daten abgleichen,
- ungenaue oder falsche Zuordnungen manuell korrigierbar machen.

Die konkrete Google-Anbindung muss vor der Umsetzung anhand der dann verfuegbaren Export- und API-Moeglichkeiten technisch geprueft werden. Als robuste Basis sollte die App auch GPX-, KML- oder vergleichbare Dateiformate importieren koennen.

## 9. Reisebericht und Export

Nach Abschluss einer Reise kann aus Route, Tagesdaten, Orten, Bildern und Notizen ein Bericht erzeugt werden.

Moegliche Ergebnisse:

- responsive Webgeschichte mit Karte und Zeitachse
- privater oder oeffentlicher Freigabelink
- druckbares PDF
- ZIP-Archiv mit Bildern und strukturierten Daten
- Markdown- oder HTML-Export
- spaeter eine Vorlage fuer ein Fotobuch

Die App sollte einen Entwurfsmodus bieten, in dem Texte, Bildauswahl und Reihenfolge vor der Veroeffentlichung ueberarbeitet werden koennen.

## 10. Datenschutz und Sicherheit

- Bearbeitungsbereich nur nach Anmeldung
- standardmaessig private Reisen
- bewusste Freigabe einzelner Berichte
- aktueller Standort niemals automatisch oeffentlich anzeigen
- Originalbilder und veröffentlichte Varianten getrennt behandeln
- GPS-Daten beim Export auf Wunsch entfernen oder vergröbern
- Datensicherung und vollstaendiger Export aller eigenen Daten
- geloeschte Inhalte zunaechst in einen Papierkorb verschieben
- bei oeffentlichen Berichten Kennzeichen, Personen oder sensible Orte pruefen

## 11. Technische Richtung

Als voraussichtliche technische Grundlage bietet sich an:

- responsive Web-App beziehungsweise Progressive Web App
- React mit Next.js fuer Oberflaeche und Web-Ausgabe
- serverseitige API mit TypeScript/Node.js oder alternativ Python
- PostgreSQL mit PostGIS fuer Reisen, Orte und Geodaten
- S3-kompatibler Objektspeicher fuer Bilder und Exporte
- OpenStreetMap-basierte Kartendarstellung, beispielsweise mit MapLibre
- Hintergrundjobs fuer Bildverarbeitung, Importe und Berichtserzeugung
- einfache, sichere Anmeldung fuer den redaktionellen Bereich

Die konkrete Produktauswahl wird erst nach Klaerung von Hosting, Budget, Offline-Anforderungen und gewuenschter Unabhaengigkeit von einzelnen Anbietern festgelegt.

## 12. Empfohlener MVP

Die erste nutzbare Version sollte bewusst kleiner bleiben:

- persoenliche Anmeldung
- Reisen anlegen und bearbeiten
- Reisetage, Etappen und Orte verwalten
- Orte auf einer Karte darstellen
- Bilder hochladen und Reise, Tag oder Ort zuordnen
- Notizen und Berichte schreiben oder diktieren
- Reise als Karte, Zeitachse und Geschichte ansehen
- Highlights markieren
- einen geschuetzten oder nicht gelisteten Webbericht teilen
- responsive Bedienung auf Smartphone, Tablet und Desktop

Noch nicht Bestandteil des MVP:

- vollautomatische KI-Reiseplanung
- direkter E-Mail-Import
- permanente Live-Ortung
- komplexes Rollen- und Mehrbenutzersystem
- vollstaendige Google-Photos-Integration
- Gesichtserkennung
- professioneller Fotobuch-Export

## 13. Projektphasen

### Phase 1: Reisetagebuch

Reisen, Etappen, Orte, Karten, Bilder, Notizen, Highlights und einfache Freigabe.

### Phase 2: Import und Automatisierung

Metadaten, automatische Bildzuordnung, GPX/KML und Standortverlauf.

### Phase 3: Reiseplanung

POI-Sammlung, Tagesplanung, Sortierung, Routenkalkulation und Navigation.

### Phase 4: Bericht und Export

Redaktioneller Entwurf, Webgeschichte, PDF und weitere Exportformate.

### Phase 5: Komfort und Assistenz

Intelligente Routenvorschlaege, Textassistenz, E-Mail-Import und weitere Integrationen.

## 14. Getroffene Entscheidungen

1. **Benutzersystem:** Erstmal eine private Anwendung mit optionalen Freigaben. Die Architektur soll ein spaeteres Mehrbenutzersystem ermoeglichen, ohne es jetzt umzusetzen.
2. **Offline-Faehigkeit:** Einfache Offline-Unterstuetzung. Notizen und Fotos werden bei schlechter Verbindung lokal zwischengespeichert und spaeter synchronisiert. Eine vollstaendige Offline-Nutzung ist nicht vorgesehen.
3. **Video:** Videos werden in der ersten Version noch nicht unterstuetzt, aber das Datenmodell beruecksichtigt sie bereits fuer eine spaetere Erweiterung.
4. **Routenaufzeichnung:** Sowohl nachtraeglicher Import (GPX, KML, Google Standortverlauf) als auch automatische Aufzeichnung sind gewuenscht. Der Import hat Prioritaet und wird zuerst umgesetzt.
5. **Navigations-App:** Google Maps wird als bevorzugte Navigations-App angebunden.
6. **Fahrzeugdaten:** Die Planung beruecksichtigt keine fahrzeugspezifischen Daten wie Hoehe, Gewicht oder Umweltzonen.
7. **Hosting:** Die Anwendung wird auf einem eigenen Server beziehungsweise Homelab betrieben.
8. **Budget:** Das laufende Budget fuer Karten, Speicher, Backups und Hosting ist noch nicht festgelegt.

## 15. Naechster Planungsschritt

Als naechstes sollte aus diesem Konzept ein priorisierter Anforderungskatalog entstehen. Dabei werden alle Funktionen als Muss, Soll oder Spaeter eingestuft. Anschliessend koennen Nutzerablaeufe, Datenmodell, Seitenstruktur, Datenschutzkonzept und technische Architektur so konkretisiert werden, dass Claude daraus einzelne, pruefbare Umsetzungspakete erstellen kann.
