# Planung Aydinreha

## Bedienabläufe vom 29.09.2026

Reset, Rundenabschluss, Rückblick, Hilfe und Bestätigungsfragen wurden zusammenhängend korrigiert. Umfang, Ergebnisse und Grenzen stehen in [Bedienprüfung](docs/BEDIENPRUEFUNG-2026-09-29.md). Die folgenden Abschnitte dokumentieren frühere Stände.

## Durchgängige Bedienkorrekturen vom 29.09.2026

Der Start bietet zwei Aktionen; offene Runden werden über den jeweiligen Üben- oder Wiederholen-Button fortgesetzt. „Lösung anzeigen“ benennt die bisherige Lösungsansicht ausdrücklich. Gemerkte Aufgaben sind aus der Merkliste als vollständige Aufgabenansicht mit Lösung, Erklärung und Materialien erreichbar; eine offene Runde bleibt erhalten. Nach Fehlerwiederholungen setzt der Abschlussbutton die Wiederholung fort, solange Fehler offen sind, andernfalls heißt er „Neue Übungsrunde“. Die Wissenssuche behält ihre Eingabe beim Filtern und Navigieren; Themenseiten führen zur vorherigen Fachbereichsauswahl zurück. Reihenfolgeaufgaben prüfen die sichtbare Reihenfolge direkt. Wissensbeispiele verwenden sachliche Überschriften und vollständige Lösungen aller Antwortformate; leere Quellenbereiche entfallen.

Die vorgesehenen Fassungen wurden vor dem Schreiben auf JavaScript-Syntax sowie gezielt mit einer DOM-Nachbildung geprüft: Merkliste und Rückkehr, Erhalt aktiver Runden, Lösungsansicht, Suchnavigation, beide Reihenfolge-Abläufe, Wiederholung bis zum letzten Fehler sowie die gemeinsame Darstellung der 33 Themen und 196 Aufgaben. Keine interaktive Browser- oder visuelle Prüfung. Die folgenden Abschnitte dokumentieren frühere Stände.

## Logikprüfung und Bereinigung vom 29.09.2026

Die Fehlerwiederholung richtet sich nach der letzten vollständig geprüften Antwort: falsch oder teilweise falsch nimmt eine Aufgabe auf, richtig entfernt sie sofort, erneut falsch nimmt sie wieder auf. Überspringen, Lösungsansicht und ungeprüfte Antworten verändern dieses Ergebnis nicht. Der Fortschritt verwendet denselben Ergebnisstand. Die letzten Aufgabenergebnisse bleiben beim Kürzen des Rundenverlaufs auf 200 Runden separat erhalten.

Unter Fortschritt gibt es „Lernstand zurücksetzen“ mit Bestätigung und Abbruch. Der Reset entfernt Antworten, Ergebnisse einschließlich dauerhaft gespeicherter Aufgabenergebnisse, Merkungen, Runden und Defektsicherung. Er funktioniert auch bei vollem Speicher ohne Schreibzugriff; Fehler beim Löschen werden gemeldet. Andere Anwendungen werden nicht zurückgesetzt. Ein Reset aus einem anderen Tab wird übernommen.

Die belehrenden und redundanten Zusatztexte wurden in Start, Wissensatlas, Hilfe, Bearbeitung, Abschluss und Fortschritt entfernt oder auf kurze Statusmeldungen reduziert. Der alte WiSo-Importbereich einschließlich Übernahmebutton und Importbedienung entfällt.

Vor dem Schreiben bestanden 41 gezielte Logiktests, darunter falsch → richtig → erneut falsch mit allen 196 Aufgaben und Speicherung/Neuladen. Acht DOM-Abläufe decken Wiederholung, Reset, Abbruch, Fehlerfälle und Tabwechsel ab; zusätzlich wurden alle 33 Wissensseiten aufgerufen. JavaScript-Syntax und Elementbindungen wurden geprüft. Keine interaktive Browsersteuerung oder visuelle Abnahme. Neue Regressionstests stehen in test/learning-lifecycle.test.js. Die folgenden Abschnitte beschreiben frühere Stände.

## Vereinfachte Übungsauswahl vom 29.09.2026

Auf Nutzerauftrag bleiben nur „Üben“ mit Hilfe und unmittelbarer Rückmeldung sowie „Falsch beantwortete Aufgaben wiederholen“. Beide verwenden Runden mit bis zu drei Aufgaben. Die Wiederholung berücksichtigt den letzten bewerteten vollständigen Versuch der aktuellen Aufgabenfassung, einschließlich teilweise falscher Antworten. Überspringen, Lösungsansicht und Merken erzeugen keinen Wiederholungsbedarf; eine richtige Antwort entfernt ihn. Bereits richtige Voraussetzungsschritte werden nicht hinzugefügt.

Selbstcheck, Längenwahl, Themen- und Fallrunden, der Übungseinstieg aus Wissensartikeln und der Link zur separaten bisherigen WiSo-Oberfläche sind aus der Oberfläche entfernt. Der beanstandete Bewertungs- und Speicherhinweis entfällt. Es gibt keine Überführung alter offener Modi; laut Nutzer ist die App noch nicht in Gebrauch.

Vor dem Schreiben bestanden 11 gezielte Lernlogiktests, JavaScript-Syntax und der statische Abgleich der Oberflächenelemente mit den vorgesehenen Fassungen im Speicher. Keine Browsersteuerung und keine Anschlussprüfung. Die folgenden Abschnitte beschreiben frühere Stände.

## Korrekturen aus Inspektionslauf 5, 28.09.2026

Die Befundliste Q1–Q10 ist bearbeitet: Plural und Schriftgewicht der Lösungslisten, vollständige Antwortalternativen in Wissensbeispielen, digitale Zuordnungsanweisungen, Inhaltssuche, unterscheidbare Auswahlformen, deutliche Selbstcheck-Schritte, nicht haftende Aktionsleiste bei Speicherfehlern auf niedrigen Bildschirmen sowie ein zweispaltiger Wareneingangsschein. Q6 und Q8 bleiben entsprechend der Berichtsempfehlung erhalten. Entscheidungen und Abgrenzungen stehen in der [Umsetzungsübersicht zu Lauf 5](aydinreha-inspektion/2026-09-27-lauf-5/umsetzung.md).

