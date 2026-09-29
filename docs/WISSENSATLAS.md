# Wissensatlas und neue Oberfläche

## Durchgängige Bedienkorrekturen vom 29.09.2026

Der Start bietet zwei Aktionen; offene Runden werden über den jeweiligen Üben- oder Wiederholen-Button fortgesetzt. „Lösung anzeigen“ benennt die bisherige Lösungsansicht ausdrücklich. Gemerkte Aufgaben sind aus der Merkliste als vollständige Aufgabenansicht mit Lösung, Erklärung und Materialien erreichbar; eine offene Runde bleibt erhalten. Nach Fehlerwiederholungen setzt der Abschlussbutton die Wiederholung fort, solange Fehler offen sind, andernfalls heißt er „Neue Übungsrunde“. Die Wissenssuche behält ihre Eingabe beim Filtern und Navigieren; Themenseiten führen zur vorherigen Fachbereichsauswahl zurück. Reihenfolgeaufgaben prüfen die sichtbare Reihenfolge direkt. Wissensbeispiele verwenden sachliche Überschriften und vollständige Lösungen aller Antwortformate; leere Quellenbereiche entfallen.

Die vorgesehenen Fassungen wurden vor dem Schreiben auf JavaScript-Syntax sowie gezielt mit einer DOM-Nachbildung geprüft: Merkliste und Rückkehr, Erhalt aktiver Runden, Lösungsansicht, Suchnavigation, beide Reihenfolge-Abläufe, Wiederholung bis zum letzten Fehler sowie die gemeinsame Darstellung der 33 Themen und 196 Aufgaben. Keine interaktive Browser- oder visuelle Prüfung. Die folgenden Abschnitte dokumentieren frühere Stände.

## Vereinfachte Übungsauswahl vom 29.09.2026

Auf Nutzerauftrag bleiben nur „Üben“ mit Hilfe und unmittelbarer Rückmeldung sowie „Falsch beantwortete Aufgaben wiederholen“. Beide verwenden Runden mit bis zu drei Aufgaben. Die Wiederholung berücksichtigt den letzten bewerteten vollständigen Versuch der aktuellen Aufgabenfassung, einschließlich teilweise falscher Antworten. Überspringen, Lösungsansicht und Merken erzeugen keinen Wiederholungsbedarf; eine richtige Antwort entfernt ihn. Bereits richtige Voraussetzungsschritte werden nicht hinzugefügt.

Selbstcheck, Längenwahl, Themen- und Fallrunden, der Übungseinstieg aus Wissensartikeln und der Link zur separaten bisherigen WiSo-Oberfläche sind aus der Oberfläche entfernt. Der beanstandete Bewertungs- und Speicherhinweis entfällt. Es gibt keine Überführung alter offener Modi; laut Nutzer ist die App noch nicht in Gebrauch.

Vor dem Schreiben bestanden 11 gezielte Lernlogiktests, JavaScript-Syntax und der statische Abgleich der Oberflächenelemente mit den vorgesehenen Fassungen im Speicher. Keine Browsersteuerung und keine Anschlussprüfung. Die folgenden Abschnitte beschreiben frühere Stände.

## Oberflächenkorrekturen nach Inspektionslauf 2

Die Quellenmetadaten haben redaktionelle Fassung 3. Die 30 Lernartikel und 28 Quellenziele bleiben erhalten. Karten zählen weiterführende Links nach Typ mit passender Einzahl/Mehrzahl; die wiederholte Angabe „1 Vertiefung“ entfällt. Überschriften der Linklisten nennen nur die tatsächlich vorhandenen Arten. Beschreibungen erläutern Nutzen und Geltungsbereich; ausgelagerte Redaktionsvermerke stehen im [Umsetzungsnachweis](../aydinreha-inspektion/2026-09-26-lauf-2/umsetzung.md). Es gab keinen neuen Quellenabruf und keine neue fachliche Freigabe.

