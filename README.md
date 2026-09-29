# Areha – Wissen & Training

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


## Korrekturen aus Inspektionslauf 3

Die sieben Oberflächenbefunde N1–N7 sind im gemeinsamen Code bearbeitet: kompakterer Themenpfad, natives Aufklappzeichen für ausführliche Erklärungen, eigener Verschiebebereich für vergrößerte Bilder samt Hinweis, eindeutiger Hilfehinweis, Textschrift für Auswahlzähler sowie korrigierte Abstände in Themenwahl und Wissenskarten. Der Laufbericht ist hinsichtlich Wertungen, Beleggrenzen und Aufgabenbezug berichtigt. Einzelheiten stehen in der [Umsetzungsübersicht zu Lauf 3](aydinreha-inspektion/2026-09-26-lauf-3/umsetzung.md).

`Areha.html` wurde erfolgreich neu erzeugt (1,65 MiB). Aufgaben und Inhaltsrevisionen bleiben unverändert. Vorgesehene JavaScript-Fassungen und Berichts-JSON wurden vor dem Schreiben syntaktisch geprüft; gemäß Anschlussprüfungsverbot keine anschließenden Tests oder Browserabnahme. Die alten Bilder dokumentieren den früheren Stand.

## Audit der Bedienlogik vom 26.09.2026

Ein [Audit mit Funktionsprüfungen](aydinreha-inspektion/2026-09-26-audit-bedienlogik/befund.md) hat die Korrekturen zu Rückblick und Selbstcheck-Abgabe geprüft. Drei Abweichungen sind behoben:

- Der Rückblick früherer Runden gibt für Aufgaben eines offenen Selbstchecks keine Lösung mehr frei.
- Der Fokus kehrt nach „Weiter bearbeiten“ auch bei Klick in Safari zum Auslöser zurück.
- Überarbeitete, bereits erledigte Aufgaben zeigen auch in einer offenen Runde die aktuelle Lösung, wie es ihr Hinweis ankündigt.

Das Prüfskript läuft in Node mit jsdom (DOM-Nachbildung, keine Browsersteuerung) und bestand mit 108 von 108 Prüfungen. `npm test` bestand, ein Test war mangels ScanReha-Pool übersprungen. `npm run check` meldete aktuelle Daten, und `Areha.html` wurde neu erzeugt. Browserprüfungen wurden nicht ausgeführt.

## Lokale Korrekturen aus Inspektionslauf 2 vom 26.09.2026

Die [Befunde des zweiten Laufs](aydinreha-inspektion/2026-09-26-lauf-2/befund.md) wurden am lokalen Code nachvollzogen und bearbeitet. Schmale Ergebnislisten setzen den Status unter den Titel. Rückblicke auf überarbeitete Aufgaben zeigen das gespeicherte historische Ergebnis sowie Lösung und Erklärung der aktuellen Fassung, ohne alte Antworten neu zu bewerten. Die Selbstcheck-Abgabe hat je Aufgabe einen Auslöser; während der Bestätigung sind die anderen Hauptaktionen ausgeblendet. Bildtextfassungen sind standardmäßig geöffnet.

Weitere Korrekturen betreffen Quellenbeschreibungen, Atlasbeschriftungen, Themenauswahl, Auswahlzähler, Hilfehinweis, Typografie, Datum und Einzeldatei-Fußbereich. Entscheidungen zu allen 20 Oberflächenbefunden und die Berichtigung des Laufberichts stehen in der [Umsetzungsübersicht](aydinreha-inspektion/2026-09-26-lauf-2/umsetzung.md). Aufgabenbestand und Inhaltsrevisionen bleiben unverändert. `npm run build:einzeldatei` hat die weitergebbare `Areha.html` aus den korrigierten Quellen erfolgreich geschrieben (1,64 MiB).

Prüfgrenze: Ursachen vor dem Schreiben im Code abgeglichen; vorgesehene JavaScript-Fassungen vor dem Schreiben auf Syntax geprüft. Keine anschließenden Datei-, Test- oder Browserprüfungen gemäß globalem Anschlussprüfungsverbot. Die alten Bilder und Abnahmen belegen den früheren Stand, keine Abnahme dieser Korrekturen.

