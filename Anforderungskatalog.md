# Anforderungskatalog: Reiseplanung und Reisebericht

Stand: 18. Juni 2026

Prioritaeten:
- **Muss**: Teil des MVP (Phase 1)
- **Soll**: Zeitnah nach dem MVP
- **Spaeter**: Phase 3 und folgende

---

## 1. Authentifizierung und Benutzerverwaltung

| Prio | Anforderung |
|------|-------------|
| Muss | Persoenliche Anmeldung (ein Benutzer) |
| Muss | Geschuetzter Bearbeitungsbereich |
| Spaeter | Mehrbenutzersystem (Architektur vorbereiten, nicht umsetzen) |

## 2. Reisenverwaltung

| Prio | Anforderung |
|------|-------------|
| Muss | Reisen anlegen, bearbeiten, loeschen |
| Muss | Titel, Zeitraum, Beschreibung, Status, Titelbild |
| Muss | Sichtbarkeit pro Reise (privat, nicht gelistet, oeffentlich) |
| Muss | Uebersichtsseite aller Reisen |
| Soll | Papierkorb fuer geloeschte Inhalte |

## 3. Reisetage und Etappen

| Prio | Anforderung |
|------|-------------|
| Muss | Reisetage anlegen und bearbeiten |
| Muss | Start, Ziel, Strecke, Fahrzeit pro Etappe |
| Muss | Tagesnotiz |
| Soll | Etappen sortieren und verschieben |

## 4. Orte und POIs

| Prio | Anforderung |
|------|-------------|
| Muss | Orte anlegen mit Name, Koordinaten, Kategorie |
| Muss | Zuordnung zu Reise und Reisetag |
| Muss | Orte auf Karte darstellen |
| Soll | Ankunft, Abfahrt, Bewertung |
| Soll | POI-Kategorien (Sehenswuerdigkeit, Stellplatz, Badeplatz etc.) |
| Spaeter | POI-Datenbank mit Vorschlaegen |

## 4a. Zielvorschlaege und Tagesplanung

| Prio | Anforderung |
|------|-------------|
| Soll | Startpunkt und Zielpunkt eingeben |
| Soll | KI-gestuetzte Vorschlaege fuer sehenswerte Orte zwischen Start und Ziel |
| Soll | Kategorien: Natur, Seen, Fluesse, Staedte, Altstaedte, Kloester, Burgen etc. |
| Soll | Suchkorridor entlang der Route (ca. 20-50 km links und rechts) |
| Soll | Vorgeschlagene Orte auf Karte anzeigen |
| Soll | Vorschlaege uebernehmen, verwerfen oder anpassen |
| Soll | Daraus einen Reisetag mit Etappen und Zielen generieren |
| Spaeter | Oeffnungszeiten, Wetter und Saisonabhaengigkeiten beruecksichtigen |
| Spaeter | Mehrere Alternativrouten vorschlagen |

## 5. Karte und Route

| Prio | Anforderung |
|------|-------------|
| Muss | Kartenansicht mit Orten (OpenStreetMap, MapLibre) |
| Muss | Route zwischen Orten darstellen |
| Soll | GPX- und KML-Import fuer gefahrene Route |
| Soll | Google-Standortverlauf importieren |
| Soll | Naechstes Ziel an Google Maps uebergeben |
| Spaeter | Automatische Routenaufzeichnung und Live-Tracking |

## 6. Bilder und Medien

| Prio | Anforderung |
|------|-------------|
| Muss | Bilder hochladen (einzeln und mehrere) |
| Muss | Zuordnung zu Reise, Tag oder Ort |
| Muss | Vorschaubilder in mehreren Groessen erzeugen |
| Soll | EXIF-Daten und GPS-Koordinaten auslesen |
| Soll | Automatische Zuordnung zu Tag und Ort vorschlagen |
| Soll | Dublettenerkennung |
| Soll | Eingangsbereich fuer noch nicht zugeordnete Bilder |
| Spaeter | Video-Upload (Datenmodell jetzt schon vorbereiten) |
| Spaeter | Cloud-Import, E-Mail-Postfach |

## 7. Notizen und Texte

| Prio | Anforderung |
|------|-------------|
| Muss | Notizen schreiben und bearbeiten |
| Muss | Zuordnung zu Reise, Tag oder Ort |
| Muss | Diktat ueber Betriebssystem-Spracheingabe |
| Spaeter | KI-Textassistenz (gliedern, ueberarbeiten, zusammenfassen) |

## 8. Highlights

| Prio | Anforderung |
|------|-------------|
| Muss | Orte, Bilder oder Momente als Highlight markieren |
| Muss | Highlights in der Reiseansicht hervorheben |

## 9. Ansichten und Navigation

| Prio | Anforderung |
|------|-------------|
| Muss | Drilldown: Reisen, Reise, Tag, Ort, Details |
| Muss | Kartenansicht pro Reise |
| Muss | Zeitachse pro Reise |
| Muss | Reisegeschichte (Bilder, Texte, Highlights) |
| Muss | Responsive auf Smartphone, Tablet, Desktop |

## 10. Freigabe und Veroeffentlichung

| Prio | Anforderung |
|------|-------------|
| Muss | Nicht gelisteter Freigabelink |
| Soll | Passwortschutz fuer einzelne Freigaben |
| Soll | Entwurfsmodus vor Veroeffentlichung |
| Spaeter | PDF-Export |
| Spaeter | ZIP-Archiv, Markdown- und HTML-Export |
| Spaeter | Fotobuch-Vorlage |

## 11. Offline und Synchronisation

| Prio | Anforderung |
|------|-------------|
| Soll | Notizen und Fotos lokal zwischenspeichern |
| Soll | Bei Verbindung automatisch synchronisieren |

## 12. Datenschutz und Sicherheit

| Prio | Anforderung |
|------|-------------|
| Muss | Standardmaessig private Reisen |
| Muss | Aktueller Standort nie automatisch oeffentlich |
| Soll | GPS-Daten beim Export entfernen oder vergroebern |
| Soll | Vollstaendiger Datenexport |
| Spaeter | Pruefung auf Kennzeichen und Personen in oeffentlichen Berichten |
