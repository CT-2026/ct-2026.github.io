# Gemeinsames Aufgabenformat (Formatversion 1)

Das Format gilt für alle Web-Aufgaben unabhängig von ihrer Herkunft. Build, Tests und App prüfen es mit derselben Datei: [js/format.js](../js/format.js). Veröffentlicht wird der Bestand als `data/aufgaben.js`. Die Datei wird aus `content/` erzeugt und nicht von Hand bearbeitet (siehe [Datenübernahme](DATENUEBERNAHME.md)).

## Veröffentlichter Bestand

`data/aufgaben.js` setzt `window.AREHA_DATA`. Ein klassisches Skript statt JSON wird verwendet, damit die Seite auch direkt als Datei (`file://`) funktioniert.

| Feld | Inhalt |
|---|---|
| `format_version` | `1` |
| `data_revision` | Prüfsumme des Bestands; eine Runde speichert sie zur Information |
| `areas` | Fachbereiche mit Unterthemen (aus `content/fachbereiche.json`) |
| `materials` | Materialien |
| `tasks` | Aufgaben |
| `units` | Lernkerne aus `content/katalog.json`: `id` entspricht der `variant_group`, dazu `area` und `title`; Grundlage der Themenauswahl |
| `cases` | Fallfolgen aus `content/katalog.json`: `id`, `title`, `description` und geordnete `task_ids`; zwei bis sechs verschiedene Aufgaben |
| `legacy_tasks` | Explizite Zuordnungen ausgewählter Altaufgaben mit ursprünglicher Antwortstruktur und Lösung für die Übernahme alter Ergebnisse |

## Aufgabe

| Feld | Pflicht | Bedeutung |
|---|---|---|
| `id` | ja | Eigene Aufgaben-ID, stabil; Kleinbuchstaben, Ziffern, Bindestriche |
| `revision` | ja | Inhaltsrevision ab 1; siehe „Revisionen“ |
| `area`, `subtopic` | ja | Fachbereich und Unterthema |
| `method_ids` | nein | Rechenmethode(n); bei ScanReha-Aufgaben die Methoden mit Rolle `target` |
| `variant_group` | ja | Gemeinsame Variantenkennung fachlich zusammengehöriger Aufgaben |
| `title` | ja | Kurzer Sachtitel, der keine Antwort verrät |
| `stem` | ja | Aufgabentext |
| `response` | ja | Antwortform mit stabilen Antwort-IDs (siehe unten) |
| `solution` | ja | Lösung zur Antwortform |
| `materials` | ja | Materialverweise `{ id, placement }` mit `before_stem` oder `after_stem`; auch leer |
| `requires` | ja | Voraussetzungen: Aufgaben, deren Ergebnis benötigt wird; auch leer |
| `short_explanation` | ja | Kurze Erklärung: der entscheidende fachliche Grund |
| `help` | nein | Optionale kleine Hilfe |
| `detailed_explanation` | nein | Ausführliche Erläuterung, in der App aufklappbar |
| `error_paths` | nein | Definierte Fehlwege (siehe unten) |
| `legacy_ids` | nein | Ausdrückliche Zuordnung alter IDs, z. B. `wiso40v2:46`; Pflicht bei Übernahmen aus dem Web-Bestand |
| `origin` | ja | Herkunft: `kind` = `adopted` (Übernahme), `adapted` (redaktionelle Umgestaltung) oder `authored` (eigene Aufgabe); `source` mit Quellprojekt, Quell-ID, Quellrevision und bei ScanReha der verwendeten Lösung; `changes` beschreibt Umgestaltungen; `notes` optional |
| `legal` | nein | `true` für rechtsbezogene Inhalte |
| `checks` | nein | Prüfvermerke `{ kind, date, text, sources }`; `kind` = `legal`, `arithmetic` oder `content`. Eine rechtsbezogene Aufgabe braucht mindestens einen `legal`-Vermerk mit Quellen |

## Antwortformen

| `response.type` | `response` | `solution` und Antwort | Übungsbewertung (0 bis 1) |
|---|---|---|---|
| `single_choice` | `choices` | `choice_ids` mit genau einer ID | 1 oder 0 |
| `multiple_choice` | `choices`, `required_answers` | `choice_ids` mit genau `required_answers` IDs | (richtige − falsche Markierungen) / Zahl der richtigen, mindestens 0 |
| `matching` | `targets`, `choices`, `reuse_choices` | `matches` aus `{ target_id, choice_id }` | Anteil richtig zugeordneter Ziele, ohne Abrundung |
| `ordering` | `entries` | `ordered_entry_ids` | 1 nur bei vollständig richtiger Folge; abweichende Stellen werden ausgewiesen |

`shuffle: false` hält die Reihenfolge der Antwortalternativen fest, etwa bei aufsteigend sortierten Rechenergebnissen. Sonst mischt jede Runde einmal und speichert die Reihenfolge. Die Buchstaben A, B, C … bezeichnen nur Positionen, die IDs bleiben stabil.