## Recherchierte Wissenskarten vom 26.09.2026

Der Wissensatlas enthält jetzt **30 eigenständige Vertiefungen und 28 zugeordnete Quellen**: je eine Karte für alle 8 WiSo-, 13 Warenwirtschafts- und 9 Verkaufsthemen. Die Karten verbinden verständliche Erklärungen mit eigenen Beispielen, vollständigen Rechenwegen, typischen Denkfehlern und einem Merksatz. Sie stehen in `content/wissen.js` und werden vor den vorhandenen Aufgabenbeispielen angezeigt.

Rechts-, Steuer- und Arbeitsschutzaussagen wurden an den im [Recherchevermerk](docs/WISSENSATLAS-RECHERCHE-2026-09-26.md) genannten aktuellen Primärquellen abgeglichen. Quellenzugriff und fachliche Redaktion erfolgten auf Textebene; keine Videos oder interaktiven Rechner wurden geprüft. Rechenbeispiele und Skriptsyntax wurden vor dem Schreiben ausgewertet. Gemäß Anschlussprüfungsverbot keine anschließenden Tests oder Browserabnahme. Die folgenden Angaben zu zuvor leeren Artikellisten beschreiben den historischen Grundlagenstand.

Lernoberfläche für Verkäuferinnen und Verkäufer mit einem Wissensatlas, verständlichen Erklärungen und kurzen Übungsrunden mit geschlossenen Antworten. Die Anwendung ist eine statische Website ohne Benutzerkonto und Backend; der Übungsstand bleibt im Browser.

## Lokale Überarbeitung von Sprache und Auftritt vom 26.09.2026

Die Befunde zu Werbesprache und aufdringlicher Gestaltung wurden im lokalen Oberflächencode bearbeitet. Die Startseite beginnt mit einer kurzen Sachüberschrift und dem direkten Rundeneinstieg. Fachbereiche verwenden die Namen aus dem Katalog; der Modus mit gemeinsamer Abgabe heißt einheitlich „Selbstcheck“. Slogans, Zierbild, Scheinnummern und interne ↗-Pfeile entfallen. Die dunklen Flächen und zurückhaltenden Farbakzente bleiben erhalten, Überschriften sind kleiner und die Themen-Seitenleiste läuft nicht mehr mit.

Bedienhinweise sind neutral formuliert. In 31 Aufgaben wurden zusätzlich persönliche Anreden in Hilfen, Erklärungen und Fehlwegrückmeldungen sachlich umformuliert und die Inhaltsrevisionen erhöht. Aufgabenstellungen, Antwortalternativen und Lösungen bleiben unverändert. Die lokalen Anwendungsdaten wurden mit dem vorhandenen Build erfolgreich erzeugt; der Bestand bleibt bei 148 Aufgaben. Die Entscheidungen zu allen Befundnummern stehen in [Umsetzung Sprache und Auftritt](aydinreha-inspektion/2026-09-26/umsetzung-sprache-und-auftritt.md).

Der Datenbuild mit seinen integrierten Format- und Revisionskontrollen lief erfolgreich. Separate Tests, Kontrolllesungen und Browserprüfungen wurden gemäß Anschlussprüfungsverbot nicht ausgeführt. Bestehende Prüferwartungen für die geänderten Beschriftungen wurden angepasst, aber nicht ausgeführt. Frühere Abnahmen belegen diesen neuen Stand nicht. Die folgende Beschreibung des ersten UI-Ausbaus ist historisch.

## Neuer lokaler Ausbau: Oberfläche und Wissensatlas

Am 26.09.2026 wurde auf neuen Nutzerauftrag eine moderne Oberfläche mit dezenten Technik- und Fantasy-Motiven angelegt. Die Startseite bietet eigenständige Einstiege zum Verstehen und Üben, Fachgebietskarten und eine gegliederte Trainingsauswahl. Die Wissensansicht umfasst Themensuche, Fachbereichsfilter und direkt verlinkbare Themenseiten mit den vorhandenen Erklärungen und Materialien.

