"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const format = require("../js/format.js");

function baseData() {
  return {
    format_version: 1,
    areas: [{ id: "wiso", title: "Wirtschafts- und Sozialkunde", short_title: "WiSo", subtopics: [{ id: "sozial", title: "Sozialversicherung" }] }],
    materials: [
      {
        id: "mat-tabelle",
        revision: 1,
        title: "Tabelle",
        kind: "table",
        table: { columns: [{ label: "", align: "left" }, { label: "Wert", align: "right" }], rows: [{ cells: ["A", "1"] }] },
        origin: { kind: "authored", changes: [] }
      }
    ],
    tasks: [
      {
        id: "aufgabe-eins",
        revision: 1,
        area: "wiso",
        subtopic: "sozial",
        variant_group: "wiso.test",
        title: "Titel",
        stem: "Frage mit **fett**?",
        response: { type: "single_choice", choices: [{ id: "a", text: "A" }, { id: "b", text: "B" }] },
        solution: { choice_ids: ["a"] },
        materials: [{ id: "mat-tabelle", placement: "before_stem" }],
        requires: [],
        short_explanation: "Weil.",
        error_paths: [{ id: "b-falsch", choice_ids: ["b"], text: "Nein." }],
        origin: { kind: "authored", changes: [] }
      }
    ]
  };
}

function errorsAfter(mutate) {
  const d = baseData();
  mutate(d);
  return format.validateData(d);
}

test("gültiger Datenstand ohne Fehler", () => {
  assert.deepEqual(format.validateData(baseData()), []);
});

test("Lösung muss zu Antwortalternativen und Anzahl passen", () => {
  assert.match(errorsAfter((d) => (d.tasks[0].solution.choice_ids = ["x"])).join(), /keine Antwortalternative/);
  assert.match(errorsAfter((d) => (d.tasks[0].solution.choice_ids = ["a", "b"])).join(), /genau 1 richtige/);
  assert.match(
    errorsAfter((d) => {
      d.tasks[0].response = { type: "multiple_choice", required_answers: 2, choices: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }] };
      d.tasks[0].solution.choice_ids = ["a"];
    }).join(),
    /genau 2 richtige/
  );
});

test("Fehlwege dürfen keine richtige Antwort erklären", () => {
  assert.match(errorsAfter((d) => (d.tasks[0].error_paths[0].choice_ids = ["a"])).join(), /ist richtig und kein Fehlweg/);
});

test("Zuordnung muss Mehrfachverwendung festlegen und jedes Ziel lösen", () => {
  const errs = errorsAfter((d) => {
    d.tasks[0].response = {
      type: "matching",
      targets: [{ id: "t1", text: "Ziel 1" }, { id: "t2", text: "Ziel 2" }],
      choices: [{ id: "a", text: "A" }, { id: "b", text: "B" }]
    };
    d.tasks[0].solution = { matches: [{ target_id: "t1", choice_id: "a" }] };
    delete d.tasks[0].error_paths;
  }).join("\n");
  assert.match(errs, /mehrfach verwendet/);
  assert.match(errs, /Ziel t2 ohne Lösung/);
});

test("Reihenfolge braucht vollständige Lösungsfolge", () => {
  const errs = errorsAfter((d) => {
    d.tasks[0].response = { type: "ordering", entries: [{ id: "e1", text: "1" }, { id: "e2", text: "2" }] };
    d.tasks[0].solution = { ordered_entry_ids: ["e1"] };
    delete d.tasks[0].error_paths;
  }).join();
  assert.match(errs, /genau einmal/);
});

test("Texte ohne HTML und mit vollständiger Fettmarkierung", () => {
  assert.match(errorsAfter((d) => (d.tasks[0].stem = "Frage <b>fett</b>")).join(), /enthält HTML/);
  assert.match(errorsAfter((d) => (d.tasks[0].stem = "Frage **offen")).join(), /unvollständige/);
});

test("Verweise: Material, Voraussetzungen, Kreise, ungenutzte Materialien", () => {
  assert.match(errorsAfter((d) => (d.tasks[0].materials[0].id = "mat-fehlt")).join(), /existiert nicht/);
  assert.match(errorsAfter((d) => (d.tasks[0].requires = ["gibt-es-nicht"])).join(), /existiert nicht/);
  assert.match(errorsAfter((d) => (d.tasks[0].materials = [])).join(), /von keiner Aufgabe verwendet/);
  const cyc = errorsAfter((d) => {
    const b = JSON.parse(JSON.stringify(d.tasks[0]));
    b.id = "aufgabe-zwei";
    b.materials = [];
    d.tasks.push(b);
    d.tasks[0].requires = ["aufgabe-zwei"];
    d.tasks[1].requires = ["aufgabe-eins"];
  }).join();
  assert.match(cyc, /Kreis/);
});

test("Herkunft: Umgestaltung beschreiben, Übernahme unverändert, Quelle angeben", () => {
  assert.match(errorsAfter((d) => (d.tasks[0].origin = { kind: "adapted", changes: [], source: { project: "scanreha", id: "x", revision: 1, solution_id: "s", solution_revision: 1 } })).join(), /muss beschrieben werden/);
  assert.match(errorsAfter((d) => (d.tasks[0].origin = { kind: "adopted", changes: [] })).join(), /source/);
  assert.match(
    errorsAfter((d) => (d.tasks[0].origin = { kind: "adopted", changes: [], source: { project: "scanreha", id: "x", revision: 1 } })).join(),
    /solution_id/
  );
});

test("Übernahme aus dem Web-Bestand braucht die Zuordnung der alten ID", () => {
  const src = { project: "wiso-web", id: "46", revision: "sha256:0123456789abcdef" };
  assert.match(errorsAfter((d) => (d.tasks[0].origin = { kind: "adopted", changes: [], source: src })).join(), /wiso40v2:46/);
  assert.deepEqual(
    errorsAfter((d) => {
      d.tasks[0].origin = { kind: "adopted", changes: [], source: src };
      d.tasks[0].legacy_ids = ["wiso40v2:46"];
    }),
    []
  );
});

test("Rechtsbezogene Aufgaben brauchen eine dokumentierte Prüfung", () => {
  assert.match(errorsAfter((d) => (d.tasks[0].legal = true)).join(), /rechtsbezogene Aufgabe/);
  assert.deepEqual(
    errorsAfter((d) => {
      d.tasks[0].legal = true;
      d.tasks[0].checks = [{ kind: "legal", date: "2026-09-25", text: "Geprüft.", sources: [{ title: "§ 1", url: "https://example.org" }] }];
    }),
    []
  );
});

test("unbekannte Felder werden gemeldet", () => {
  assert.match(errorsAfter((d) => (d.tasks[0].solutionn = {})).join(), /unbekanntes Feld solutionn/);
});