Auf Themenseiten steht der Fachbereich einmal im Themenpfad. Auf schmalen Bildschirmen sind Artikelüberschriften kleiner. Die Seitenleiste folgt weiterhin dem Lesetext; die Smartphone-Entfernung von „Thema üben“ ist noch nicht gemessen. Beim Rücksprung in eine unterstützte Aufgabe erläutert der Hilfekasten die Wertung von Hilfe und Nachschlagen. Keine Browserabnahme dieses Stands.

Konkrete Rechercheaufgaben für alle 30 Lernkerne stehen in [RECHERCHEAUFGABEN-WISSENSATLAS.md](RECHERCHEAUFGABEN-WISSENSATLAS.md).

Aktueller Inhaltsstand vom 26.09.2026: **30 veröffentlichte Wissenskarten und 28 geprüfte Quellenziele** in `content/wissen.js`. Alle vorhandenen Lernkerne haben eine eigene Vertiefung. Fachliche Redaktion, Quellenzuordnung und Rechenprüfung vor dem Schreiben sind im [Recherchevermerk](WISSENSATLAS-RECHERCHE-2026-09-26.md) dokumentiert. Es gibt keine Videoempfehlungen. Keine Test- oder Browserläufe nach der Dateischreibung. Die Oberfläche selbst stammt aus dem früheren Grundlagenausbau.

## Gestaltung und Bedienung

Die lokal überarbeitete Oberfläche vom 26.09.2026 verwendet dunkles Blau, klare Typografie, Türkis für Aktionen sowie sparsame Violett- und Goldakzente. Das zuvor eingesetzte Orbit-/Kristallbild, Leuchteffekte, Slogans und dekorative Nummern wurden entfernt. Überschriften und ergänzende Bereichsangaben sind sachlich gesetzt. Die Bezeichnungen bleiben fachlich und verständlich. Es gibt keine fiktiven Erfahrungspunkte, Level oder Kompetenzversprechen.

Die Startseite beginnt mit dem direkten Einstieg in eine kurze Runde beziehungsweise dem Fortsetzen einer offenen Runde und einem Verweis auf den Wissensatlas. Es folgen längeres Üben/Wiederholung, Selbstcheck, Themenrunde und Fallrunde sowie die drei Fachbereiche mit den Namen aus dem Katalog. Die bisherige WiSo-App bleibt über einen nachgeordneten Link erreichbar.

Der Wissensatlas hat eine Suche und Fachbereichsfilter mit den vollständigen Fachbereichsnamen. Jede Themenseite zeigt die vorhandenen Aufgabenstellungen, Materialien und Erklärungen als aufklappbare Beispiele. Zusätzliche Lernartikel stehen künftig davor, Empfehlungen daneben beziehungsweise auf schmalen Bildschirmen darunter. Die Seitenleiste bleibt im normalen Seitenfluss. „Thema üben“ beginnt die passende Themenrunde. Eine noch offene Runde wird nur über die bestehende Bestätigung beendet. Interne Verweise tragen keinen ↗-Pfeil; das Zeichen bleibt externen Verweisen in einen neuen Tab vorbehalten.

Die lokale Referenz `ct-2026.github.io-main/index.html` dient konzeptionell als Vorbild für gestufte Erklärungen und kontextbezogenes Weiterlesen. Es wurden keine Inhalte oder Linkempfehlungen daraus kopiert; auch dort war die zentrale Linkliste leer.

## Dateien und Datenfluss

| Datei | Aufgabe |
|---|---|
| `index.html` | Startseite, Navigation und Wissensansicht |
| `styles/atlas.css` | Neue Gestaltung über den vorhandenen Basis- und Formatstilen |
| `js/knowledge.js` | Suche, Themenansicht, Lernartikel, Empfehlungen und Anschluss im Feedback |
| `js/app.js` | Hash-Navigation, Rundeneinstieg und Behandlung von Unterstützung |
| `content/wissen.js` | Einzige redaktionelle Quelle zusätzlicher Artikel und Empfehlungen |
| `data/aufgaben.js` | Vorhandene Aufgaben und Erklärungen; unverändert aus dem Aufgaben-Build |