Zusätzliche Lernartikel sowie redaktionell geprüfte Artikel-, Video- und Quellenlinks können über `content/wissen.js` ergänzt werden. Die Listen sind bewusst leer: Neue Texte, Videos und externe Quellen wurden nicht recherchiert. Format und Einbindung stehen in [WISSENSATLAS.md](docs/WISSENSATLAS.md). Neue Gestaltung: `styles/atlas.css`; Darstellung der Wissensinhalte: `js/knowledge.js`.

Während eines Selbstchecks ist der Wissensatlas bis zur Abgabe gesperrt. Das Nachschlagen passender Themen in einer normalen offenen Runde zählt als Unterstützung. Lesen ohne laufende Runde verändert den Übungsfortschritt nicht.

Dieser neue Ausbau wurde ausschließlich lokal geschrieben und gemäß Anschlussprüfungsverbot anschließend nicht getestet oder visuell geprüft. Die folgenden historischen Abnahmen bestätigen nicht den neuen UI-/UX-Stand.

## Poolausbau vom 26.09.2026

Auf die Frage, ob alle sinnvoll nutzbaren Aufgaben des ScanReha-Pools eingearbeitet sind, ergab die Sichtung: nein, vorher waren es nur acht. Übernommen wurden jetzt **76 weitere geschlossene Aufgaben mit gebundener Lösung**, 57 in Warenwirtschaft und 19 im Verkauf. Der Trainer umfasst damit **148 Aufgaben in 30 Lernkernen**.

- Aufgabentext, Antwortalternativen und Lösung stammen unverändert aus dem Pool (`origin.kind: adopted`, keine `overrides`). Neu geschrieben sind Hilfe, kurze und ausführliche Erklärung sowie Fehlwege.
- **WiSo wurde auf ausdrücklichen Wunsch nicht bearbeitet:** keine neuen WiSo-Aufgaben, keine Änderungen an WiSo-Lernkernen, -Unterthemen oder -Auszügen und keine Aufgaben aus WiSo-Prüfungsteilen.
- Aufgaben mit freier Zahlen-, Uhrzeit- oder Texteingabe wurden auftragsgemäß nicht in Auswahlaufgaben umgeformt.
- Rechtsbezogene Aufgaben sind zurückgestellt, weil die vorgeschriebene Prüfung an Primärquellen in dieser Umgebung nicht möglich war (`gesetze-im-internet.de` durch die Netzrichtlinie gesperrt).
- Neue Lernkerne: Einkauf planen und Kaufarten, Warenwirtschaftssystem nutzen, Artikeldaten erfassen, Lagerung und Warenpflege, Kosten, Umsatzsteuer und Bilanz sowie Service und Bedienungsformen.
- Der Build übernimmt jetzt auch Formulare, Abbildungen mit Textfassung und Dokumentauszüge mit Tabellen aus ScanReha. Quellauszüge führen hilfreiche Rahmenmaterialien vollständig mit, sofern die Aufgabe solche hat.
- Antwortalternativen brechen lange Wörter jetzt um. Anlass war das Wort „Reservierungsmöglichkeiten“, das bei 320 Pixeln das Lösungszeichen über den Rand schob.

Die Einordnung aller 797 Poolaufgaben mit Begründung steht in [POOLSICHTUNG.md](docs/POOLSICHTUNG.md).

**Prüfungen zu diesem Ausbau:** 77 von 77 Node-Prüfungen bestanden; `npm run check` und `npm run auszug:scanreha -- --check` melden aktuelle Daten. Die Browserprüfung `--etappe6` bestand mit 756 von 756 Prüfungen, darunter alle 148 Aufgaben bei 320 Pixeln Breite und die Themenwahl aller 30 Lernkerne. Die vollständige Browserprüfung meldet nach 35 bestandenen Prüfungen zwei Fehlschläge („Rückmeldung ‚Richtig‘ mit Hinweis auf Hilfe“, „‚Kurz üben‘ per Tab erreichbar“) und bricht danach mit einer Zeitüberschreitung ab. Auf dem Stand vor diesem Ausbau verläuft sie identisch. Vermutlich hängt das mit dem ungeprüften UI-/UX-Ausbau zusammen; bearbeitet wurde es hier nicht.

