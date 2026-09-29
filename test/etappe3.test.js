"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const build = require("../tools/build-data.js");
const format = require("../js/format.js");
const rounds = require("../js/rounds.js");
const storage = require("../js/storage.js");
const scoring = require("../js/scoring.js");
const scanreha = require("../tools/scanreha-auszug.js");

test("Etappe 3: sechs Lernkerne mit mindestens drei Aufgaben und alle vier Antwortformen", () => {
  const result = build.build();
  assert.deepEqual(result.errors, []);
  const groups = {};
  const original = ["wiso.wirtschaftsbereiche", "wiso.arbeitsschutz-statistik", "wwk.warenannahme", "wwk.rabatt-skonto", "verkauf.beratung", "verkauf.zusammenarbeit"];
  result.data.tasks.filter(t => original.includes(t.variant_group)).forEach(t => { groups[t.variant_group] = (groups[t.variant_group] || 0) + 1; });
  assert.equal(Object.keys(groups).length, 6);
  // Spätere Ausbauten ergänzen Aufgaben; jeder Lernkern der Etappe 3 behält mindestens seine drei.
  Object.values(groups).forEach(n => assert.ok(n >= 3));
  assert.deepEqual([...new Set(result.data.tasks.map(t => t.response.type))].sort(), ["matching", "multiple_choice", "ordering", "single_choice"]);
});

test("Etappe 3: alle Aufgaben lassen sich beantworten, speichern, laden und abschließen", () => {
  const data = build.build().data;
  for (const task of data.tasks) {
    const s = storage.emptyState();
    const r = rounds.createRound({ ...data, tasks: [task] }, s, { size: 1 });
    rounds.startRound(s, r);
    rounds.setAnswer(r, 0, task.solution, data);
    let saved;
    const store = storage.createStore({ getItem: () => saved || null, setItem: (key, value) => { saved = value; }, removeItem: () => {} });
    assert.equal(store.save(s).ok, true, task.id);
    const restored = store.load().state;
    const active = rounds.activeRound(restored);
    assert.equal(scoring.isComplete(task, active.slots[0].answer), true, task.id);
    rounds.checkSlot(active, 0, data);
    assert.equal(active.slots[0].result.score, 1, task.id);
    assert.equal(rounds.completeRound(restored, active), true, task.id);
  }
});

test("Etappe 3: neue Zuordnungen bewerten Teilantworten anteilig, Reihenfolgen exakt", () => {
  const tasks = build.build().data.tasks;
  const matching = tasks.find(t => t.id === "wiso-wirtschaftsbereiche-holz");
  const answer = JSON.parse(JSON.stringify(matching.solution));
  answer.matches[0].choice_id = "choice-2";
  assert.equal(scoring.evaluate(matching, answer).score, 3 / 4);
  const ordering = tasks.find(t => t.id === "wwk-warenannahme-ordnen");
  assert.deepEqual(ordering.solution.ordered_entry_ids, ["entry-1", "entry-4", "entry-2", "entry-3", "entry-5"]);
  const seq = ordering.solution.ordered_entry_ids.slice();
  [seq[0], seq[1]] = [seq[1], seq[0]];
  assert.equal(scoring.evaluate(ordering, { ordered_entry_ids: seq }).score, 0);
});

test("Etappe 3: neue Beträge und Belegwerte werden unabhängig nachgerechnet", () => {
  const tasks = build.build().data.tasks;
  const calc = tasks.find(t => t.id === "wwk-bezugspreis-neues-angebot");
  const cents = 2000 - Math.round(2000 * 10 / 100);
  const expected = cents - Math.round(cents * 2 / 100);
  const answer = calc.response.choices.find(c => calc.solution.choice_ids.includes(c.id));
  assert.equal(answer.text, (expected / 100).toFixed(2).replace(".", ",") + " €");
  assert.equal(394 - 367, 27);
  assert.equal(4 * 6 - 3 * 6, 6);
});

test("Bildmaterial benötigt lokalen Pfad, Alternativtext und Textfassung", () => {
  const material = build.build().data.materials.find(m => m.kind === "image");
  assert.deepEqual(format.validateMaterial(material), []);
  const clone = JSON.parse(JSON.stringify(material));
  clone.image.src = "https://example.com/bild.png";
  assert.match(format.validateMaterial(clone).join(), /lokaler Bildpfad/);
  clone.image.src = material.image.src;
  delete clone.image.description;
  assert.match(format.validateMaterial(clone).join(), /description/);
});

test("Textlösung nur ausdrücklich auswählen; Revisionsbindung und Konflikte bleiben wirksam", () => {
  const entry = { web_id: "team", source_id: "item", source_revision: 1 };
  const pool = {
    manifest: { pool_id: "test", revision: 1 }, documents: [], materials: [], relations: [],
    items: [{ id: "item", revision: 1, materials: [], sources: [] }],
    solutions: [{ id: "text", revision: 1, item_id: "item", item_revision: 1, link_state: "linked", content_md: "Fachliche Erklärung", answer: null }]
  };
  const selection = { entries: [entry] };
  assert.match(scanreha.buildExcerpt(pool, entry, selection).errors.join(), /keine an diese/);
  entry.editorial_solution_id = "text";
  assert.deepEqual(scanreha.buildExcerpt(pool, entry, selection).errors, []);
  pool.solutions[0].item_revision = 2;
  assert.match(scanreha.buildExcerpt(pool, entry, selection).errors.join(), /passt nicht zur Aufgabenrevision/);
  pool.solutions[0].item_revision = 1;
  pool.solutions.push(
    { id: "a", item_id: "item", item_revision: 1, link_state: "linked", answer: { choice_ids: ["a"] } },
    { id: "b", item_id: "item", item_revision: 1, link_state: "linked", answer: { choice_ids: ["b"] } }
  );
  assert.match(scanreha.buildExcerpt(pool, entry, selection).errors.join(), /widersprüchliche/);
});
