# Areha – Wissen & Training

## Einstieg und Geltung

- Gilt für `projekte/aydinreha`. Mit `README.md` einsteigen; für den Arbeitsstand `Planung Aydinreha.md` heranziehen.
- Für Aufgaben und Quellen gelten `docs/AUFGABENFORMAT.md`, `docs/DATENUEBERNAHME.md` und bei Poolentscheidungen `docs/POOLSICHTUNG.md`. Für den Wissensatlas gelten `docs/WISSENSATLAS.md` und dessen Rechercheaufgaben.

## Kanonische Daten

- Aufgaben unter `content/aufgaben/`, Auswahl und Quellauszüge unter `content/scanreha/` beziehungsweise `content/wiso/`, Lernkerne und Fälle in `content/katalog.json` redaktionell pflegen. `data/aufgaben.js` wird durch `tools/build-data.js` erzeugt und nicht von Hand bearbeitet.
- Zusätzliche Artikel und externe Empfehlungen stehen ausschließlich in `content/wissen.js`; vorhandene Aufgabenerklärungen nicht dorthin kopieren.
- ScanReha-Pool und `wiso.html` sind Quellen. Änderungen an ihnen nur bei einem entsprechenden ausdrücklichen Auftrag.

## Veröffentlichung

- Ziel ist die statische Website auf GitHub Pages mit `index.html` als Einstieg und den zugehörigen Dateien unter `styles/`, `js/`, `data/`, `content/` und `assets/`.
- Änderungen direkt in diesen Projektdateien pflegen. Es gibt keinen zusätzlichen HTML-Export als Abschlussschritt.

## Prüfung

- Für betroffene Aufgabeninhalte Build und Quellbindung mit den vorhandenen gezielten Node-Prüfungen prüfen, soweit die globalen Prüfgrenzen es erlauben. Browserprüfungen erfordern die ausdrückliche Freigabe zur Browsersteuerung.
- Rechtsbezogene Aufgaben und Aussagen nur mit dokumentierter Prüfung aktueller Primärquellen freigeben. Der ausstehende Poolbestand ist in `docs/POOLSICHTUNG.md` erfasst.