## Stand vom 26.09.2026

**Etappen 1, 2, 3, 5 und 6 sind lokal umgesetzt und selbst abgenommen. Die Alltagserprobung aus Etappe 4 wurde auf Nutzerwunsch übersprungen.**

| Etappe | Ergebnis |
|---|---|
| 1. Grundlage | Gemeinsames Aufgabenformat, getrennte Inhalte und Logik, gezielte Übernahme aus ScanReha und dem Web-Bestand |
| 2. Kurze Runde | Drei Aufgaben mit Hilfe, Rückmeldung, Unterbrechung, Speicherung und Abschluss |
| 3. Kleine Inhaltsfassung | 18 Aufgaben in sechs Lernkernen, alle vier Antwortformen, vergrößerbare Materialien |
| 4. Alltagserprobung | Auf ausdrücklichen Nutzerwunsch übersprungen |
| 5. Wiederholung und Prüfungstraining | Merkliste, Wiederholung, Themenwahl, längeres Üben, sechs Aufgaben ohne Soforthilfe, Fortschritt und Übernahme alter Lernstände |
| 6. Inhaltsausbau | 72 Aufgaben in 24 Lernkernen, einzelne Lernkerne wählbar, drei Fallrunden und zehn weitere gezielte Altaufgaben |

Der verbindliche Arbeitsstand steht in [Planung Aydinreha.md](<Planung Aydinreha.md>). Die bisherige App bleibt als `wiso.html` erreichbar. Die Änderungen und die Abnahme betreffen den lokalen Projektstand.

Die lokale Einordnung vom 26.09.2026 bezieht sich auf den Abschluss von Etappe 6 im Chat „Aydinreha-Planung aktualisieren“. Aufgabenbestand, Katalog und eingesehene Funktionen entsprachen diesem beschriebenen Stand; ein weiterer funktionaler Ausbau war nicht erkennbar. Aufgabenbestand und Katalog hat der spätere Poolausbau erweitert. Die unten dokumentierten Tests wurden bei dieser Einordnung nicht erneut ausgeführt.

## Benutzung

Die Anwendung wird auf GitHub Pages mit `index.html` als Einstieg bereitgestellt. Die verknüpften Dateien in `styles/`, `js/`, `data/`, `content/` und `assets/` gehören dazu.

Änderungen an Oberfläche und Wissensartikeln werden direkt in diesen Dateien gepflegt. Nach Aufgabenänderungen erzeugt `npm run build` die Aufgabendaten. Ein zusätzlicher HTML-Export entfällt.

Die folgenden Bedienhinweise dokumentieren den früheren Funktionsumfang; aktuelle Änderungen stehen oben.