Die App stellt alle vier Antwortformen dar. Zuordnung nutzt native Auswahlfelder; bereits belegte Antworten stehen bei `reuse_choices: false` nicht erneut zur Auswahl. Reihenfolge nutzt Hoch-/Runter-Schaltflächen und eine ausdrückliche Übernahme der sichtbaren Folge. Eine Ausgangsfolge wird erst durch eine Aktion zur Antwort.

Die Bewertung heißt **Übungsbewertung**. Sie behauptet keinen offiziellen Prüfungsschlüssel.

## Fehlwege

Ein Fehlweg erklärt eine bestimmte falsche Antwort (`choice_ids`, bei Zuordnungen `matches`). Er darf keine richtige Antwort nennen, und jede Antwortalternative gehört höchstens zu einem Fehlweg. Die App zeigt die Erklärung nur, wenn die gewählte Antwort einem definierten Fehlweg entspricht. Für Reihenfolgen sind noch keine Fehlwege vorgesehen.

## Textformat

Texte verwenden nur `**fett**`, Zeilenumbrüche, Leerzeilen für Absätze und Zeilen mit `- ` für Listen. HTML ist nicht erlaubt. Die App erzeugt daraus DOM-Knoten und verwendet dafür kein `innerHTML`.

## Material

| Feld | Bedeutung |
|---|---|
| `id`, `revision`, `title` | Kennung (`mat-…`), Inhaltsrevision, Titel |
| `kind` | `table`, `text` oder `image` |
| `intro`, `note`, `source_note` | Einleitung, Hinweis, Quellenangabe |
| `table` | `columns` (`label`, `align` = `left`/`right`) und `rows` (`cells`, optional `emphasis`) |
| `text` | Text bei `kind: text` |
| `image` | Bei `kind: image`: `src` als lokaler relativer Pfad unter `assets/`, `alt` als kurzer Alternativtext und `description` als vollständige Textfassung |
| `origin` | wie bei Aufgaben |

## Revisionen

Alle Materialarten lassen sich in einer nativen Dialogansicht vergrößern. Escape oder die Schaltfläche schließt die Ansicht; der Fokus kehrt zum öffnenden Element zurück. Bilder werden als Dateien eingebunden. Änderungen an `image` gehören zu einer neuen Materialrevision.

Bei einer erledigten Aufgabe mit geänderter Revision bleibt das gespeicherte Ergebnis als ausdrücklich historische Angabe sichtbar, im Rückblick wie in einer noch offenen Runde. Aufgabe, Lösung und Erklärung stammen aus der aktuellen Fassung; die frühere Antwort wird weder auf neue Antwortfelder übertragen noch neu bewertet. Fehlwegerklärungen und Trefferzahlen der alten Antwort werden dabei nicht auf die neue Fassung angewendet. Ein noch aktiver Selbstcheck zeigt weiterhin keine Lösungen. Auch der Rückblick früherer Runden zeigt für Aufgaben eines offenen Selbstchecks bis zur Abgabe weder frühere Antwort noch Lösung, Bewertung, Hilfe oder Erklärung. Gesperrte Antwortfelder tragen keine Aufforderung zum Auswählen, Zuordnen oder Umsortieren. Bildmaterial zeigt die vollständige Textfassung standardmäßig geöffnet.

Die Runden verlassen sich auf die Inhaltsrevision: Eine offene Aufgabe mit neuer Revision beginnt in der Runde neu, und eine erledigte behält ihr Ergebnis als historische Angabe. Deshalb gilt:

- Jede Änderung an `title`, `stem`, `response`, `solution`, `materials`, `requires`, `help`, `short_explanation`, `detailed_explanation` oder `error_paths` erhöht `revision`.
- Eine neue Materialrevision erhöht auch die Revision der verwendenden Aufgaben.
- Prüfvermerke und Herkunftsnotizen verlangen keine neue Revision.

`npm run build` vergleicht mit dem zuletzt erzeugten `data/aufgaben.js` und bricht ab, wenn sich der Inhalt bei gleicher Revision geändert hat.

## Rundenzustand im Browser

Gespeichert wird unter `localStorage["areha.v1"]` ([js/storage.js](../js/storage.js)). Der Speicherstand der bisherigen App (`wiso40v2`) wird ausschließlich bei ausdrücklich gestarteter Übernahme gelesen und niemals verändert. Bestehende Stände von `areha.v1` bleiben lesbar; fehlende Merklisten und Altdaten werden mit leeren Werten ergänzt.

