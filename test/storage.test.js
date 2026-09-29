"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const storage = require("../js/storage.js");
const rounds = require("../js/rounds.js");

function memoryBackend(initial) {
  const map = new Map(Object.entries(initial || {}));
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k)
  };
}

const d = {
  format_version: 1,
  areas: [{ id: "wiso" }],
  materials: [],
  tasks: [
    {
      id: "t1",
      revision: 3,
      area: "wiso",
      subtopic: "x",
      variant_group: "g",
      title: "T",
      stem: "?",
      response: { type: "multiple_choice", required_answers: 2, choices: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }] },
      solution: { choice_ids: ["a", "b"] },
      materials: [],
      requires: [],
      short_explanation: "Weil.",
      help: "Tipp.",
      origin: { kind: "authored", changes: [] }
    }
  ]
};

test("Speichern und Laden erhalten Runde, Antworten, Hilfe und Ergebnis", () => {
  const backend = memoryBackend();
  const store = storage.createStore(backend);
  const state = storage.emptyState();
  const r = rounds.createRound(d, state, { now: "2026-09-25T10:00:00.000Z" });
  rounds.startRound(state, r, { now: "2026-09-25T10:00:00.000Z" });
  rounds.useHelp(r, 0, d, { now: "2026-09-25T10:01:00.000Z" });
  rounds.setAnswer(r, 0, { choice_ids: ["a", "c"] }, d, { now: "2026-09-25T10:02:00.000Z" });
  rounds.checkSlot(r, 0, d, { now: "2026-09-25T10:03:00.000Z" });
  assert.deepEqual(store.save(state), { ok: true });
  const loaded = storage.createStore(backend).load();
  assert.equal(loaded.problem, null);
  assert.deepEqual(loaded.state, state);
  assert.equal(loaded.state.rounds[0].slots[0].task_revision, 3);
  assert.equal(loaded.state.rounds[0].slots[0].result.score, 0);
});

test("der Speicherstand der bisherigen App bleibt unberührt", () => {
  const legacy = JSON.stringify({ rounds: { main: { answers: { 46: "C" } } } });
  const backend = memoryBackend({ wiso40v2: legacy });
  const store = storage.createStore(backend);
  const state = storage.emptyState();
  rounds.startRound(state, rounds.createRound(d, state, {}), {});
  store.save(state);
  store.load();
  assert.equal(backend.getItem("wiso40v2"), legacy);
  assert.deepEqual([...backend.map.keys()].sort(), [storage.KEY, "wiso40v2"].sort());
});

test("beschädigter Stand wird gesichert und leer begonnen", () => {
  const backend = memoryBackend({ [storage.KEY]: "{kaputt" });
  const res = storage.createStore(backend).load();
  assert.equal(res.problem, "corrupt");
  assert.deepEqual(res.state, storage.emptyState());
  assert.equal(backend.getItem(storage.BACKUP_KEY), "{kaputt");
});

test("fehlender Speicher und volles Kontingent werden gemeldet", () => {
  assert.equal(storage.createStore(null).load().problem, "unavailable");
  assert.deepEqual(storage.createStore(null).save(storage.emptyState()), { ok: false, reason: "unavailable" });
  const full = memoryBackend();
  full.setItem = () => {
    const e = new Error("voll");
    e.name = "QuotaExceededError";
    throw e;
  };
  assert.deepEqual(storage.createStore(full).save(storage.emptyState()), { ok: false, reason: "quota" });
});

test("ungültige Runden fallen weg, höchstens eine aktive Runde bleibt", () => {
  const good = { id: "r1", kind: "short", status: "active", created_at: "2026-09-25T10:00:00.000Z", cursor: 9, slots: [{ task_id: "t1", task_revision: 1, answer: { choice_ids: ["a"] }, outcome: null, events: [{ type: "help", at: "2026-09-25T10:00:00.000Z" }, { type: "hack", at: "x" }] }] };
  const second = Object.assign({}, good, { id: "r2" });
  const broken = { id: "r3", status: "completed", created_at: "2026-09-25T10:00:00.000Z", slots: [{ task_id: "t1", task_revision: 1, outcome: "checked", result: { score: 7 } }] };
  const s = storage.sanitizeState({ version: 1, active_round_id: "r2", rounds: [good, second, broken, "unsinn"] });
  assert.deepEqual(
    s.rounds.map((r) => r.id + ":" + r.status),
    ["r1:abandoned", "r2:active"]
  );
  assert.equal(s.active_round_id, "r2");
  assert.equal(s.rounds[1].cursor, 0, "Zeiger wird begrenzt");
  assert.deepEqual(
    s.rounds[1].slots[0].events.map((e) => e.type),
    ["help"]
  );
});

test("Verlauf wird begrenzt, die aktive Runde bleibt erhalten", () => {
  const state = storage.emptyState();
  for (let i = 0; i < storage.MAX_ROUNDS + 5; i++) {
    state.rounds.push({ id: "r" + i, kind: "short", status: "completed", created_at: "2026-09-25T10:00:00.000Z", cursor: 0, slots: [{ task_id: "t1", task_revision: 1, attempt: 1, order: [], answer: null, help_used: false, outcome: "dont_know", result: null, events: [] }] });
  }
  state.rounds[0].status = "active";
  state.active_round_id = "r0";
  const backend = memoryBackend();
  storage.createStore(backend).save(state);
  const loaded = storage.createStore(backend).load().state;
  assert.equal(loaded.rounds.length, storage.MAX_ROUNDS);
  assert.equal(loaded.rounds[0].id, "r0");
  assert.equal(loaded.active_round_id, "r0");
});