Vier Aufgabenrevisionen und eine Materialrevision erhöht. Der kanonische Datenbuild erzeugt 196 Aufgaben und 25 Materialien mit Datenrevision df5679b331d581cd. Vor dem Schreiben bestanden 26 gezielte DOM-/Suchprüfungen, JavaScript-Syntax sowie Format-, Quellbindungs- und Revisionskontrollen. Keine Anschlussprüfungen oder Browserabnahme. Die folgenden Abschnitte beschreiben frühere Stände.

## Nacharbeit zur Abnahme von Lauf 4, 27.09.2026

Die Auswertung von [pruefergebnisse.md](pruefergebnisse.md) führte zu drei lokalen Korrekturen: Umbruchschutz für Beträge über Fettformatgrenzen hinweg, auf 400 Pixel gekürzte Zeichenfläche des Lieferbelegs und mit der Grundschrift wachsende Buchstabenkästen. Die kurze Tabelle behält ihre laut Bericht funktionierende seitliche Verschiebung. B03 war bereits berichtigt.

Lieferbeleg und zugehörige Aufgabe tragen Revision 3. Der Datenbuild schrieb 196 Aufgaben und 25 Materialien mit Datenrevision `21233a9580a52b3b`. Vor dem Schreiben bestanden Renderer-Syntax und 57 gezielte DOM-/Textprüfungen im Speicher. Keine Anschlussprüfungen oder neue Browserabnahme; Einzelheiten und Abgrenzungen stehen im Umsetzungsnachtrag der Prüfergebnisse. Die folgenden Abschnitte beschreiben frühere Stände.

## Korrekturen aus Inspektionslauf 4 vom 27.09.2026

Die Befunde P1–P6 sind in den lokalen Quellen bearbeitet: Materialschatten und Bildabstände, Zuordnungslösungen direkt an den Feldern, passender Angabenverweis, verständliche Materialtexte, kompakter Weiterlesen-Hinweis und Umbruchschutz für Geldbeträge und Prozentangaben. L1–L5 sind im Laufbericht samt Berichtsquellen berichtigt. Einzelheiten stehen in der [Umsetzungsübersicht zu Lauf 4](aydinreha-inspektion/2026-09-27-lauf-4/umsetzung.md).

Drei Material- und vier Aufgabenrevisionen wurden erhöht. Der Datenbuild schrieb erfolgreich 196 Aufgaben und 25 Materialien mit Datenrevision 4155cfd3e204fd43. Vorgesehene JavaScript- und JSON-Fassungen wurden vor dem Schreiben syntaktisch geprüft; keine anschließenden Tests, Kontrolllesungen oder Browserabnahme. Die historischen Bilder zeigen den Stand vor diesen Korrekturen.

## Inhaltsintegration vom 26.09.2026

Die beiden Dateien aus incoming/ ergänzen den Bestand um **48 Aufgaben**: 26 offene Vorlagen als geschlossene Übungen und 22 unverändert übernommene Auswahlfragen. Neuer Gesamtbestand: **196 Aufgaben in 33 Lernkernen**, davon 44 WiSo, 91 Warenwirtschaft und 61 Verkauf. **12 zusätzliche Wissenskarten** ergeben zusammen 42 Karten. Die Rechtsabgleiche wurden auf ausdrückliche Nutzeranweisung ausgesetzt; der Verzicht ist bei den betroffenen Importaufgaben dokumentiert. Keine zusätzlichen Präzisierungen der Auswahlfragen. Einzelheiten und die Zuordnung jeder Quellaufgabe stehen im [Integrationsvermerk](docs/INTEGRATION-INCOMING-2026-09-26.md).

Format, Quellzuordnung, unveränderte Auswahlfragen, Rechenbeispiele und vorgesehene Skriptsyntax wurden vor dem Schreiben im Speicher geprüft. Die Anwendungsdaten werden mit dem bestehenden Datenbuild erzeugt. Keine anschließenden Datei-, Test- oder Browserprüfungen. Die folgenden Abschnitte dokumentieren frühere Arbeitsstände.


## Aktueller Arbeitsstand: Korrekturen aus Inspektionslauf 3

N1–N7 sind lokal im gemeinsamen Oberflächencode bearbeitet. Dazu gehören kompaktere Abstände, erkennbare aufklappbare Erklärungen, ein separater Verschiebebereich für vergrößerte Bilder mit Hinweis sowie klarere Hilfe- und Auswahltexte. Die Berichtsprobleme L1–L4 sind in der redaktionellen Quelle und im neu erzeugten Laufbericht berichtigt; L5 erfordert keine Änderung. Maßgeblich ist die [Umsetzungsübersicht zu Lauf 3](aydinreha-inspektion/2026-09-26-lauf-3/umsetzung.md).

Die Einzeldatei `Areha.html` wurde erfolgreich erzeugt (1,65 MiB). Aufgabenbestand und Inhaltsrevisionen bleiben unverändert. Syntaxprüfung der vorgesehenen JavaScript-Fassungen und Berichts-JSON vor dem Schreiben; keine anschließenden Tests oder Browserabnahme gemäß globalem Anschlussprüfungsverbot. Historische Bilder und Prüfungen bestätigen diesen neuen Stand nicht.

Die folgenden Abschnitte dokumentieren frühere Arbeitsstände.

## Aktueller Arbeitsstand: Korrekturen aus Inspektionslauf 2, 26.09.2026

Die Befunde O1–O6 und K1–K14 sind im lokalen Oberflächencode bearbeitet beziehungsweise mit einer konkreten Entscheidung dokumentiert. Maßgeblich ist die [Umsetzungsübersicht](aydinreha-inspektion/2026-09-26-lauf-2/umsetzung.md). Historische Ergebnisse bleiben unverändert gespeichert; bei geänderter Aufgabenrevision zeigen Rückblick und offene Runde zusätzlich die aktuelle Lösung und Erklärung. Selbstchecks geben vor Abgabe keine Lösungen frei, auch nicht über den Rückblick früherer Runden. Ein [Audit mit Funktionsprüfungen](aydinreha-inspektion/2026-09-26-audit-bedienlogik/befund.md) hat diese Abläufe geprüft; die gefundenen drei Abweichungen einschließlich des Fokus nach Abbruch der Abgabe sind behoben.