- **Kurz üben:** Drei Aufgaben, möglichst aus verschiedenen Fachbereichen und Lernkernen.
- **Länger üben:** Sechs Aufgaben mit demselben Lernablauf und Sofortrückmeldung.
- **Thema wählen:** Drei Aufgaben aus dem ausgewählten Fachbereich oder gezielt aus einem seiner Lernkerne.
- **Einen zusammenhängenden Fall üben:** Drei Aufgaben mit gemeinsamen Angaben und fester Reihenfolge. Verfügbar sind Nachbestellung, Angebotsvergleich und Auswertung einer Verkaufsaktion. Jeder Fall besitzt einen eigenen Abschluss und lässt sich nach Unterbrechung fortsetzen.
- **Wiederholen:** Eine eigene Runde mit bis zu drei falschen, teilweise richtigen, übersprungenen, unbeantworteten oder gemerkten Aufgaben. Eine spätere richtige Antwort entfernt den Wiederholungsbedarf; gemerkte Aufgaben bleiben bis zum Entfernen der Merkmarkierung verfügbar.
- **Selbstcheck:** Sechs gemischte Aufgaben. Alle Antworten bleiben bis zur gemeinsamen Abgabe änderbar. Hilfen, Lösungen und Bewertungen erscheinen erst danach, auch im Rückblick früherer Runden mit denselben Aufgaben. Bei offenen Antworten weist die App vor der Abgabe darauf hin; die Auswertung benennt sie ausdrücklich und zeigt die Übungsbewertung.
- **Fortschritt:** Letzter gespeicherter Bearbeitungsstand pro aktueller Aufgabe, nach Fachbereichen gegliedert, dazu Merkliste, abgeschlossene Runden und alte Ergebnisse. „Richtig ohne Hilfe“ ist keine Aussage über einen Erstversuch oder ein Kompetenzniveau. Es werden bis zu 200 Runden gespeichert.

In Übungsrunden stehen folgende Aktionen bereit:

- **Hilfe** blendet einen Hinweis ein; eine anschließend richtig gelöste Aufgabe zählt als „mit Hilfe richtig“.
- **Prüfen** bewertet die Antwort und zeigt Rückmeldung, kurze Erklärung, gegebenenfalls den gewählten Fehlweg sowie eine aufklappbare ausführliche Erklärung.
- **Weiß ich noch nicht** zeigt Lösung und Erklärung ohne Bewertung.
- **Überspringen** stellt die Aufgabe zurück; bis zum Abschluss bleibt sie bearbeitbar. Eine markierte, aber ungeprüfte Antwort hält den Abschluss nicht auf und wird nicht gewertet. Im Rückblick erscheinen Lösung und Erklärung.
- **Merken** nimmt die Aufgabe unabhängig vom Ergebnis in die Merkliste und Wiederholung auf.
- **Unterbrechen**, Schließen oder Neuladen sind jederzeit möglich. Die Startseite bietet „Runde fortsetzen“ an. Schlägt das Speichern fehl, bleibt ein sichtbarer Hinweis; die App bestätigt dann keine erfolgreiche Speicherung.

Jede Runde hat eigene Antworten. Beim Start eines anderen Modus während einer offenen Runde fragt die App vor deren Beendigung nach. Die bisherigen Antworten bleiben in ihrem eigenen Versuch gespeichert.

## Alte Lernstände

Unter „Fortschritt“ lässt sich `wiso40v2` einmalig ausdrücklich übernehmen, sofern dieser Speicherstand im selben Browser und Seitenkontext vorhanden ist. Der bisherige Speicher wird nur gelesen und bleibt unverändert.

Der aktuelle Aufgabenbestand enthält elf ausdrückliche Altzuordnungen: 33, 36, 39, 40, 46, 59, 60, 67, 79, 106 und 110. Acht Antwortstrukturen sind unverändert. Bei den umgestalteten Aufgaben 39, 60 und 106 bleiben Altantworten historisch. Bereits importierte Rohantworten werden bei neu verfügbarer Zuordnung ergänzt, ohne den Altspeicher erneut zu lesen. Alte Ergebnisse zählen nicht als „ohne Hilfe“ gelöst. Einzelheiten stehen in [Datenübernahme](docs/DATENUEBERNAHME.md).

## Aufbau

