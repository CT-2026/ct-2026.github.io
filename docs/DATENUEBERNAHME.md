# Konzept zur Datenübernahme

Der veröffentlichte Aufgabenbestand entsteht aus einer eindeutigen redaktionellen Quelle unter `content/`. Aufgaben werden nicht parallel im HTML und in Lösungslisten gepflegt. Quellen sind der ScanReha-Pool und der bisherige Web-Bestand (`wiso.html`). Beide durchlaufen denselben Weg in vier Schritten.

## Grundsätze

- Übernommen werden nur ausdrücklich ausgewählte Aufgaben. Die 246 geschlossenen ScanReha-Aufgaben mit gebundener Lösung sind ein Kandidatenbestand, kein Importauftrag.
- Die Quellen werden nur gelesen. Der ScanReha-Pool und `wiso.html` bleiben unverändert; web-spezifische Formulierungen und Antwortalternativen stehen ausschließlich in diesem Projekt.
- Es gelten die ScanReha-Regeln aus `AUFGABENPOOL.md`: Erforderliche Materialien kommen mit, Materialabhängigkeiten werden aufgelöst, Lösungen müssen zur verwendeten Aufgabenrevision passen, und mehrere widersprüchliche Lösungen werden nicht automatisch auf eine reduziert.
- Zahlenänderungen entstehen nicht ungeprüft automatisch. Falsche Rechenergebnisse folgen aus benannten Fehlwegen und werden in `test/content.test.js` nachgerechnet.
- Rechtsbezogene Inhalte erhalten bei ihrer Bearbeitung eine Prüfung anhand aktueller Primärquellen; die Prüfung wird in `checks` festgehalten.

## Die vier Schritte

| Schritt | Datei | Werkzeug |
|---|---|---|
| 1. Aufgaben ausdrücklich auswählen | `content/scanreha/auswahl.json`, `content/wiso/auswahl.json`: Quell-ID, verwendete Quellrevision, Web-ID, Fachbereich, Unterthema, Variantengruppe | von Hand |
| 2. Benötigte Bestandteile auflösen | `content/<quelle>/auszuege/<web-id>.json`: unveränderter Quellauszug | `npm run auszug:scanreha -- --pool <Pfad>`, `npm run auszug:wiso` |
| 3. Web-Bearbeitung ergänzen | `content/aufgaben/<web-id>.json`, `content/materialien/<mat-id>.json`: Titel, Hilfe, kurze und ausführliche Erklärung, Fehlwege, Materialverweise, gegebenenfalls Umformulierungen und neue Antwortalternativen | von Hand |
| 4. Statische Web-Daten erzeugen | `data/aufgaben.js` | `npm run build` |

### Schritt 2 im Einzelnen

Für ScanReha löst `tools/scanreha-auszug.js` je Auswahleintrag auf:

- die Aufgabe in der gewählten Revision; eine abweichende Revision im Pool bricht mit einer Meldung ab;
- alle Lösungen mit `link_state: linked`, die an genau diese Aufgabenrevision gebunden sind; ohne Lösung mit Antwortvorgabe oder bei widersprüchlichen Antwortvorgaben bricht der Schritt ab;
- die erforderlichen Materialien (`required`) samt ihrer `requires`-Kette; alle übrigen Materialien werden unter `other_materials` mit Titel und Rolle verzeichnet;
- hilfreiche Rahmenmaterialien (`supporting`) zusätzlich vollständig unter `supporting_materials`, sofern die Aufgabe solche hat. Eine Web-Bearbeitung kann sie als Kontext verwenden; Pflichtmaterialien werden sie dadurch nicht;
- Ergebnisabhängigkeiten (`requires_result`); die benötigte Aufgabe muss ebenfalls ausgewählt sein.

Standardpfad des Pools ist `../scanreha/Prüfungen -strukturiert/aufgabenpool`, ersatzweise `../scanreha/aufgabenpool`. `--check` schreibt nichts und meldet veraltete Auszüge; eine bloß gestiegene Poolrevision bei unveränderter Aufgabe wird nur vermerkt.

Für den Web-Bestand liest `tools/wiso-auszug.js` Aufgabentext, Antwortalternativen, Lösung und bisherige Erläuterungen aus `wiso.html`. Die bisherige App kennt keine Aufgabenrevisionen; als Quellrevision dient deshalb eine Prüfsumme des ausgelesenen Inhalts. Ändert sich die Aufgabe in `wiso.html`, stimmt die Prüfsumme nicht mehr, und der Auszug bricht ab.

### Schritt 3 und 4 im Einzelnen

Eine Web-Bearbeitung nennt ihre Quelle (`"source": "scanreha"` oder `"wiso-web"`). Aufgabentext, Antwortform und Lösung kommen dann aus dem Auszug:

- **Übernahme** (`origin.kind: adopted`): Aufgabentext, Antwortalternativen und Lösung bleiben unverändert. Überschreibungen sind nicht zulässig.
- **Redaktionelle Umgestaltung** (`adapted`): Änderungen stehen in `overrides` (`stem`, `response`, `solution`) und werden in `origin.changes` beschrieben. Beispiel: Die freie Betragseingabe der Bezugspreisaufgabe wurde in eine Ergebnisauswahl mit vier berechneten Fehlwegen umgewandelt.

Der Build prüft außerdem:

- Jedes erforderliche Quellmaterial ist durch ein Web-Material mit dieser Quelle abgedeckt.
- Jede Auswahl besitzt eine Web-Bearbeitung.
- Das Ergebnis entspricht dem gemeinsamen Format.
- Geänderte Inhalte tragen eine höhere Revision.

Web-Materialien werden bei ScanReha-Quellen ebenfalls aus dem Auszug erzeugt, aus erforderlichen oder hilfreichen Materialien. Markdown-Tabellen werden als strukturierte Tabellen übernommen; enthält ein Material mehrere Tabellen, wird die erste mit mehr als zwei Spalten zur Tabelle, zweispaltige Angabentabellen werden zu Zeilen „Feld: Angabe“. Texte, Dokumentauszüge und Formulare werden als Text übernommen, Überschriften fett. Abbildungen (`figure`) sind nur mit vorhandener Textfassung übernehmbar. Änderungen stehen in `overrides`.

Jede Web-Aufgabe hält damit mindestens fest:

- eigene ID und Inhaltsrevision;
- Quellprojekt, Quell-ID und Quellrevision, bei ScanReha auch die verwendete Lösung;
- Fachbereich, Unterthema und gegebenenfalls Rechenmethode;
- Antwortform, stabile Antwort-IDs und Lösung;
- Materialverweise und Voraussetzungen;
- kurze Erklärung, Hilfe und ausführliche Erläuterung;
- die Kennzeichnung als Übernahme oder Umgestaltung;
- die Variantengruppe.

## Ablauf bei Änderungen in einer Quelle

1. `npm run auszug:scanreha -- --pool <Pfad> --check` bzw. `npm run check` zeigt veraltete Auszüge.
2. Quelländerung fachlich prüfen und die Quellrevision in der Auswahl anpassen.
3. Auszug neu erzeugen und die Web-Bearbeitung prüfen.
4. Revision der Web-Aufgabe erhöhen und `npm run build` ausführen.

## Übernahme vorhandener Lernstände (`wiso40v2`)

Die bisherige App speichert unter `wiso40v2` weiter. Unter „Fortschritt“ kann der Nutzer die einmalige Übernahme ausdrücklich starten. Erst dann liest die neue App diesen Stand; sie verändert ihn nicht. Das Ergebnis wird getrennt von neuen Runden unter `areha.v1.legacy` gespeichert.

- Zuordnung ausschließlich über `legacy_ids` der Web-Aufgabe (z. B. `wiso40v2:46`), nie über gleichlautende Nummern.
- Der Build liefert für ausgewählte Altaufgaben `legacy_tasks` mit Quellantwortstruktur und Lösung. Nur wenn Antwortform, Antwort-IDs, Antworttexte, Zuordnungsziele, Reihenfolgeeinträge, Auswahlregeln und Lösung unverändert sind, kann ein geprüftes altes Ergebnis für die Wiederholung der neuen Fassung verwendet werden. Sonst bleibt es eine historische Angabe.
- Die bisherige App hat Hilfen nicht erfasst. Aus alten Ergebnissen folgt deshalb keine Aussage über selbstständige Beherrschung.
- Rohantwort, Herkunftsrunde, Prüfstatus und Merkstatus bleiben bei der Übernahme erhalten. Unbekannte Aufgaben werden mit ihrer alten ID historisch angezeigt. Passende Merkungen werden in die neue Merkliste übernommen.
- Ein erneuter Import ist nach erfolgreicher Übernahme gesperrt. Neue Antworten bleiben unabhängige Versuche; alte Ergebnisse zählen nicht in die Fortschrittswerte „ohne Hilfe“ oder „mit Hilfe“.

Die Übernahme ist seit Etappe 5 umgesetzt. Etappe 6 erweitert die Auswahl auf elf Altaufgaben: 33, 36, 39, 40, 46, 59, 60, 67, 79, 106 und 110. Die Antwortstrukturen von acht Aufgaben bleiben kompatibel. Aufgabe 39 wird präzisiert, Aufgabe 60 wird zur direkten Zuordnung umgestaltet, und die freie Betragseingabe von Aufgabe 106 wird zur geschlossenen Auswahl. Deren Altantworten bleiben historisch und werden nicht als Antwort auf die umgestaltete Fassung bewertet.

Wurde ein alter Stand schon vor dem Ausbau importiert, erhalten seine bisher unbekannten Einträge beim Laden die neu verfügbaren expliziten Zuordnungen. Es findet kein erneuter Zugriff auf `wiso40v2` statt. Rohantworten, Herkunft und Importzeitpunkt bleiben erhalten. Bereits bearbeitete Zuordnungen und vom Nutzer entfernte Merkungen werden nicht wiederhergestellt.

