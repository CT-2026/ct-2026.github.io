"use strict";
/*
 * Prüft den veröffentlichten Aufgabenbestand gegen die redaktionelle Quelle,
 * rechnet Zahlenangaben nach und belegt das Abschlusskriterium von Etappe 1.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const build = require("../tools/build-data.js");
const wiso = require("../tools/wiso-auszug.js");
const scanrehaTool = require("../tools/scanreha-auszug.js");
const rounds = require("../js/rounds.js");
const storage = require("../js/storage.js");
const scoring = require("../js/scoring.js");

const ROOT = path.resolve(__dirname, "..");
const result = build.build();
const data = result.data;
const byId = Object.fromEntries(data.tasks.map((t) => [t.id, t]));
const mat = Object.fromEntries(data.materials.map((m) => [m.id, m]));

function euro(text) {
  return Math.round(parseFloat(String(text).replace(/[^\d,]/g, "").replace(",", ".")) * 100);
}
function percent(text) {
  return parseFloat(String(text).replace(/[^\d,]/g, "").replace(",", "."));
}
function num(text) {
  return parseInt(String(text).replace(/\./g, ""), 10);
}
// Kaufmännisch auf Cent runden; Beträge in Cent.
function minus(cents, pct) {
  return cents - Math.round((cents * pct) / 100);
}
function fmtEuro(cents) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}
function memoryBackend(initial) {
  const map = new Map(Object.entries(initial || {}));
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
}

test("Build ohne Fehler; data/aufgaben.js entspricht der redaktionellen Quelle", () => {
  assert.deepEqual(result.errors, []);
  assert.equal(fs.readFileSync(result.output, "utf8"), result.text, "npm run build ausführen");
});

test("Quellauszug des Web-Bestands ist aktuell", () => {
  const lines = [];
  assert.equal(wiso.run(["--check"], { log: (l) => lines.push(l) }), 0, lines.join("\n"));
});

test("ScanReha-Auszüge sind aktuell (nur mit erreichbarem Pool)", (t) => {
  const lines = [];
  let diff;
  try {
    diff = scanrehaTool.run(["--check"], { log: (l) => lines.push(l) });
  } catch (e) {
    if (/Pool nicht gefunden|Manifest nicht gefunden/.test(e.message)) return t.skip("ScanReha-Pool nicht vorhanden");
    throw e;
  }
  assert.equal(diff, 0, lines.join("\n"));
});

test("jede Aufgabe hat Hilfe, kurze und ausführliche Erklärung", () => {
  data.tasks.forEach((t) => {
    assert.ok(t.help, t.id + ": Hilfe");
    assert.ok(t.short_explanation, t.id + ": kurze Erklärung");
    assert.ok(t.detailed_explanation, t.id + ": ausführliche Erklärung");
  });
});

test("Bezugspreis: richtiges Ergebnis und jeder Fehlweg sind nachgerechnet", () => {
  const t = byId["wwk-bezugspreis-rabatt-skonto"];
  const rows = Object.fromEntries(mat["mat-angebote-sweatshirts"].table.rows.map((r) => [r.cells[0], r.cells]));
  const [, listA, listB] = rows["Listenpreis"].map((c, i) => (i ? euro(c) : c));
  const [, rabA, rabB] = rows["Rabatt"].map((c, i) => (i ? percent(c) : c));
  const [, skoA, skoB] = rows["Skonto"].map((c, i) => (i ? percent(c) : c));
  const expected = {
    richtig: minus(minus(listB, rabB), skoB),
    "angebot-a-abgelesen": minus(minus(listA, rabA), skoA),
    "prozentsaetze-addiert": minus(listB, rabB + skoB),
    "skonto-vergessen": minus(listB, rabB),
    "rabatt-vergessen": minus(listB, skoB)
  };
  assert.equal(fmtEuro(expected.richtig), "14,85 €");
  assert.equal(fmtEuro(expected["angebot-a-abgelesen"]), rows["Bezugspreis"][1], "Tabellenwert Angebot A");
  const text = (id) => t.response.choices.find((c) => c.id === id).text;
  assert.equal(text(t.solution.choice_ids[0]), fmtEuro(expected.richtig));
  t.error_paths.forEach((p) => {
    assert.ok(expected[p.id] !== undefined, "Fehlweg ohne Rechenregel: " + p.id);
    assert.equal(text(p.choice_ids[0]), fmtEuro(expected[p.id]), p.id);
  });
  const all = t.response.choices.map((c) => c.text);
  assert.equal(new Set(all).size, all.length, "keine doppelten Ergebnisse");
  // Der Lösungswert stammt aus der gebundenen ScanReha-Lösung.
  const ex = JSON.parse(fs.readFileSync(path.join(ROOT, "content/scanreha/auszuege/wwk-bezugspreis-rabatt-skonto.json"), "utf8"));
  const sol = ex.solutions.find((s) => s.id === ex.answer_solution_id);
  assert.equal(Math.round(parseFloat(sol.answer.value) * 100), expected.richtig);
});

test("Unfallstatistik: Lösung und Zahlen der Rückmeldungen stimmen mit der Tabelle", () => {
  const t = byId["wiso-unfallstatistik-auswerten"];
  const row = Object.fromEntries(mat["mat-unfallstatistik-uv"].table.rows.map((r) => [r.cells[0], { prev: num(r.cells[1]), cur: num(r.cells[2]) }]));
  const truth = {
    "choice-1": row["Meldepflichtige Arbeitsunfälle"].cur > row["Meldepflichtige Arbeitsunfälle"].prev,
    "choice-2": row["Meldepflichtige Wegeunfälle"].prev > row["Meldepflichtige Wegeunfälle"].cur,
    "choice-3": row["Tödliche Arbeitsunfälle"].cur > row["Tödliche Arbeitsunfälle"].prev,
    "choice-4": row["Tödliche Wegeunfälle"].cur > row["Tödliche Wegeunfälle"].prev,
    "choice-5": row["Tödliche Unfälle zusammen"].cur < row["Tödliche Unfälle zusammen"].prev,
    "choice-6": row["Meldepflichtige Unfälle zusammen"].prev < row["Meldepflichtige Unfälle zusammen"].cur
  };
  const right = Object.keys(truth).filter((k) => truth[k]);
  assert.deepEqual(right, t.solution.choice_ids.slice().sort());
  const dW = row["Tödliche Wegeunfälle"].cur - row["Tödliche Wegeunfälle"].prev;
  const dA = row["Tödliche Arbeitsunfälle"].prev - row["Tödliche Arbeitsunfälle"].cur;
  assert.equal(dW, 27);
  assert.equal(dA, 21);
  assert.equal(row["Tödliche Unfälle zusammen"].cur - row["Tödliche Unfälle zusammen"].prev, dW - dA);
  assert.match(t.detailed_explanation, /um 27/);
  assert.match(t.detailed_explanation, /um 21/);
  assert.match(t.detailed_explanation, /um 6/);
});

test("Runden mit dem echten Bestand: drei Fachbereiche, zwei Runden decken alle sechs Aufgaben ab", () => {
  for (let seed = 1; seed <= 25; seed++) {
    let s = seed;
    const random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    const state = storage.emptyState();
    const r1 = rounds.createRound(data, state, { random, types: ["single_choice", "multiple_choice"] });
    assert.deepEqual(r1.slots.map((x) => byId[x.task_id].area).sort(), ["verkauf", "wiso", "wwk"]);
    rounds.startRound(state, r1, {});
    r1.slots.forEach((_, i) => rounds.dontKnow(r1, i, {}));
    rounds.completeRound(state, r1, {});
    const r2 = rounds.createRound(data, state, { random, types: ["single_choice", "multiple_choice"] });
    const ids = new Set(r1.slots.concat(r2.slots).map((x) => x.task_id));
    assert.equal(ids.size, 6);
  }
});

test("Etappe 1: bestehende Aufgabe 46 durchläuft das neue Format einschließlich Speicherung", () => {
  // 1. Quelle: Aufgabe 46 der bisherigen App, direkt aus wiso.html gelesen.
  const source = wiso.extractTask(wiso.loadWiso(path.join(ROOT, "wiso.html")), "46");
  const task = byId["wiso-wegeunfall-heilkosten"];
  assert.equal(task.stem, source.stem);
  assert.deepEqual(task.response.choices, source.choices);
  assert.deepEqual(task.solution.choice_ids, source.correct);
  assert.equal(task.origin.source.revision, wiso.revisionOf(source));
  assert.deepEqual(task.legacy_ids, ["wiso40v2:46"]);

  // 2. Bearbeitung in einer Runde und Speicherung.
  const only = Object.assign({}, data, { tasks: [task] });
  const legacy = JSON.stringify({ rounds: { main: { answers: { 46: "A" } } } });
  const backend = memoryBackend({ wiso40v2: legacy });
  const state = storage.emptyState();
  const r = rounds.createRound(only, state, {});
  rounds.startRound(state, r, {});
  rounds.setAnswer(r, 0, { choice_ids: ["C"] }, only, {});
  assert.deepEqual(storage.createStore(backend).save(state), { ok: true });

  // 3. Neu laden (wie nach dem Schließen des Browsers) und fortsetzen.
  const loaded = storage.createStore(backend).load().state;
  const resumed = rounds.activeRound(loaded);
  assert.equal(resumed.id, r.id);
  assert.equal(rounds.reconcileRound(resumed, only, {}), false);
  assert.deepEqual(resumed.slots[0].answer, { choice_ids: ["C"] });
  assert.equal(rounds.checkSlot(resumed, 0, only, {}).status, "correct");
  assert.ok(rounds.completeRound(loaded, resumed, {}));
  storage.createStore(backend).save(loaded);
  const final = storage.createStore(backend).load().state;
  assert.equal(final.rounds[0].status, "completed");
  assert.equal(final.rounds[0].slots[0].task_revision, task.revision);
  assert.equal(scoring.evaluate(task, final.rounds[0].slots[0].answer).score, 1);
  assert.equal(backend.getItem("wiso40v2"), legacy, "alter Speicherstand unverändert");
});