| Bereich | Zuständigkeit |
|---|---|
| `index.html` | Grundgerüst und Ansichten: Start, Runde, Abschluss, Fortschritt |
| `wiso.html` | Bisherige WiSo-App mit 140 Aufgaben |
| `styles/` | Gestaltung, mobile Darstellung, Schriften |
| `data/aufgaben.js` | Veröffentlichter Aufgabenbestand und Zuordnung ausgewählter Altaufgaben; erzeugt |
| `js/format.js` | Gemeinsames Aufgabenformat und Prüfregeln |
| `js/scoring.js` | Übungsbewertung aller vier Antwortformen |
| `js/rounds.js` | Auswahl, getrennte Rundenzustände, Abschluss und Prüfungsabgabe |
| `js/learning.js` | Wiederholung, Fortschritt und Übernahme alter Ergebnisse |
| `js/storage.js` | Speicherung unter `areha.v1` |
| `js/renderers/` | Darstellung von Text, Tabellen, Bildern und allen vier Antwortformen |
| `js/app.js` | Ansichtssteuerung |
| `content/` | Redaktionelle Quelle: Fachbereiche, Auswahl, Quellauszüge, Web-Bearbeitungen |
| `content/katalog.json` | Lernkerne und Fallfolgen; Aufgaben bleiben einzeln redaktionell gepflegt |
| `tools/` | Quellauszüge, Build und Browserprüfung |
| `test/` | Automatisierte Prüfungen mit `node --test` |
| `docs/` | [Aufgabenformat](docs/AUFGABENFORMAT.md), [Datenübernahme](docs/DATENUEBERNAHME.md) und [Poolsichtung](docs/POOLSICHTUNG.md) |

## Befehle

Node.js ab Version 18. Anwendung, Build und Node-Tests benötigen keine weiteren Pakete. Nur die Browserprüfung benötigt Playwright und einen Chromium-Browser; Playwright wurde für die lokale Abnahme ohne Änderung der Projektabhängigkeiten installiert.

| Befehl | Wirkung |
|---|---|
| `npm test` | Format, Bewertung, Runden, Speicherung, Lernstand, Übernahme, Werkzeuge und Inhalte prüfen |
| `npm run build` | `data/aufgaben.js` aus `content/` erzeugen |
| `npm run check` | Prüfen, ob `data/aufgaben.js` und der Web-Auszug aktuell sind |
| `npm run auszug:scanreha -- --pool <Pfad>` | ScanReha-Auszüge erzeugen; `--check` prüft nur |
| `npm run auszug:wiso` | Auszüge aus `wiso.html` erzeugen |
| `npm run browserpruefung -- --chromium <Pfad>` | Vollständige Browserprüfung |
| `npm run browserpruefung -- --etappe5 --chromium <Pfad>` | Gezielt die Browserfälle für Etappe 5 ausführen |
| `npm run browserpruefung -- --etappe6 --chromium <Pfad>` | Alle Aufgaben, Lernkernwahl, Fallrunden und neue Altzuordnungen prüfen |

## Aufgabenbestand

**148 Aufgaben in 30 Lernkernen**, mindestens drei Aufgaben pro Lernkern: 24 in WiSo, 81 in Warenwirtschaft und 43 im Verkauf.

| Fachbereich | Lernkerne |
|---|---|
| WiSo (8) | Wirtschaftsbereiche; Arbeitsschutz und Statistik; Haushalt und Prozentrechnung; Erlöse, Kosten und Ergebnis; Preisbildung; wirtschaftlich handeln; Unternehmensziele; Ressourcen und Verpackungen |
| Warenwirtschaft (13) | Warenannahme; Einkauf und Kaufarten; Rabatt und Skonto; Nachbestellung; Lagerbestände; Lagerkennzahlen; Warenwirtschaftssystem; Artikeldaten; Lagerung und Warenpflege; Verkaufspreise; Kosten, Umsatzsteuer und Bilanz; Angebotsvergleich; Rechnung und Kasse |
| Verkauf (9) | Beratung; Zusammenarbeit; Gesprächsführung; Nutzen und Einwände; Service und Bedienungsformen; Reklamationen; Warenpräsentation; Werbung; Aktionsauswertung |

84 Aufgaben beruhen auf ScanReha-Auszügen, elf auf dem bisherigen Web-Bestand und 53 sind eigene Übungsaufgaben. Etappe 6 ergänzte 54 Aufgaben: zehn gezielte Übernahmen beziehungsweise Umgestaltungen und 44 eigene Aufgaben. Der Poolausbau ergänzte 76 unveränderte ScanReha-Übernahmen. Die bisherige App bleibt mit allen 140 Altaufgaben zugänglich; die gezielte Erweiterung ist kein vollständiger Import dieses Bestands.

