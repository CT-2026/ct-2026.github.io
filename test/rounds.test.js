"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const rounds = require("../js/rounds.js");
const storage = require("../js/storage.js");

// Deterministischer Zufall für reproduzierbare Tests.
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function task(id, area, extra) {
  return Object.assign(
    {
      id,
      revision: 1,
      area,
      subtopic: "x",
      variant_group: area + "." + id,
      title: id,
      stem: "?",
      response: { type: "single_choice", choices: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }] },
      solution: { choice_ids: ["a"] },
      materials: [],
      requires: [],
      short_explanation: "Weil.",
      help: "Tipp.",
      origin: { kind: "authored", changes: [] }
    },
    extra || {}
  );
}

function data(tasks) {
  return {
    format_version: 1,
    data_revision: "test",
    areas: [{ id: "wiso" }, { id: "wwk" }, { id: "verkauf" }],
    materials: [],
    tasks
  };
}

const six = data([task("w1", "wiso"), task("w2", "wiso"), task("k1", "wwk"), task("k2", "wwk"), task("v1", "verkauf"), task("v2", "verkauf")]);
const areaOf = (d, id) => d.tasks.find((t) => t.id === id).area;
let clock = 0;
const at = () => new Date(Date.UTC(2026, 8, 25, 10, 0, clock++)).toISOString();

function playRound(state, d, random) {
  const r = rounds.createRound(d, state, { now: at(), random });
  rounds.startRound(state, r, { now: at() });
  r.slots.forEach((s, i) => {
    rounds.setAnswer(r, i, { choice_ids: ["b"] }, d, { now: at() });
    rounds.checkSlot(r, i, d, { now: at() });
  });
  assert.ok(rounds.completeRound(state, r, { now: at() }));
  return r;
}

test("eine Dreier-Runde mischt die drei Fachbereiche", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const r = rounds.createRound(six, storage.emptyState(), { random: seeded(seed), now: at() });
    assert.equal(r.slots.length, 3);
    assert.deepEqual(r.slots.map((s) => areaOf(six, s.task_id)).sort(), ["verkauf", "wiso", "wwk"]);
  }
});

test("die nächste Runde vermeidet die Aufgaben der Vorrunde", () => {
  const state = storage.emptyState();
  const first = playRound(state, six, seeded(3));
  const second = rounds.createRound(six, state, { random: seeded(4), now: at() });
  const firstIds = first.slots.map((s) => s.task_id);
  second.slots.forEach((s) => assert.ok(firstIds.indexOf(s.task_id) === -1, s.task_id + " sofort wiederholt"));
});

test("zusammengehörige Varianten werden über Runden verteilt", () => {
  const d = data([task("a1", "wiso", { variant_group: "g" }), task("a2", "wiso", { variant_group: "g" }), task("a3", "wiso"), task("a4", "wiso")]);
  for (let seed = 1; seed <= 20; seed++) {
    const r = rounds.createRound(d, storage.emptyState(), { random: seeded(seed), now: at() });
    const ids = r.slots.map((s) => s.task_id);
    assert.ok(!(ids.includes("a1") && ids.includes("a2")), "beide Varianten in einer Runde");
  }
});

test("Voraussetzungen belegen Plätze und stehen vorher; zu lange Fälle entfallen", () => {
  const d = data([
    task("basis", "wwk"),
    task("folge", "wwk", { requires: ["basis"] }),
    task("lang3", "verkauf", { requires: ["lang2"] }),
    task("lang2", "verkauf", { requires: ["lang1"] }),
    task("lang1", "verkauf", { requires: ["lang0"] }),
    task("lang0", "verkauf"),
    task("w", "wiso")
  ]);
  for (let seed = 1; seed <= 30; seed++) {
    const r = rounds.createRound(d, storage.emptyState(), { random: seeded(seed), now: at() });
    const ids = r.slots.map((s) => s.task_id);
    assert.ok(ids.length <= 3);
    if (ids.includes("folge")) assert.ok(ids.indexOf("basis") > -1 && ids.indexOf("basis") < ids.indexOf("folge"));
    assert.ok(!ids.includes("lang3"), "Fall mit vier Aufgaben passt nicht in eine Dreier-Runde");
  }
});