## Noch nicht abgedeckt

- Zuordnungen aus ScanReha: Ob Antworten mehrfach verwendet werden dürfen, ist dort nicht festgelegt; die Web-Bearbeitung muss `reuse_choices` angeben.
- Automatische Übernahme von ScanReha-Bildmaterialien (`figure`) ohne Textfassung. Abbildungen mit Textfassung werden seit dem Poolausbau als Text übernommen. Eigene lokale Bilder mit Textfassung sowie die vergrößerbare Materialansicht sind seit Etappe 3 umgesetzt und abgenommen.
- Übernahme der übrigen 129 Aufgaben des Web-Bestands. Von den 15 Aufgaben mit freier Zahlen-, Uhrzeit- oder Betragseingabe wurde in Etappe 6 Aufgabe 106 umgestaltet; die übrigen 14 benötigen vor ihrer Aufnahme ebenfalls eine geschlossene Antwortform.

## Ergänzung für Etappe 3

Eine Freitextaufgabe mit passender fachlicher Textlösung darf gezielt als geschlossene Web-Aufgabe umgestaltet werden. Dafür benennt der Auswahleintrag `editorial_solution_id` ausdrücklich. Das Auszugswerkzeug verlangt weiterhin die Bindung an genau die gewählte Aufgabenrevision. Bei widersprüchlichen strukturierten Lösungen bleibt der Abbruch bestehen. Die gewählte Textlösung steht im Auszug unter `answer_solution_id`, besitzt aber selbst keine strukturierte Antwort. Erst die Web-Bearbeitung mit `origin.kind: adapted`, dokumentierten Änderungen sowie `overrides.response` und `overrides.solution` liefert die geschlossene Antwortform und deren Lösung.

Für Teamarbeit ist die selbst erarbeitete Lösung `sol-0a80ae90-363d-5004-af39-b130c6146b97` die redaktionelle Grundlage. Sie wird nicht als offizieller Prüfungsschlüssel bezeichnet. Eigene Übungsvarianten ohne Übernahme eines Quellwortlauts tragen `origin.kind: authored`.

## Ergänzung für Etappe 6

`content/katalog.json` benennt 24 Lernkerne und drei Fallfolgen. Die Aufgaben bleiben einzeln unter `content/aufgaben/` redaktionell maßgeblich; der Katalog vervielfältigt weder Aufgaben noch Lösungen. Gemeinsame Fallangaben liegen als drei zusätzliche Tabellen unter `content/materialien/`.

Der Bestand umfasst 72 Aufgaben: acht aus ScanReha, elf aus dem bisherigen Web-Bestand und 53 eigene Übungsaufgaben. Etappe 6 fügt zehn gezielte Übernahmen beziehungsweise Umgestaltungen und 44 eigene Aufgaben hinzu. Der ScanReha-Pool und die bisherige App werden dafür nicht verändert. Künftige Lernkerne und Fälle können über Inhalte und Katalog ergänzt werden, ohne Sondercode für eine einzelne Aufgabe.

## Ergänzung für den Poolausbau

Der Poolausbau vom 26.09.2026 wählt 76 weitere ScanReha-Aufgaben aus. Alle sind unveränderte Übernahmen (`adopted`, keine `overrides`); ihre Lösung entspricht der gebundenen Poollösung, was `test/poolausbau.test.js` prüft. Der Bestand umfasst damit 148 Aufgaben in 30 Lernkernen: 84 aus ScanReha, elf aus dem bisherigen Web-Bestand und 53 eigene Übungsaufgaben. WiSo bleibt unverändert.

Nicht übernommen wurden unter anderem Aufgaben mit freier Eingabe, weil sie nur mit neu erfundenen Antwortalternativen zu schließen wären, sowie rechtsbezogene Aufgaben ohne mögliche Prüfung an Primärquellen. Die Einordnung aller Poolaufgaben steht in [POOLSICHTUNG.md](POOLSICHTUNG.md).

## Expliziter Incoming-Import vom 26.09.2026

Die zwei vom Nutzer benannten Markdown-Dateien sind vollständig übernommen: Auswahl mit 48 Zuordnungen unter content/incoming/auswahl.json, unveränderte fachliche Quellfelder unter content/incoming/auszuege.json, redaktionelle Aufgaben unter content/aufgaben/incoming-*.json. Die 22 Auswahlfragen sind adopted, die 26 offenen Vorlagen wegen der neuen geschlossenen Antwortform adapted. Lösungen für die Probeklausur sind redaktionell erstellt, weil kein Quellschlüssel vorlag. Der bestehende Datenbuild verarbeitet die vollständigen Aufgaben ohne gesonderten Importlauf. [Umfang und Nutzergrenzen](INTEGRATION-INCOMING-2026-09-26.md).