`content/wissen.js` ist eine direkt eingebundene Datendatei. Sie benötigt keinen Build und keinen Server. Dadurch bleibt auch das Öffnen von `index.html` als lokale Datei möglich. Es gibt keine neue Paketabhängigkeit, keinen Netzwerkaufruf beim Start und keine eingebetteten Videoplayer. Vorhandene lokale Schriften werden weiterverwendet.

Routen:

- `#start`: Startseite.
- `#training`: Trainingsabschnitt der Startseite.
- `#wissen`: Alle Themen mit Suche.
- `#wissen/bereich/wwk`: Ein Fachbereich; ebenfalls `wiso` oder `verkauf`.
- `#wissen/thema/wwk.rabatt-skonto`: Eine Themenseite. Die Kennung entspricht `units[].id` im Katalog und `variant_group` der Aufgaben.

Unbekannte Themen führen zur Themenübersicht mit einem Hinweis. Themenrouten lassen sich direkt verlinken und nach Neuladen erneut öffnen. Der Suchtext ist vorübergehend und wird nicht gespeichert.

## Zusätzliche Lernartikel

Die Datei `content/wissen.js` enthält `AREHA_KNOWLEDGE` mit `version`, `articles` und `resources`. Die redaktionelle Fassung 3 enthält 30 Artikel und 28 Quellen. Die bereits vorhandenen Erklärungen werden zur Laufzeit aus den Aufgaben gelesen und nicht dupliziert. Zusätzliche redaktionelle Felder `source_ids` und `reviewed_at` dokumentieren je Artikel die Quellenkennungen und den Bearbeitungsstand; die bestehende Darstellung benötigt diese Felder nicht.

Ein Artikel hat folgende Struktur; die Platzhalter dienen nur der Dokumentation:

```json
{
  "id": "bezugskalkulation-verstehen",
  "unit_id": "wwk.rabatt-skonto",
  "status": "draft",
  "title": "Titel der Vertiefung",
  "intro": "Kurze Einordnung des Zusammenhangs.",
  "sections": [
    { "title": "Grundidee", "text": "Redaktionell auszuarbeitende Erklärung." },
    { "title": "An einem Beispiel", "text": "Redaktionell auszuarbeitender Rechenweg." }
  ],
  "takeaway": "Der zentrale Gedanke zum Mitnehmen."
}
```

Artikel werden erst bei `status: "published"` angezeigt. `unit_id` muss zu einem bestehenden Lernkern passen. `title` und mindestens ein Abschnitt gehören zum Mindestumfang. `intro` und `takeaway` sind optional. Texte unterstützen das vorhandene Format mit Absätzen, Listen und `**fett**`; beliebiges HTML wird nicht ausgeführt. Quellen zu einem Artikel werden in `resources` mit demselben Lernkern gepflegt.

## Artikel, Videos und Quellen verlinken

Eine Empfehlung hat dieses Format:

```json
{
  "id": "bezugskalkulation-quelle",
  "unit_ids": ["wwk.rabatt-skonto"],
  "task_ids": [],
  "kind": "reference",
  "status": "draft",
  "title": "Aussagekräftiger Titel der Quelle",
  "publisher": "Herausgeber oder Kanal",
  "url": "",
  "checked_at": "",
  "description": "Was diese Quelle erklärt und wofür sie hilfreich ist.",
  "duration_minutes": 5
}
```

| Feld | Bedeutung |
|---|---|
| `unit_ids` | Lernkerne, auf deren Themenseiten die Empfehlung erscheint |
| `task_ids` | Optional: konkretes Aufgabenfeedback eingrenzen; leer bedeutet alle Aufgaben der zugeordneten Lernkerne |
| `kind` | `article`, `video` oder `reference` |
| `status` | `draft` für Vorbereitung; `reviewed` für eine redaktionell geprüfte Empfehlung |
| `url` | Vollständige HTTPS-Adresse ohne eingebettete Zugangsdaten |
| `checked_at` | Tatsächliches Prüfdatum in `YYYY-MM-DD` |
| `publisher` | Benannter Herausgeber, sichtbar neben Domain und Datum |
| `description` | Optionale kurze Einordnung |
| `duration_minutes` | Optionale Lese- oder Videodauer |