test("Hilfe, Prüfen, Weiß-ich-noch-nicht und Überspringen sind getrennte Vorgänge", () => {
  const state = storage.emptyState();
  const r = rounds.createRound(six, state, { random: seeded(7), now: at() });
  rounds.startRound(state, r, { now: at() });
  assert.equal(rounds.checkSlot(r, 0, six, { now: at() }), null, "ohne Antwort keine Prüfung");
  assert.ok(rounds.useHelp(r, 0, six, { now: at() }));
  assert.ok(rounds.useHelp(r, 0, six, { now: at() }), "wiederholte Hilfe zählt nicht doppelt");
  rounds.setAnswer(r, 0, { choice_ids: ["a"] }, six, { now: at() });
  const ev = rounds.checkSlot(r, 0, six, { now: at() });
  assert.equal(ev.status, "correct");
  assert.deepEqual(
    r.slots[0].events.map((e) => e.type),
    ["help", "check"]
  );
  assert.equal(rounds.setAnswer(r, 0, { choice_ids: ["b"] }, six, { now: at() }), false, "geprüfte Aufgabe bleibt fest");

  assert.ok(rounds.skipSlot(r, 1, { now: at() }));
  assert.equal(rounds.canComplete(r), false);
  assert.ok(rounds.dontKnow(r, 2, { now: at() }));
  assert.equal(rounds.canComplete(r), true, "übersprungene Aufgaben blockieren den Abschluss nicht");
  // Übersprungene Aufgabe kann bis zum Abschluss noch bearbeitet werden.
  rounds.setAnswer(r, 1, { choice_ids: ["b"] }, six, { now: at() });
  assert.equal(rounds.checkSlot(r, 1, six, { now: at() }).status, "wrong");
  assert.deepEqual(
    r.slots[1].events.map((e) => e.type),
    ["skip", "check"]
  );

  assert.ok(rounds.completeRound(state, r, { now: at() }));
  assert.equal(state.active_round_id, null);
  const sum = rounds.summarize(r);
  assert.deepEqual(
    sum.items.map((i) => i.category),
    ["correct_help", "wrong", "dont_know"]
  );
  assert.equal(sum.items[0].first_attempt_alone, false, "mit Hilfe gelöst zählt nicht als selbstständiger Erstversuch");
  assert.equal(rounds.checkSlot(r, 2, six, { now: at() }), null, "abgeschlossene Runde bleibt unverändert");
});

test("Versuchszählung: eine bereits erklärte Aufgabe ist kein Erstversuch mehr", () => {
  const d = data([task("nur", "wiso")]);
  const state = storage.emptyState();
  const r1 = rounds.createRound(d, state, { now: at() });
  rounds.startRound(state, r1, { now: at() });
  rounds.dontKnow(r1, 0, { now: at() });
  rounds.completeRound(state, r1, { now: at() });
  const r2 = rounds.createRound(d, state, { now: at() });
  assert.equal(r2.slots[0].attempt, 2);
  rounds.startRound(state, r2, { now: at() });
  rounds.setAnswer(r2, 0, { choice_ids: ["a"] }, d, { now: at() });
  rounds.checkSlot(r2, 0, d, { now: at() });
  const item = rounds.summarize(r2).items[0];
  assert.equal(item.category, "correct_alone");
  assert.equal(item.first_attempt_alone, false);
});