Ergebnislisten, Abgabeaktionen, Bildtext, Quellenanzeigen und kleinere Bedienungsdetails wurden überarbeitet. Die Quellenbeschreibungen haben redaktionelle Fassung 3; ihre bisherigen Prüfdatumsangaben wurden nicht erneuert. Aufgaben, Materialien, Quellauszüge und Datenrevision bleiben unverändert. Der Einzeldatei-Build hat die aktualisierte `Areha.html` erfolgreich geschrieben (1,64 MiB).

L1 bleibt als nicht erhobene Smartphone-Messung offen; L2 ist kein Oberflächenfehler. Berichtigungen zu L3 stehen im Nachtrag zum historischen Laufbericht. Keine neue Browsersteuerung, keine neue Aufnahme und keine Anschlussprüfung. Vor dem Schreiben wurden die Ursachen im Code abgeglichen und die vorgesehenen JavaScript-Fassungen auf Syntax geprüft. Funktional in jsdom geprüft sind nur Rückblick und Selbstcheck-Abgabe (siehe Audit). Eine visuelle Abnahme und eine Browserprüfung des korrigierten Stands stehen aus.

## Aktueller Inhaltsausbau: Wissenskarten, 26.09.2026

Auf Nutzerauftrag wurden die Zusatzinformationen recherchiert und sprachlich zugänglich, fachlich vertiefend ausgearbeitet. `content/wissen.js` enthält **30 veröffentlichte Wissenskarten mit 28 redaktionell geprüften Quellenzielen** für sämtliche bestehenden Lernkerne. Jede Karte bietet einen Einstieg, drei Abschnitte, ein eigenes Beispiel, typische Denkfehler und einen Merksatz. Fachbegriffe, Prozentbasen, Annahmen und Grenzen von Schlussfolgerungen werden ausdrücklich erklärt.

Rechts- und Steueraussagen sind mit den tatsächlich abgerufenen BGB-, UStG-, HGB-, UWG- und PAngV-Vorschriften belegt; Arbeitsschutz mit DGUV und BGHW. § 377 HGB war nicht abrufbar, deshalb keine gesetzlichen Rügefristen in der Warenannahmekarte. Die zurückgestellten Poolaufgaben bleiben unberührt. Die neuen WiSo-Texte sind Zusatzartikel; Aufgaben, Lernkerne und Quellauszüge wurden nicht verändert.

Belegzuordnung, Rechenergebnisse und Grenzen der Prüfung stehen in [Wissensatlas-Recherche](docs/WISSENSATLAS-RECHERCHE-2026-09-26.md). Quellen wurden auf Textebene gelesen, Rechnungen und vorgesehene Skriptsyntax vor dem Schreiben ausgewertet. Keine Videos, Browsersteuerung oder Anschlussprüfungen. Frühere Hinweise auf leere Wissenslisten dokumentieren den damaligen Grundlagenstand.

## Bereitstellung auf GitHub Pages

Die Anwendung wird auf GitHub Pages mit `index.html` als Einstieg bereitgestellt. Die verknüpften Dateien in `styles/`, `js/`, `data/`, `content/` und `assets/` gehören dazu.

Änderungen an Oberfläche und Wissensartikeln werden direkt in diesen Dateien gepflegt. Nach Aufgabenänderungen erzeugt `npm run build` die Aufgabendaten. Ein zusätzlicher HTML-Export entfällt.

## Aktuelle lokale Überarbeitung: Sprache und Auftritt, 26.09.2026

Auf Nutzerauftrag wurden die Befunde aus `aydinreha-inspektion/2026-09-26/befund-sprache-und-auftritt.md` im lokalen Oberflächencode bearbeitet. Der Einstieg bietet die kurze Runde beziehungsweise das Fortsetzen vor den Fachgebietskarten an. Überschriften und Modusnamen benennen ihre Funktion; „Selbstcheck“ ersetzt die wechselnden Bezeichnungen des Modus ohne Hilfe. Fachbereichsnamen stammen aus dem vorhandenen Katalog. Slogans, dekorative Nummern, Zierbild, Leuchteffekte und mitlaufender Übungskasten entfallen. Bedienhinweise sind neutral formuliert, die Abschlussaktionen gleich gewichtet.

Die [Umsetzungsübersicht](aydinreha-inspektion/2026-09-26/umsetzung-sprache-und-auftritt.md) ordnet jede Befundnummer einer Änderung oder einer begründeten Abgrenzung zu. Bedienhinweise sind neutral formuliert. Zusätzlich wurden persönliche Anreden in Hilfen, Erklärungen und Fehlwegrückmeldungen von 31 Aufgaben sachlich umformuliert, ihre Inhaltsrevisionen erhöht und die lokalen Anwendungsdaten erfolgreich erzeugt. Aufgabenstellungen, Antwortalternativen, Lösungen und Quellen bleiben unverändert.

**Prüfstand:** Datenbuild einschließlich integrierter Format- und Revisionskontrollen erfolgreich; Datenrevision `988d3b3f8056b0d8`, weiterhin 148 Aufgaben. Gemäß Anschlussprüfungsverbot keine anschließenden separaten Tests oder visuelle Abnahme. Die textabhängigen Erwartungen der vorhandenen Browserprüfung wurden mitgepflegt, ohne den Browserlauf auszuführen. Die folgenden Beschreibungen und Abnahmen dokumentieren frühere Ausbaustände.

---

Das aktuelle Ziel ist eine **Lernoberfläche für die Verkäuferprüfung mit einem eigenständigen Wissensbereich, verständlichen Erklärungen und kurzen Übungsrunden mit ausschließlich geschlossenen Antworten**. Der neue Auftrag vom 26.09.2026 erweitert die bisherige Ausrichtung: Das UI/UX wird modernisiert und gestalterisch auf einen 21-jährigen Menschen mit Interesse an Technik und Fantasy abgestimmt. Diagnostische Lernsteuerung oder ein persönliches Kompetenzmodell gehören weiterhin nicht zum Umfang.

**Neuer lokaler Ausbau vom 26.09.2026: UI/UX und Wissensbasis**

