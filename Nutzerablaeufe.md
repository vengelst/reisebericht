# Nutzerablaeufe: Reiseplanung und Reisebericht

Stand: 18. Juni 2026

Prioritaeten:
- **Muss**: Teil des MVP (Phase 1)
- **Soll**: Zeitnah nach dem MVP

---

## 1. Anmelden (Muss)

```
Startseite
  -> Login-Formular
  -> E-Mail + Passwort eingeben
  -> Dashboard (Uebersicht aller Reisen)
```

## 2. Neue Reise anlegen (Muss)

```
Dashboard
  -> "Neue Reise"
  -> Titel, Zeitraum, Beschreibung eingeben
  -> Reise wird mit Status "Planung" angelegt
  -> Reise-Detailseite
```

## 3. Reisetage erfassen (Muss)

```
Reise-Detailseite
  -> "Tag hinzufuegen"
  -> Datum, Start, Ziel, Kilometer, Fahrzeit, Tagesnotiz eingeben
  -> Tag erscheint in Zeitachse und Liste
```

## 4. Ort hinzufuegen (Muss)

```
Reisetag
  -> "Ort hinzufuegen"
  -> Name eingeben oder auf Karte klicken
  -> Kategorie waehlen (Stadt, Natur, Kloster, Stellplatz ...)
  -> Ort wird dem Tag zugeordnet und auf Karte angezeigt
```

## 5. Bilder hochladen (Muss)

```
Reise, Tag oder Ort
  -> "Bilder hochladen"
  -> Dateien waehlen (einzeln oder mehrere)
  -> Upload + automatische Vorschaubilder
  -> Zuordnung zu Tag und Ort bestaetigen
    -> Falls Zuordnung unklar: Bild landet im Eingangsbereich
    -> Spaeter manuell zuordnen
```

## 6. Notiz schreiben (Muss)

```
Reise, Tag oder Ort
  -> "Notiz"
  -> Text eingeben (oder Betriebssystem-Diktat nutzen)
  -> Typ waehlen (kurz, Diktat, Bericht)
  -> Speichern
```

## 7. Highlight markieren (Muss)

```
Beliebiger Ort, Bild oder Notiz
  -> Highlight-Stern klicken
  -> Wird als Highlight in der Reisegeschichte hervorgehoben
```

## 8. Reise ansehen: drei Ansichten (Muss)

```
Reise-Detailseite -> Ansicht waehlen:

  Karte:
    Route und Orte auf der Karte
    Klickbare Marker -> Ort-Detail mit Bildern und Notizen

  Zeitachse:
    Chronologische Liste der Tage und Orte
    Klick auf Tag oder Ort -> Detail

  Geschichte:
    Bilder, Texte und Highlights als scrollbare Erzaehlung
    Highlights besonders hervorgehoben
```

## 9. Reise freigeben (Muss)

```
Reise-Detailseite
  -> "Freigeben"
  -> Sichtbarkeit waehlen (nicht gelistet oder oeffentlich)
  -> Freigabelink wird erzeugt
  -> Link kopieren und teilen
  -> Optional: Passwortschutz aktivieren
```

## 10. Freigegebenen Bericht ansehen (Muss)

```
Externer Besucher
  -> Freigabelink oeffnen
  -> Ggf. Passwort eingeben
  -> Reisegeschichte mit Karte, Zeitachse, Bildern, Texten
  -> Kein Zugriff auf Bearbeitung
```

## 11. Zielvorschlaege und Tagesplanung (Soll)

```
Reise-Detailseite oder Planungsansicht
  -> "Tag planen"
  -> Startpunkt eingeben (oder aktuellen Ort uebernehmen)
  -> Zielpunkt eingeben (oder offen lassen fuer Rundfahrt)
  -> KI generiert Vorschlaege fuer sehenswerte Orte im Korridor
    (Natur, Seen, Fluesse, Staedte, Altstaedte, Kloester, Burgen ...)
  -> Vorschlaege auf Karte anzeigen mit Kategorie-Icons
  -> Einzelne Vorschlaege:
    -> Uebernehmen (wird zum Tagesziel)
    -> Verwerfen
    -> Details ansehen
  -> Reihenfolge der uebernommenen Ziele festlegen
  -> "Tag erstellen" -> Reisetag mit Etappen und Zielen wird angelegt
  -> Route und geschaetzte Fahrzeit werden berechnet
  -> Naechstes Ziel an Google Maps uebergeben
```

## 12. GPX/KML-Import (Soll)

```
Reise-Detailseite
  -> "Route importieren"
  -> Datei waehlen (GPX, KML)
  -> Import-Vorschau mit Karte
  -> Zeitraum der aufgezeichneten Route zuordnen
  -> Importierte Route wird als gefahrene Strecke angezeigt
```

## 13. Bilder verwalten (Soll)

```
Reise, Tag oder Ort -> Bildergalerie
  -> Bild anklicken -> Grossansicht
  -> Aktionen:
    -> Als Titelbild setzen
    -> Als Highlight markieren
    -> Anderem Tag oder Ort zuordnen
    -> Bildunterschrift hinzufuegen
    -> Loeschen (in Papierkorb)
  -> Reihenfolge per Drag-and-drop aendern
```

## 14. Reise bearbeiten und loeschen (Muss)

```
Reise-Detailseite
  -> "Bearbeiten" -> Titel, Zeitraum, Beschreibung aendern
  -> "Archivieren" -> Reise wird ausgeblendet, bleibt erhalten
  -> "Loeschen" -> Reise kommt in Papierkorb
    -> Papierkorb: Wiederherstellen oder endgueltig loeschen
```