| Ebene | Felder |
|---|---|
| Stand | `version`, `active_round_id`, `rounds` (höchstens 200, die aktive bleibt immer erhalten), `bookmarks` (Aufgaben-IDs), `legacy` (Übernahmezeitpunkt und historische Einträge) |
| Runde | `id`, `kind` (`short`, `long`, `theme`, `repeat`, `exam`, `case`), bei Fallrunden `case_id`, `status` (`active`, `completed`, `abandoned`), Zeitpunkte, `data_revision`, `cursor`, `slots` |
| Aufgabenplatz | `task_id`, `task_revision`, `attempt` (1 = Erstversuch), `order`, `answer`, `help_used`, `outcome` (`checked`, `dont_know`, `skipped`, `unanswered` oder leer), `result` (`score`, `status`), `events`, gegebenenfalls `stale` |

„Kleine Hilfe“, „Prüfen“, „Weiß ich noch nicht“ und „Überspringen“ werden als getrennte Ereignisse festgehalten. Ein selbstständig gelöster Erstversuch liegt nur vor, wenn die Aufgabe zum ersten Mal bearbeitet, ohne Hilfe geprüft und richtig beantwortet wurde. Eine zuvor mit „Weiß ich noch nicht“ erklärte Aufgabe zählt danach nicht mehr als Erstversuch.

Ein beschädigter Stand wird unter `areha.v1.defekt` gesichert; danach beginnt ein leerer Stand.

Eine ausgewählte Fallfolge belegt exakt die in `task_ids` angekündigte Anzahl von Aufgabenplätzen und behält deren Reihenfolge. Sie nutzt dieselben Renderer, Bewertungen und Speicherfunktionen wie andere Übungsrunden. Fall-ID und Bearbeitungsposition bleiben beim Neuladen erhalten. Ein normaler Start über „Kurz üben“ bleibt bei drei Aufgaben. Themenrunden können zusätzlich zur Fachbereichsfilterung über die Lernkern-ID eingeschränkt werden.

Der Katalog verlangt eindeutige Lernkern- und Fall-IDs, passende Fachbereiche sowie vorhandene, verschiedene Aufgaben in jedem Fall. Wenn Aufgaben Voraussetzungen besitzen, müssen diese im Fall vorher stehen. Die drei aktuellen Fälle verwenden gemeinsame Materialien; jede Teilaufgabe enthält beziehungsweise verlinkt alle benötigten Ausgangsangaben und bleibt auch nach einer falschen oder übersprungenen Teilaufgabe lösbar.

Prüfungsrunden (`exam`) erlauben keine Einzelprüfung, Hilfe oder Lösungsanzeige während der Bearbeitung. Antworten bleiben bis `submitExam` änderbar. Die gemeinsame Abgabe speichert das Ereignis `submit`, bewertet vollständig beantwortete Aufgaben und kennzeichnet fehlende oder unvollständige Antworten als `unanswered`. Eine unvollständige Zuordnung kann entsprechend ihrer richtigen Teilantworten Punkte erhalten und bleibt dabei ausdrücklich als offen ausgewiesen. Andere Runden werden durch die Abgabe nicht geändert.

`js/learning.js` leitet Wiederholung und Fortschritt aus dem letzten gespeicherten Ergebnis je aktueller Aufgabenrevision ab. Unabgegebene Prüfungsrunden und veraltete Ergebnisse zählen dabei nicht. Merken bleibt unabhängig vom Ergebnis möglich. Die Fortschrittsanzeige unterscheidet richtig ohne Hilfe und richtig mit Hilfe, behauptet aber keinen Erstversuch oder Kompetenzgrad. Historische Altangaben zählen nicht in diese Fortschrittswerte; kompatible falsche Altantworten können zur Wiederholung angeboten werden, solange noch kein neueres Ergebnis vorliegt.

`refreshLegacy` ordnet beim Laden bisher unbekannte, schon importierte Rohantworten neu hinzugekommenen expliziten Altzuordnungen zu. Der Importzeitpunkt und die Rohantwort bleiben erhalten; `wiso40v2` wird dafür nicht erneut gelesen. Eine umgestaltete Antwortform bleibt historisch. Bereits zugeordnete Einträge und danach entfernte Merkungen werden durch diesen Ergänzungsschritt nicht erneut verändert.

## Incoming-Erweiterung vom 26.09.2026

origin.source.project: incoming bezeichnet die beiden explizit gelieferten Dateien. Ihre ursprünglichen Aufgaben, Punkte und Bildbeschreibungen stehen in content/incoming/auszuege.json; die Eins-zu-eins-Zuordnung steht in content/incoming/auswahl.json. Quellrevision 1 bezeichnet den dort archivierten Importstand. Vollständige Aufgaben werden direkt unter content/aufgaben/ gepflegt, ohne ein zusätzliches quellenspezifisches Build-Modul.

checks.kind: legal_waiver dokumentiert ausschließlich einen ausdrücklichen Nutzerverzicht auf Rechtsabgleiche, keine bestandene Prüfung. Ein solcher Vermerk benötigt Datum und Begründung und ersetzt bei legal: true nur für Quellprojekt incoming den sonst notwendigen legal-Vermerk. Für andere Quellen bleibt die bisherige Anforderung bestehen.