- Moderne Oberfläche mit dunklen Flächen, klarer Typografie, geometrischen Orbit-/Kristallmotiven sowie Türkis-, Violett- und Goldakzenten. Eigenständige Einstiege für Wissen und Training, gegliederte Übungsmodi und responsive Layouts sind im Code angelegt.
- Wissensatlas mit Suche, Fachbereichsfiltern und direkt verlinkbaren Themenseiten. Die vorhandenen Aufgabenstellungen, Materialien und Erklärungen sind auch ohne vorherige Antwort zugänglich. Von jedem Thema führt eine Aktion in die passende Übungsrunde.
- Grundlage für zusätzliche Lernartikel mit Abschnitten, Beispielen und Merksatz sowie für Artikel, Videos und Quellen. Zentrale redaktionelle Datei: `content/wissen.js`. Empfehlungen unterstützen Themen-/Aufgabenzuordnung, Herausgeber, HTTPS-Adresse, Freigabestatus und tatsächliches Prüfdatum.
- Die lokale Referenz `C:/Users/SYSTEM-C/Desktop/gpt/projekte/ct-2026.github.io-main` wurde für das Prinzip gestufter Erklärungen und kontextbezogenen Weiterlesens herangezogen. Texte, Videos und Links wurden auftragsgemäß nicht recherchiert; die neuen redaktionellen Listen sind leer. Vorhandene Erklärungen werden wiederverwendet.
- Ein aktiver Selbstcheck hält den Wissensbereich bis zur Abgabe gesperrt. Nachschlagen in einer normalen Runde zählt für passende noch offene Aufgaben als Unterstützung. Lesen ohne offene Runde erzeugt keine Übungsergebnisse.

**Umsetzungsstand:** Die Basis ist lokal geschrieben. Es erfolgten gemäß Anschlussprüfungsverbot keine anschließenden Tests, Browserläufe oder Sichtprüfungen. Eine funktionale und visuelle Abnahme dieses Ausbaus ist damit noch offen. Die nachfolgenden früheren Prüfergebnisse beziehen sich ausschließlich auf den Stand vor diesem UI-/UX-Ausbau.

Aufbau, Inhaltsformat und Veröffentlichungskriterien für spätere Empfehlungen sind in [docs/WISSENSATLAS.md](docs/WISSENSATLAS.md) beschrieben. Künftige redaktionelle Befüllung ist ein eigener Schritt; dieser Auftrag umfasst nur die Grundlage. Kein Remote-Zugriff, Git-Einsatz oder Deployment.

---

## Poolausbau vom 26.09.2026

**Auftrag:** mehr Aufgaben; zu prüfen war, ob alle sinnvoll nutzbaren Aufgaben des ScanReha-Pools bereits eingearbeitet sind. Das war nicht der Fall: Von 797 Poolaufgaben waren nur acht übernommen. Vorgaben des Nutzers: WiSo nicht anfassen und Aufgaben nicht zwanghaft umformen.

**Ergebnis:** 76 weitere geschlossene Aufgaben mit gebundener Lösung, 57 in Warenwirtschaft und 19 im Verkauf. Der Bestand wächst auf **148 Aufgaben in 30 Lernkernen** (WiSo 24, Warenwirtschaft 81, Verkauf 43). Alle neuen Aufgaben sind unveränderte Übernahmen: Aufgabentext, Antwortalternativen und Lösung stammen aus dem Pool. Hilfe, kurze und ausführliche Erklärung sowie Fehlwege sind neu geschrieben. Dazu kommen 17 Materialien aus ScanReha.

| Neuer Lernkern | Fachbereich |
|---|---|
| Einkauf planen und Kaufarten | Warenwirtschaft |
| Warenwirtschaftssystem nutzen | Warenwirtschaft |
| Artikeldaten erfassen | Warenwirtschaft |
| Lagerung und Warenpflege | Warenwirtschaft |
| Kosten, Umsatzsteuer und Bilanz | Warenwirtschaft |
| Service und Bedienungsformen | Verkauf |

Weitere neue Aufgaben ergänzen vorhandene Lernkerne, vor allem Warenannahme, Lagerkennzahlen, Nachbestellung, Rechnung und Kasse, Beratung und Gesprächsführung. Jeder Lernkern hat mindestens drei Aufgaben.

**Bewusst nicht übernommen:**
- WiSo: keine neuen Aufgaben und keine Änderungen an WiSo-Lernkernen, -Unterthemen oder -Auszügen. Aufgaben aus WiSo-Prüfungsteilen sind auch dann ausgeschlossen, wenn ihr Thema zur Warenwirtschaft passt. Grenzfälle wurden zugunsten des Ausschlusses entschieden.
- 166 Aufgaben mit freier Zahlen-, Uhrzeit- oder Texteingabe: nicht umgeformt.
- Elf rechtsbezogene Aufgaben: zurückgestellt, weil die geforderte Prüfung an Primärquellen hier nicht möglich war (`gesetze-im-internet.de` durch die Netzrichtlinie gesperrt).
- Dubletten, bereits vorhandene Inhalte, reine Bildaufgaben ohne Textfassung, fachlich überholte Aufgaben und Aufgaben ohne gebundene Lösung.

Die vollständige Einordnung aller 797 Poolaufgaben mit Begründung und Hinweisen für die Poolpflege steht in [docs/POOLSICHTUNG.md](docs/POOLSICHTUNG.md).

**Technische Ergänzungen:** Der Build übernimmt Formulare, Abbildungen mit Textfassung und Dokumentauszüge mit Tabellen. ScanReha-Auszüge enthalten hilfreiche Rahmenmaterialien vollständig unter `supporting_materials`, sofern die Aufgabe solche hat. Antwortalternativen brechen lange Wörter um, damit bei 320 Pixeln nichts über den Rand ragt.