test("Runden sind voneinander unabhängig; eine neue Runde beendet die offene", () => {
  const state = storage.emptyState();
  const r1 = rounds.createRound(six, state, { random: seeded(11), now: at() });
  rounds.startRound(state, r1, { now: at() });
  rounds.setAnswer(r1, 0, { choice_ids: ["a"] }, six, { now: at() });
  const snapshot = JSON.stringify(r1.slots);
  const r2 = rounds.createRound(six, state, { random: seeded(12), now: at() });
  rounds.startRound(state, r2, { now: at() });
  assert.equal(r1.status, "abandoned");
  assert.equal(state.active_round_id, r2.id);
  rounds.setAnswer(r2, 0, { choice_ids: ["b"] }, six, { now: at() });
  rounds.checkSlot(r2, 0, six, { now: at() });
  assert.equal(JSON.stringify(r1.slots), snapshot, "Antworten der ersten Runde unverändert");
});

test("Antwortreihenfolge je Runde fest; shuffle:false behält die Reihenfolge", () => {
  const fixed = task("fest", "wwk", { response: Object.assign({}, task("x", "wwk").response, { shuffle: false }) });
  const d = data([fixed]);
  for (let seed = 1; seed <= 10; seed++) {
    const r = rounds.createRound(d, storage.emptyState(), { random: seeded(seed), now: at() });
    assert.deepEqual(r.slots[0].order, ["a", "b", "c"]);
  }
  const r = rounds.createRound(six, storage.emptyState(), { random: seeded(5), now: at() });
  const t = six.tasks.find((x) => x.id === r.slots[0].task_id);
  assert.deepEqual(
    rounds.orderedItems(t, r.slots[0]).map((c) => c.id),
    r.slots[0].order
  );
});

test("Abgleich nach Inhaltsänderung: offene Aufgaben neu, erledigte historisch", () => {
  const state = storage.emptyState();
  const r = rounds.createRound(six, state, { random: seeded(2), now: at() });
  rounds.startRound(state, r, { now: at() });
  rounds.setAnswer(r, 0, { choice_ids: ["a"] }, six, { now: at() });
  rounds.checkSlot(r, 0, six, { now: at() });
  rounds.setAnswer(r, 1, { choice_ids: ["b"] }, six, { now: at() });
  const changed = JSON.parse(JSON.stringify(six));
  const bump = (id) => (changed.tasks.find((t) => t.id === id).revision = 2);
  bump(r.slots[0].task_id);
  bump(r.slots[1].task_id);
  changed.tasks = changed.tasks.filter((t) => t.id !== r.slots[2].task_id);
  assert.ok(rounds.reconcileRound(r, changed, { now: at(), random: seeded(1) }));
  assert.equal(r.slots[0].stale, "revision_changed");
  assert.equal(r.slots[0].result.status, "correct", "Ergebnis bleibt als historische Angabe");
  assert.equal(r.slots[1].task_revision, 2);
  assert.equal(r.slots[1].answer, null, "Antwort auf die alte Fassung gilt nicht für die neue");
  assert.equal(r.slots[1].events.slice(-1)[0].type, "revision_update");
  assert.equal(r.slots[2].stale, "missing");
  assert.equal(rounds.isEditable(r, 0), false);
  assert.equal(rounds.nextOpenIndex(r, 0), 1);
  assert.equal(rounds.reconcileRound(r, changed, { now: at() }), false, "zweiter Abgleich ändert nichts");
});

test("nextOpenIndex läuft ringförmig und überspringt erledigte Aufgaben", () => {
  const state = storage.emptyState();
  const r = rounds.createRound(six, state, { random: seeded(9), now: at() });
  rounds.startRound(state, r, { now: at() });
  assert.equal(rounds.nextOpenIndex(r, 0), 1);
  rounds.dontKnow(r, 1, { now: at() });
  assert.equal(rounds.nextOpenIndex(r, 0), 2);
  rounds.dontKnow(r, 2, { now: at() });
  assert.equal(rounds.nextOpenIndex(r, 2), 0);
  rounds.dontKnow(r, 0, { now: at() });
  assert.equal(rounds.nextOpenIndex(r, 0), null);
});