Bei der späteren Recherche werden Zielseite, fachliche Eignung und Zugänglichkeit geprüft. Danach werden die tatsächliche Adresse und das tatsächliche Prüfdatum eingetragen und `status` auf `reviewed` gesetzt. Die App zeigt nur freigegebene Empfehlungen mit Titel, Herausgeber, unterstütztem Typ, plausibler HTTPS-Adresse und gültigem, nicht künftigem Prüfdatum an.

Diese technische Filterung prüft weder Erreichbarkeit noch fachliche Richtigkeit einer Website. Das sichtbare Datum beschreibt die dokumentierte redaktionelle Prüfung und garantiert keine dauerhafte Aktualität. Am 26.09.2026 wurden 28 tatsächlich geöffnete Quellenziele freigegeben. Texte und PDF-Textauszüge wurden fachlich geprüft; eingebettete Rechner, Videos und interaktive Bedienung nicht. Kommerzielle Quellen und eingeschränkte fachliche Geltungsbereiche sind in den Beschreibungen kenntlich gemacht. Leere Listen zeigen weiterhin einen Hinweis statt Platzhalterlinks.

Externe Seiten öffnen durch bewussten Klick in einem neuen Tab mit `noopener noreferrer`. Videos werden verlinkt, nicht automatisch geladen oder abgespielt. Es gibt keine externen Vorschaubilder, Tracking-Einbettungen oder URL-Vorabfragen.

## Wissen und Übungsstand

Lesen außerhalb einer Übungsrunde erzeugt weder einen Versuch noch einen Fortschrittseintrag. In einer laufenden normalen Runde zählt das Öffnen einer passenden Themenseite für ihre noch offenen Aufgaben als Unterstützung. Dafür verwendet die App die vorhandene Kennzeichnung `help_used`, einschließlich Speicherung und sichtbarem Hinweis. Der Besuch der reinen Themenübersicht löst das nicht aus.

Bei einem aktiven Selbstcheck bleibt der Wissensatlas bis zur Abgabe beziehungsweise zum bestätigten Start einer neuen Runde gesperrt, auch nach Unterbrechen oder über eine direkte Themenroute. Die Rückmeldung bietet den Themenanschluss erst an, wenn sie nach den bestehenden Rundenregeln sichtbar ist.

## Stand und weitere Arbeit

Alle 30 Themen enthalten nun eigenständige Erklärtexte, Beispiele und Merksätze vor den bisherigen Aufgabenbeispielen. Die Quellen stehen in der vorhandenen Empfehlungsspalte. Änderungen werden in `content/wissen.js` gepflegt und von `index.html` direkt geladen. Ein Aufgabenbuild ist für reine Änderungen dieser Zusatztexte nicht nötig.

Die Umsetzung wurde lokal geschrieben. Gemäß dem geltenden Anschlussprüfungsverbot erfolgten danach keine Tests, Browseraufrufe, Sichtprüfungen oder Datei-Kontrolllesungen. Eine funktionale oder visuelle Abnahme dieses neuen Ausbaus steht daher aus; die bisherigen Abnahmeergebnisse gelten nur für den früheren Stand.

## Incoming-Ergänzung vom 26.09.2026

12 zusätzliche Karten ergeben insgesamt 42 Artikel für 33 Lernkerne. Die drei neuen Lernkerne behandeln Güterarten, rechtliche Grundbegriffe und Konjunktur. Weitere Vertiefungen ergänzen Bilanz, Kasse, Rabattfolge, Reklamation, Nutzenargumente, Sortiment, Werbeplan, Werbeerfolg und Pfand. Es wurden keine neuen geprüften Rechtsempfehlungen veröffentlicht. [Integrationsvermerk](INTEGRATION-INCOMING-2026-09-26.md).