**Prüfstand:**
- 77 von 77 Node-Prüfungen bestanden, darunter neue Prüfungen zum Poolausbau: unveränderte WiSo-Inhalte, Lösungsgleichheit mit dem Pool, Dreier-Runden der neuen Lernkerne und die Werkzeugerweiterungen.
- `npm run check` und die ScanReha-Auszugsprüfung melden aktuelle Daten.
- Browserprüfung `--etappe6`: 756 von 756 Prüfungen bestanden, darunter alle 148 Aufgaben bei 320 Pixeln Breite und die Themenwahl aller 30 Lernkerne.
- Die vollständige Browserprüfung meldet nach 35 bestandenen Prüfungen zwei Fehlschläge („Rückmeldung ‚Richtig‘ mit Hinweis auf Hilfe“, „‚Kurz üben‘ per Tab erreichbar“) und bricht danach ab. Auf dem Stand vor dem Poolausbau verläuft sie identisch. Diese offenen Punkte gehören vermutlich zum ungeprüften UI-/UX-Ausbau.

---

## Bisheriger Ausbau: Etappen 1 bis 6

**Arbeitsstand vom 26.09.2026**

**Lokale Einordnung zum Abschluss des Chats „Aydinreha-Planung aktualisieren“:** Bezugsstand ist der abgeschlossene Ausbau von Etappe 6 im [Chat vom 26.09.2026](codex://threads/01a0dbcb-444f-7f10-a20c-8c867243ce1d). Der lokale Bestand enthielt zu diesem Zeitpunkt weiterhin 72 Aufgaben in 24 Lernkernen, sechs Materialien und drei Fallrunden; den heutigen Umfang beschreibt der Abschnitt zum Poolausbau. Die eingesehenen Funktionen für Lernkernwahl, Fallrunden, Prüfungstraining und Altzuordnung entsprechen dem dort beschriebenen Abschlussstand; ein zusätzlicher funktionaler Ausbau ist daraus nicht erkennbar. Die unten genannten Prüfergebnisse stammen aus der damaligen Abnahme. Für diese Einordnung wurden lokale Inhalte und Code gelesen, keine neuen Test- oder Browserläufe durchgeführt.

**Etappen 1, 2, 3, 5 und 6 sind lokal umgesetzt und selbst abgenommen. Etappe 4 bleibt auf ausdrücklichen Nutzerwunsch übersprungen.** Der Auftrag zum Inhaltsausbau ist abgeschlossen.

**Etappe 6 erweitert den Bestand von 18 auf 72 Aufgaben in 24 Lernkernen**, gleichmäßig mit 24 Aufgaben je Fachbereich und drei Aufgaben je Lernkern. Alle Aufgaben nutzen die vier vorhandenen geschlossenen Antwortformen, Speicherung, Rückmeldung, Wiederholung und Prüfungstraining. Jede Aufgabe besitzt Hilfe, kurze und ausführliche Erklärung.

| WiSo – 8 Lernkerne | Warenwirtschaft – 8 Lernkerne | Verkauf – 8 Lernkerne |
|---|---|---|
| Wirtschaftsbereiche | Warenannahme | Beratung |
| Arbeitsschutz und Statistik | Rabatt und Skonto | Zusammenarbeit |
| Haushalt und Prozentrechnung | Nachbestellung planen | Gespräche führen |
| Erlöse, Kosten und Ergebnis | Lagerbestände führen | Nutzen erklären und Einwände klären |
| Angebot, Nachfrage und Preise | Lagerkennzahlen | Reklamationen aufnehmen |
| Wirtschaftlich handeln | Verkaufspreise kalkulieren | Waren präsentieren |
| Unternehmensziele | Angebote vergleichen | Werbemaßnahmen planen |
| Ressourcen und Verpackungen | Rechnung und Kasse | Eine Verkaufsaktion auswerten |

**Themenwahl:** Neben dem Fachbereich lässt sich jetzt ein einzelner Lernkern auswählen. Eine Themenrunde enthält drei passende Aufgaben.

**Fallfolgen:** Der eigene Einstieg „Einen zusammenhängenden Fall üben“ bietet drei Fälle mit jeweils drei angekündigten Aufgaben:
- Eine Nachbestellung planen: Meldebestand, Bestellmenge und Kartonzahl.
- Zwei Angebote vergleichen: Stückpreis, Gesamtbezug und Lieferantenentscheidung.
- Eine Verkaufsaktion auswerten: Kaufquote, Durchschnittsbon und Aussagekraft der Ergebnisse.

Die Fälle haben gemeinsame Tabellen, feste Reihenfolge und einen eigenen Abschluss. Jede Teilaufgabe enthält alle benötigten Angaben, damit auch nach einer falschen oder übersprungenen Antwort weitergearbeitet werden kann. Fall und Position bleiben beim Neuladen erhalten. Eine normale kurze Runde bleibt bei drei Aufgaben. Lernkerne und Fälle werden über `content/katalog.json` verwaltet; Sondercode für einzelne Aufgaben ist nicht nötig.

**Gezielte Übernahme des Altbestands:** Zehn weitere Aufgaben aus `wiso.html` wurden aufgenommen. Insgesamt sind nun elf Altaufgaben ausdrücklich zugeordnet: 33, 36, 39, 40, 46, 59, 60, 67, 79, 106 und 110. Bei acht davon bleibt die Antwortstruktur kompatibel. Aufgabe 39 ist präzisiert, Aufgabe 60 zur direkten Zuordnung umgestaltet und die freie Betragseingabe von Aufgabe 106 in eine Auswahl überführt. Deren frühere Antworten bleiben historische Angaben. Bereits importierte, bisher unbekannte Rohantworten erhalten beim Laden die neuen expliziten Zuordnungen; der Altspeicher wird dafür nicht erneut gelesen oder verändert.

Der Gesamtbestand besteht aus acht ScanReha-Aufgaben, elf übernommenen oder umgestalteten Altaufgaben und 53 eigenen Übungsaufgaben. Etappe 6 ergänzt 44 eigene Aufgaben und zehn Aufgaben aus dem Altbestand. Die übrigen 129 Altaufgaben bleiben in der bisherigen App erreichbar; ein vollständiger Import aller 140 Aufgaben war nicht Umfang dieses gezielten Ausbaus. Von den 15 freien Eingaben ist eine umgestaltet; die übrigen 14 müssen vor einer späteren Aufnahme ebenfalls geschlossen werden.

**Prüfstand zu Etappe 6:**
- 70 automatisierte Node-Prüfungen sind abgedeckt, ohne übersprungene Tests. Im Gesamtlauf bestand eine Speicherprüfung zunächst nicht, weil normale Runden ein unnötiges leeres Fallfeld erhielten. Nach der Korrektur bestanden alle 13 gezielt wiederholten Speicher- und Etappe-6-Prüfungen; die übrigen 57 waren bereits erfolgreich.
- Der vollständige Browserlauf umfasste 474 Prüfungen. Ein langer Titel benötigte bei 320 Pixeln einen Wortumbruch; die Altdaten-Testfälle benötigten einen tatsächlichen Seitenneustart. Nach diesen Korrekturen bestand der betroffene Inhalts- und Kataloglauf mit **386 von 386 Prüfungen**. Die weiteren 88 Prüfungen zu kurzer Runde, Speicherfehlern und Etappe 5 waren bereits erfolgreich.
- Abgedeckt sind alle 72 Aufgaben, Bewertung, Hilfe, Rückblick, Materialansicht, Neuladen, alle 24 Lernkerne, die drei vollständigen Fälle und neue Altzuordnungen einschließlich historischer Zahlenantworten. Neue Rechenlösungen wurden unabhängig nachgerechnet.
- Die Web-Daten und ausgewählten Quellauszüge wurden erzeugt; der Node-Lauf bestätigte ihren aktuellen Stand einschließlich Abgleich mit dem vorhandenen ScanReha-Bestand.
- Echte Mobilgeräte, Safari/iOS, Firefox und Screenreader wurden nicht geprüft. Die mehrtägige Alltagserprobung wurde ausdrücklich übersprungen.

Die frühere Abnahme der drei Korrekturen zur kurzen Runde bleibt dokumentiert: sichtbare Speicherfehler ohne falsche Erfolgsmeldung, erreichbarer Abschluss nach Markieren und Überspringen sowie Lösungen im Rückblick. Der damalige Report bezog sich auf Branch `claude/affectionate-lovelace-jsx9ou` und den seinerzeitigen [Draft-PR #2](https://github.com/CT-2026/aydinreha/pull/2). Der Bezugs-Chat endete später mit der Erstellung von PR #3 für Etappe 6. Diese historische Angabe beschreibt keinen aktuellen Remote-, Merge- oder Veröffentlichungsstand; maßgeblich für diese Einordnung ist ausschließlich der lokale Projektbestand.

Der direkte Rechtsquellenabgleich der Wegeunfall-Aufgabe ist erledigt und bei der Aufgabe dokumentiert. Neue Kalkulationsaufgaben verwenden ausdrücklich vorgegebene Prozentsätze und fiktive Geschäftsdaten. Reklamationsaufgaben üben Gespräch und Dokumentation, ohne eine konkrete rechtliche Abhilfe zu versprechen.

**Weiterer Ausbau ist optional:** Weitere Aufgaben des bisherigen Web-Bestands, andere Fallfolgen und zusätzliche Inhalte können gezielt ergänzt werden. Für die sechs geplanten Etappen besteht kein offener Umsetzungsschritt mehr; Etappe 4 ist bewusst ausgelassen.

Die folgenden Abschnitte bleiben das Fachkonzept. Beschreibungen der ursprünglichen monolithischen Web-App beziehen sich auf den Ausgangsstand vor Etappe 1.

**1. Zielumfang und technische Grundentscheidung**

Die bestehende Web-App wird schrittweise erweitert. ScanReha dient als strukturierte Inhaltsquelle.

| Bestandteil | Geplante Umsetzung |
|---|---|
| Einstieg | „Kurz üben“ als Hauptaktion; daneben „Thema wählen“, „Ohne Hilfe ausprobieren“ und „Fortschritt“ |
| Kurze Runde | Drei Aufgaben mit erkennbarem Abschluss; keine automatisch angehängten Aufgaben |
| Längeres Üben | Zunächst sechs Aufgaben, mit demselben Ablauf |
| Antwortformen | Einfachauswahl, Mehrfachauswahl, Zuordnung und Reihenfolge |
| Rechenaufgaben | Ergebnisse, Rechenansätze oder Rechenschritte auswählen |
| Unterstützung | Optionale kurze Hilfe; ausführliche Erklärung aufklappbar |
| Wiederholung | Falsche, übersprungene und gemerkte Aufgaben nach einfachen Regeln |
| Prüfungstraining | Eigener Durchgang mit Rückmeldung nach der Abgabe |
| Speicherung | Weiterhin lokal im Browser |

Die Fachgliederung umfasst **Wirtschafts- und Sozialkunde**, **Warenwirtschaft und Kalkulation** sowie **Verkauf und Werbemaßnahmen**. Die bisherigen sieben WiSo-Themen bleiben als Unterthemen erhalten.

Die Anwendung bleibt eine statische Website. Für diesen Umfang sind ein Benutzerkonto, ein Backend oder ein neues Frontend-Framework nicht erforderlich.

**2. Inhalte, Darstellung und Lernlogik voneinander trennen**

Die ursprüngliche monolithische App liegt als [wiso.html](C:/Users/SYSTEM-C/Desktop/gpt/projekte/aydinreha/wiso.html) im Projekt. Im neuen Einstieg [index.html](C:/Users/SYSTEM-C/Desktop/gpt/projekte/aydinreha/index.html) sind Daten, Darstellung und Zustandslogik bereits getrennt.

Als erster technischer Schritt wird dieser Bestand in überschaubare Dateien aufgeteilt. Vorgesehene Struktur innerhalb des Web-Projekts:

| Geplanter Bereich | Zuständigkeit |
|---|---|
| `index.html` | Grundgerüst und Ansichten |
| `styles/` | Gestaltung und mobile Darstellung |
| `data/` | Veröffentlichter Aufgabenbestand, Materialien und Themen |
| `js/renderers/` | Darstellung der vier Antwortformen und der Materialien |
| `js/rounds.js` | Rundenstart, Navigation und Abschluss |
| `js/scoring.js` | Auswertung der Antworten |
| `js/learning.js` | Wiederholung, Fortschritt und Übernahme alter Ergebnisse |
| `js/storage.js` | Speicherung und Übernahme vorhandener Lernstände |
| `content/` | Redaktionelle Auswahl und Web-Bearbeitungen |
| `tools/` | Gezielte Übernahme aus ScanReha und Erzeugung der Web-Daten |

Die Aufteilung erfolgt während der Arbeit an den jeweils betroffenen Funktionen. Ein vollständiger Neuaufbau der Anwendung ist dafür nicht nötig.

Der veröffentlichte Aufgabenbestand wird aus einer eindeutigen redaktionellen Quelle erzeugt. Aufgaben werden anschließend nicht parallel im HTML und in mehreren Lösungslisten gepflegt.

**3. Einen kontrollierten Übernahmeweg aus ScanReha schaffen**

Ausgangspunkt sind das [Manifest](<C:/Users/SYSTEM-C/Desktop/gpt/projekte/scanreha/Prüfungen -strukturiert/aufgabenpool/manifest.json>) und die dort benannten JSONL-Dateien. Der dokumentierte Stand ist Poolrevision 22 mit 797 Aufgaben. Die in `aydin.md` beschriebenen 246 bereits geschlossenen Aufgaben mit gebundener Lösung sind ein Kandidatenbestand, kein pauschaler Importauftrag.

Der Übernahmeweg besteht aus vier Schritten:

1. **Aufgaben ausdrücklich auswählen.** Eine kleine Auswahldatei benennt Quellaufgaben, gewünschte Web-Varianten und Fachthemen.
2. **Benötigte Bestandteile auflösen.** Aufgabenrevision, passende Lösungen, Materialien und Abhängigkeiten werden zusammengeführt.
3. **Web-Bearbeitung ergänzen.** Hilfen, kurze Rückmeldungen, verständliche Formulierungen und gegebenenfalls neue Antwortalternativen werden separat gepflegt.
4. **Statische Web-Daten erzeugen.** Nur ausgewählte Aufgaben und ihre benötigten Materialien gelangen in die Web-Ausgabe.

Pro Web-Aufgabe werden mindestens festgehalten:

- eigene Aufgaben-ID und Inhaltsrevision;
- Quellprojekt, Quell-ID und verwendete Quellrevision;
- Fachbereich, Unterthema und gegebenenfalls Rechenmethode;
- Antwortform, stabile Antwort-IDs und Lösung;
- Materialverweise und Voraussetzungen;
- kurze Erklärung, optionale Hilfe und ausführliche Erläuterung;
- Kennzeichnung einer Übernahme oder redaktionellen Umgestaltung;
- gemeinsame Variantenkennung für fachlich zusammengehörige Aufgaben.

Die bestehenden [ScanReha-Regeln für Materialien und Lösungen](<C:/Users/SYSTEM-C/Desktop/gpt/projekte/scanreha/Prüfungen -strukturiert/AUFGABENPOOL.md>) bleiben maßgeblich: Erforderliche Materialien müssen mitkommen, Materialabhängigkeiten werden aufgelöst, und Lösungen müssen zur Aufgabenfassung passen. Mehrere widersprüchliche Lösungen werden nicht automatisch auf eine reduziert.

Web-spezifische Formulierungen und Auswahlalternativen bleiben im Web-Projekt. Der ScanReha-Pool muss dafür nicht verändert werden.

**4. Einen kleinen, fachlich gemischten Startbestand entwickeln**

Die erste nutzbare Fassung erhält **sechs Lernkerne mit insgesamt ungefähr 18 Aufgaben**, verteilt auf alle drei Fachbereiche. Diese Größe eignet sich zur Erprobung des Ablaufs und der unterschiedlichen Antwortformen.

| Fachbereich | Vorgeschlagene Lernkerne | Ausgangsmaterial |
|---|---|---|
| WiSo | Wirtschaftsbereiche; Arbeitsschutz und Informationen aus Statistiken | „Wirtschaftsbereiche“, „Unfallstatistik auswerten“, geeigneter Web-Bestand |
| Warenwirtschaft und Kalkulation | Warenannahme; Rabatt und Skonto | „Warenannahme ordnen“, „Bezugspreis mit Rabatt und Skonto“ |
| Verkauf und Werbemaßnahmen | Beratung; Zusammenarbeit im Verkauf | Geeigneter Web-Bestand und „Voraussetzungen erfolgreicher Teamarbeit“ |

Je Lernkern werden möglichst drei unterschiedliche Leistungen abgedeckt: eine Situation verstehen, Fachwissen anwenden und eine veränderte Situation bearbeiten. Diese Varianten müssen nicht unmittelbar hintereinander erscheinen.

Die redaktionelle Arbeit umfasst die fachliche Lösung, plausible falsche Antworten, kurze Rückmeldungen und geeignetes Material. Zahlenänderungen werden nicht ungeprüft automatisch erzeugt. Rechtsbezogene Inhalte erhalten bei ihrer Bearbeitung eine Prüfung anhand aktueller Primärquellen.

Für den vorhandenen Web-Bestand gilt: **Die 15 Aufgaben mit freier Zahlen-, Uhrzeit- oder Betragseingabe werden in geschlossene Aufgaben umgearbeitet**, bevor sie im neuen Ablauf angeboten werden. Die übrigen vorhandenen Aufgaben bleiben als Bestand nutzbar; ihre Aufnahme in den kleinen Startbestand erfolgt gezielt.

Der in Etappe 6 umgesetzte Ausbau umfasst 24 Lernkerne und 72 Aufgaben. Für die erste Fassung war zunächst der kleine 18er-Bestand vorgesehen.

**5. Antwortformen, Materialien und Rückmeldungen vereinheitlichen**

Die vier Antwortformen erhalten dieselbe Grundbedienung: Aufgabe ansehen, Antwort wählen, prüfen, Rückmeldung lesen und weitergehen.

- **Einfach- und Mehrfachauswahl:** Bestehende Bedienung übernehmen und von festen Aufgabennummern lösen.
- **Zuordnung:** Die bisherige Sonderlösung für zwei Gesetzesfelder durch eine allgemeine Zuordnung ersetzen. Je Aufgabe festlegen, ob Antworten mehrfach verwendet werden dürfen.
- **Reihenfolge:** Einträge über Hoch-/Runter-Schaltflächen oder Positionsauswahl ordnen. Ziehen kann ergänzend angeboten werden, ist aber nicht erforderlich.
- **Materialien:** Tabellen, Bilder und Dokumentauszüge zusammen mit der Aufgabe zugänglich machen. Größere Belege erhalten eine vergrößerbare Ansicht mit zuverlässiger Rückkehr zur Frage.

Reihenfolgelösungen verwenden die in ScanReha hinterlegten `ordered_entry_ids`. Gedruckte Lösungscodes werden nicht als unmittelbare Reihenfolge interpretiert.

Die direkte Rückmeldung enthält den entscheidenden fachlichen Grund. Eine konkrete Fehlererklärung wird nur angezeigt, wenn die gewählte Antwortalternative tatsächlich einem definierten Fehlweg entspricht. Weitere Erläuterungen und vorhandene Lernkarten bleiben freiwillig erreichbar. Automatisch eingeblendete Themenkarten entfallen während der Aufgabenbearbeitung.

„Kleine Hilfe“, „Weiß ich noch nicht“ und „Überspringen“ werden als unterschiedliche Vorgänge gespeichert. Eine mit Hilfe gelöste oder bereits erklärte Aufgabe zählt nicht als selbstständig gelöster Erstversuch.

**6. Runden und Lernstände sauber trennen**

Dieser Schritt betrifft das Verhalten der bisherigen [WiSo-App](C:/Users/SYSTEM-C/Desktop/gpt/projekte/aydinreha/wiso.html): Themen- und Wiederholungsrunden schreiben dort Antworten in den Hauptdurchgang zurück. Die neue kurze Runde führt bereits unabhängige Versuche in `js/rounds.js`.

Jede Runde besitzt künftig eigene Antworten, verwendete Aufgabenrevisionen, Hilfen, Bearbeitungszustände und Ergebnisse. Der übergreifende Fortschritt wird aus diesen Versuchen abgeleitet.

Die Aufgabenauswahl bleibt bewusst einfach:

- ohne Themenwahl eine ausgewogene Mischung aus den drei Fachbereichen;
- bei Themenwahl Aufgaben aus dem gewählten Bereich;
- eine Wiederholungsrunde aus falschen, übersprungenen oder gemerkten Aufgaben;
- zusammengehörige Varianten möglichst über mehrere Runden verteilen;
- keine sofortige Dauerschleife mit derselben falsch beantworteten Frage.

Es gibt kein persönliches Kompetenzmodell, keine automatisch angenommene Lernschwäche und keine individuell erzeugte Lernroute. Der Fortschritt zeigt sachlich, welche Themen bearbeitet wurden und was selbstständig oder mit Hilfe gelungen ist.

Eine Dreier-Runde bleibt bei drei Aufgaben. Hilfen sind Bestandteile einer Aufgabe. Zusammenhängende Fälle belegen die tatsächlich benötigte Anzahl von Aufgabenplätzen; längere Fälle erscheinen in einer entsprechend angekündigten Runde.

Vorhandene Daten aus dem Speicherstand `wiso40v2` werden über eine ausdrückliche Zuordnung der alten Aufgaben-IDs übernommen. Bei geänderter Antwortstruktur bleiben frühere Ergebnisse historisch erhalten, gelten aber nicht als Antwort auf die neue Fassung. Mangels bisher erfasster Hilfen darf aus alten Ergebnissen keine neue Aussage zur selbstständigen Beherrschung abgeleitet werden.

**7. Einen getrennten Modus „Ohne Hilfe ausprobieren“ ergänzen**

Nach dem kurzen Lernablauf folgt ein Durchgang mit zunächst sechs gemischten Aufgaben:

- Antworten können bis zur Abgabe geändert werden.
- Hilfen, Lösungen und erklärende Lernkarten erscheinen erst danach.
- Auch mit offenen Antworten kann abgegeben werden.
- Offene Antworten werden in der Auswertung ausdrücklich ausgewiesen.
- Der Versuch verändert keine Antworten anderer Runden.
- Eine Zeitbegrenzung bleibt eine spätere, ausdrücklich wählbare Erweiterung.

Die bisherige pauschale Bewertung mit vier Punkten wird für neue Formate vereinheitlicht: intern ein Ergebnis zwischen null und eins, daraus bei Bedarf eine Punktanzeige. Zuordnungen erhalten anteilige Bewertung ohne die bisherige ganzzahlige Abrundung. Bei Reihenfolgen ist zunächst nur die vollständig richtige Folge als richtig vorgesehen; abweichende Stellen können trotzdem erklärt werden. Die Mehrfachauswahl berücksichtigt richtige und falsche Markierungen.

Diese Bewertung wird als **Übungsbewertung** bezeichnet. Sie behauptet keinen offiziellen Prüfungsschlüssel.

**8. Umsetzung in klaren Etappen**

| Etappe | Konkretes Ergebnis | Status am 26.09.2026 |
|---|---|---|
| 1. Grundlage | Gemeinsames Aufgabenformat, getrennte Inhalte und Logik, Datenübernahme | Abgenommen: bestehende Aufgabe durchläuft Format und Speicherung |
| 2. Vollständige kurze Runde | Drei Aufgaben, Hilfe, Rückmeldung, Unterbrechung und Abschluss | Abgenommen: vollständige Bearbeitung und Fortsetzen einschließlich Speicherfehlern |
| 3. Kleine Inhaltsfassung | Sechs Lernkerne, 18 Aufgaben, alle vier Antwortformen und Materialien | Abgenommen: alle Aufgaben bearbeitbar, Lösungen und Materialrückkehr geprüft |
| 4. Alltagserprobung | Geplante Nutzung über ungefähr eine Woche | Auf Nutzerwunsch übersprungen |
| 5. Wiederholung und Prüfungstraining | Wiederholung, Merkliste, Themenwahl, sechs Aufgaben ohne Soforthilfe, Fortschritt, alte Lernstände | Abgenommen: getrennte Versuche, gemeinsame Abgabe, keine vorzeitige Lösungsanzeige |
| 6. Ausbau | 24 Lernkerne, 72 Aufgaben, gezielte Altübernahmen, drei Fallfolgen | Umgesetzt und abgenommen; Auswahl, Bewertung, Fortsetzen und Altzuordnung geprüft |

Die automatisierte Abnahme von Etappen 1 bis 3, 5 und 6 ist abgeschlossen. Sie ersetzt keine Aussage über eine mehrtägige Alltagserprobung. Der Nutzer hat deren Überspringen ausdrücklich beauftragt.