Die drei Fallrunden nutzen zusätzliche Tabellen. Teilaufgaben bleiben auch nach einer falschen oder übersprungenen Antwort lösbar, weil ihre benötigten Angaben jeweils verfügbar sind. Neue Lernkerne und Fälle lassen sich über den Katalog und vorhandene Aufgabenformate ergänzen.

Zuordnungen verwenden Auswahlfelder und beachten die aufgabenspezifische Mehrfachverwendung. Reihenfolgen werden über Hoch-/Runter-Schaltflächen verändert; eine unveränderte Folge kann ausdrücklich übernommen werden.

„Material vergrößern“ öffnet Tabellen, Texte und Bilder in einer Dialogansicht. „Zurück zur Aufgabe“ oder Escape schließt sie und stellt den Fokus wieder auf die öffnende Schaltfläche. Der fiktive Lieferbeleg hat eine vollständige Textfassung und liegt lokal unter `assets/materialien/`.

## Dokumentierte Abnahme vom 26.09.2026

Die folgenden Ergebnisse stammen aus dem damaligen Umsetzungslauf im [Bezugs-Chat](codex://threads/01a0dbcb-444f-7f10-a20c-8c867243ce1d). Sie sind keine neuen Prüfergebnisse des späteren lokalen Dokumentationsabgleichs.

- **70 Node-Prüfungen abgedeckt, keine übersprungen.** Nach einem Fehler beim Speichern eines leeren Fallfelds wurden normale Runden korrigiert. Alle 13 betroffenen Speicher- und Etappe-6-Prüfungen bestanden im erneuten Lauf; die übrigen 57 waren im Gesamtlauf bereits erfolgreich.
- **386 von 386 Prüfungen im abschließenden Browserlauf für Inhalte und Etappe 6 bestanden.** Hinzu kommen die bereits erfolgreichen 88 Browserprüfungen für die kurze Runde und Etappe 5. Insgesamt umfasst die vollständige Browserprüfung jetzt 474 Fälle.
- Alle 72 Aufgaben wurden bei 320 Pixeln Breite beantwortet, gespeichert, neu geladen und bewertet. Dazu kommen Materialrückkehr, Rückblick, Auswahl aller 24 Lernkerne, drei vollständige Fallrunden und Zuordnung früher importierter Altdaten.
- Neue Rechenlösungen sind durch unabhängige Rechnungen geprüft. Umgearbeitete freie Zahlenantworten bleiben im Altbestand historisch.
- Der direkte amtliche Rechtsquellenabgleich der Wegeunfall-Aufgabe bleibt dokumentiert. Neue Rechenaufgaben nennen ihre Prozentsätze ausdrücklich als Vorgabe; Reklamationsaufgaben behandeln Gespräch und Dokumentation.
- Der Build ist erzeugt; Quellauszüge und veröffentlichte Daten wurden im Node-Lauf bestätigt. Der vorhandene ScanReha-Pool war für den Quellenabgleich verfügbar.

Echte Mobilgeräte, Safari/iOS, Firefox und Screenreader wurden nicht geprüft. Breite Tabellen können seitlich verschoben werden; die App weist darauf hin. Die mehrtägige Alltagserprobung wurde ausdrücklich übersprungen.

## Weiterer Ausbau

Die sechs geplanten Etappen sind umgesetzt beziehungsweise ausdrücklich übersprungen. Weitere Altaufgaben und Fallfolgen können bei Bedarf gezielt ergänzt werden. Die noch nicht übernommenen 129 Altaufgaben bleiben in `wiso.html` erreichbar.

Die elf rechtsbezogenen Poolaufgaben bleiben zurückgestellt und können nach einer Prüfung an Primärquellen neu bewertet werden. Die 166 Aufgaben mit freier Eingabe und der WiSo-Anteil sind bewusst nicht bearbeitet; Einzelheiten stehen in [POOLSICHTUNG.md](docs/POOLSICHTUNG.md).
